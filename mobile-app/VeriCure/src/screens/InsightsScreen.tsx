import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import BottomNavBar from './BottomNavBar';
import { useTheme } from '../theme/ThemeContext';

import {
  fetchVerificationHistory,
  RawVerificationScan,
} from '../utils/verificationHistory';

// ============================================================
// TYPES
// ============================================================

export type VerificationResult =
  | 'genuine'
  | 'counterfeit'
  | 'unknown';

export interface VerificationRecord {
  id?: string | number;
  date?: string | Date;
  result: VerificationResult;
}

interface Props {
  email: string;
  onHomePress?: () => void;
  onInsightsPress?: () => void;
  onProfilePress?: () => void;
}

type TimeView = 'daily' | 'weekly';

interface ActivityItem {
  label: string;
  genuine: number;
  counterfeit: number;
  total: number;
}

// ============================================================
// SCREEN
// ============================================================

export default function InsightsScreen({
  email,
  onHomePress,
  onInsightsPress,
  onProfilePress,
}: Props) {
  const { colors } = useTheme();

  const [timeView, setTimeView] =
    useState<TimeView>('daily');

  // ==========================================================
  // FETCH REAL SCAN HISTORY
  // ==========================================================

  const [rawScans, setRawScans] =
    useState<RawVerificationScan[]>([]);

  const [isLoadingHistory, setIsLoadingHistory] =
    useState(true);

  useEffect(() => {

    let isCancelled = false;

    const loadHistory = async () => {

      setIsLoadingHistory(true);

      const scans =
        await fetchVerificationHistory(email);

      if (!isCancelled) {
        setRawScans(scans);
        setIsLoadingHistory(false);
      }
    };

    loadHistory();

    return () => {
      isCancelled = true;
    };

  }, [email]);

  /*
   * Maps raw backend scans (GENUINE/COUNTERFEIT/UNKNOWN,
   * scannedAt) into the shape the rest of this screen's
   * charts/calculations already expect. Everything below
   * this point is unchanged from before — it just now
   * operates on real data instead of an empty array.
   */
  const verificationHistory: VerificationRecord[] =
    useMemo(() => {
      return rawScans.map((scan) => ({
        id: scan.id,
        date: scan.scannedAt,
        result:
          (scan.result || 'UNKNOWN').toLowerCase() as VerificationResult,
      }));
    }, [rawScans]);

  // ==========================================================
  // HISTORY DATA
  // ==========================================================

  const totalScans = verificationHistory.length;

  const genuineCount = verificationHistory.filter(
    item => item.result === 'genuine',
  ).length;

  const counterfeitCount = verificationHistory.filter(
    item => item.result === 'counterfeit',
  ).length;

  const unknownCount = verificationHistory.filter(
    item => item.result === 'unknown',
  ).length;

  const classifiedCount =
    genuineCount + counterfeitCount;

  const genuinePercentage =
    totalScans > 0
      ? Math.round(
          (genuineCount / totalScans) * 100,
        )
      : 0;

  const counterfeitPercentage =
    totalScans > 0
      ? Math.round(
          (counterfeitCount / totalScans) * 100,
        )
      : 0;

  // ==========================================================
  // SAFETY SCORE
  // ==========================================================

  const safetyScore =
    classifiedCount > 0
      ? Math.round(
          (genuineCount / classifiedCount) * 100,
        )
      : 0;

  let safetyStatus = 'No Verification Data';

  let safetyDescription =
    'Verify medicines to generate your verification insights.';

  if (totalScans > 0) {
    if (safetyScore >= 80) {
      safetyStatus = 'Healthy Verification Results';

      safetyDescription =
        `Only ${counterfeitPercentage}% of your scanned medicines were identified as counterfeit.`;
    } else if (safetyScore >= 50) {
      safetyStatus = 'Moderate Risk Level';

      safetyDescription =
        `${counterfeitPercentage}% of your scanned medicines were identified as counterfeit.`;
    } else {
      safetyStatus = 'High Counterfeit Risk';

      safetyDescription =
        'A high percentage of scanned medicines were identified as counterfeit.';
    }
  }

  // ==========================================================
  // DATE HELPER
  // ==========================================================

  const getRecordDate = (
    record: VerificationRecord,
  ): Date | null => {
    if (!record.date) {
      return null;
    }

    const parsedDate =
      record.date instanceof Date
        ? record.date
        : new Date(record.date);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  };

  // ==========================================================
  // DAILY ACTIVITY
  // ==========================================================

  const dailyData = useMemo<ActivityItem[]>(() => {
    const result: ActivityItem[] = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);

      day.setHours(0, 0, 0, 0);
      day.setDate(now.getDate() - i);

      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const records =
        verificationHistory.filter(record => {
          const recordDate = getRecordDate(record);

          if (!recordDate) {
            return false;
          }

          return (
            recordDate >= day &&
            recordDate < nextDay
          );
        });

      const genuine = records.filter(
        record => record.result === 'genuine',
      ).length;

      const counterfeit = records.filter(
        record => record.result === 'counterfeit',
      ).length;

      result.push({
        label: day.toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        genuine,
        counterfeit,
        total: records.length,
      });
    }

    return result;
  }, [verificationHistory]);

  // ==========================================================
  // WEEKLY ACTIVITY
  // ==========================================================

  const weeklyData = useMemo<ActivityItem[]>(() => {
    const result: ActivityItem[] = [];

    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const endDate = new Date(now);

      endDate.setHours(23, 59, 59, 999);
      endDate.setDate(
        now.getDate() - i * 7,
      );

      const startDate = new Date(endDate);

      startDate.setDate(
        endDate.getDate() - 6,
      );

      startDate.setHours(0, 0, 0, 0);

      const records =
        verificationHistory.filter(record => {
          const recordDate = getRecordDate(record);

          if (!recordDate) {
            return false;
          }

          return (
            recordDate >= startDate &&
            recordDate <= endDate
          );
        });

      const genuine = records.filter(
        record => record.result === 'genuine',
      ).length;

      const counterfeit = records.filter(
        record => record.result === 'counterfeit',
      ).length;

      result.push({
        label: `W${4 - i}`,
        genuine,
        counterfeit,
        total: records.length,
      });
    }

    return result;
  }, [verificationHistory]);

  // ==========================================================
  // SELECTED ACTIVITY
  // ==========================================================

  const activityData =
    timeView === 'daily'
      ? dailyData
      : weeklyData;

  // ==========================================================
  // CHART MAXIMUM
  // ==========================================================

  const chartMaximum = Math.max(
    ...activityData.map(item =>
      Math.max(
        item.genuine,
        item.counterfeit,
      ),
    ),
    1,
  );

  // ==========================================================
  // UI
  // ==========================================================

  if (isLoadingHistory) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator
          size="small"
          color={colors.primary}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Verification Insights
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              {
                color: colors.primary,
              },
            ]}
          >
            Your medicine verification overview
          </Text>
        </View>
      </View>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* ===================================================
            SAFETY CARD
        =================================================== */}

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Market Safety Meter
          </Text>

          <Text
            style={[
              styles.cardSubtitle,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Current verification safety index
          </Text>

          {/* SAFETY METER */}

          <View style={styles.meterContainer}>
            <View style={styles.meterTrack}>
              <View
                style={[
                  styles.meterDanger,
                  {
                    flex:
                      totalScans > 0
                        ? counterfeitPercentage
                        : 50,
                  },
                ]}
              />

              <View
                style={[
                  styles.meterSafe,
                  {
                    backgroundColor:
                      colors.primary,
                    flex:
                      totalScans > 0
                        ? genuinePercentage
                        : 50,
                  },
                ]}
              />
            </View>

            <View
              style={[
                styles.meterCenter,
                {
                  backgroundColor:
                    colors.cardSecondary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.meterScore,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {safetyScore}%
              </Text>

              <Text
                style={[
                  styles.meterLabel,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                SAFETY
              </Text>
            </View>
          </View>

          {/* STATUS */}

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    totalScans === 0
                      ? '#64748B'
                      : safetyScore >= 80
                      ? colors.primary
                      : '#EF4444',
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: colors.text,
                },
              ]}
            >
              {safetyStatus}
            </Text>
          </View>

          <Text
            style={[
              styles.description,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {safetyDescription}
          </Text>
        </View>

        {/* ===================================================
            AUTHENTICATION SUMMARY
        =================================================== */}

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Authentication Summary
          </Text>

          <Text
            style={[
              styles.cardSubtitle,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {totalScans}{' '}
            {totalScans === 1
              ? 'total medicine scan'
              : 'total medicine scans'}
          </Text>

          {/* PROGRESS */}

          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor:
                  colors.cardSecondary,
              },
            ]}
          >
            {totalScans > 0 && (
              <>
                {genuineCount > 0 && (
                  <View
                    style={[
                      styles.genuineProgress,
                      {
                        backgroundColor:
                          colors.primary,
                        flex: genuineCount,
                      },
                    ]}
                  />
                )}

                {counterfeitCount > 0 && (
                  <View
                    style={[
                      styles.counterfeitProgress,
                      {
                        flex: counterfeitCount,
                      },
                    ]}
                  />
                )}

                {unknownCount > 0 && (
                  <View
                    style={[
                      styles.unknownProgress,
                      {
                        flex: unknownCount,
                      },
                    ]}
                  />
                )}
              </>
            )}
          </View>

          {/* LEGEND */}

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      colors.primary,
                  },
                ]}
              />

              <Text
                style={[
                  styles.legendText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Genuine {genuinePercentage}%
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      '#EF4444',
                  },
                ]}
              />

              <Text
                style={[
                  styles.legendText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Counterfeit {counterfeitPercentage}%
              </Text>
            </View>
          </View>

          {unknownCount > 0 && (
            <View style={styles.unknownRow}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      '#64748B',
                  },
                ]}
              />

              <Text
                style={[
                  styles.legendText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Unknown {unknownCount}
              </Text>
            </View>
          )}
        </View>

        {/* ===================================================
            STATISTICS
        =================================================== */}

        <View style={styles.statsRow}>
          {/* GENUINE */}

          <View
            style={[
              styles.statCard,
              {
                backgroundColor:
                  colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.genuineIconText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ✓
              </Text>
            </View>

            <Text
              style={[
                styles.statNumber,
                {
                  color: colors.text,
                },
              ]}
            >
              {genuineCount}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Verified Genuine
            </Text>
          </View>

          {/* COUNTERFEIT */}

          <View
            style={[
              styles.statCard,
              {
                backgroundColor:
                  colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor: '#3A1820',
                },
              ]}
            >
              <Text
                style={[
                  styles.counterfeitIconText,
                  {
                    color: '#EF4444',
                  },
                ]}
              >
                !
              </Text>
            </View>

            <Text
              style={[
                styles.statNumber,
                {
                  color: colors.text,
                },
              ]}
            >
              {counterfeitCount}
            </Text>

            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Suspected Counterfeit
            </Text>
          </View>
        </View>

        {/* ===================================================
            SCAN ACTIVITY
        =================================================== */}

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.activityHeader}>
            <View style={styles.activityTitle}>
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Scan Activity
              </Text>

              <Text
                style={[
                  styles.cardSubtitle,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Verification frequency trends
              </Text>
            </View>

            {/* DAILY / WEEKLY */}

            <View
              style={[
                styles.segmentContainer,
                {
                  backgroundColor:
                    colors.cardSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  timeView === 'daily' && {
                    backgroundColor:
                      colors.primary,
                  },
                ]}
                onPress={() =>
                  setTimeView('daily')
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color:
                        timeView === 'daily'
                          ? '#FFFFFF'
                          : colors.textMuted,
                    },
                  ]}
                >
                  Daily
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  timeView === 'weekly' && {
                    backgroundColor:
                      colors.primary,
                  },
                ]}
                onPress={() =>
                  setTimeView('weekly')
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color:
                        timeView === 'weekly'
                          ? '#FFFFFF'
                          : colors.textMuted,
                    },
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* EMPTY STATE */}

          {totalScans === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconContainer,
                  {
                    backgroundColor:
                      colors.iconBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emptyIcon,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  ✓
                </Text>
              </View>

              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                No verification activity
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Your medicine verification
                activity will appear here
                after your first scan.
              </Text>
            </View>
          ) : (
            <>
              {/* CHART */}

              <View
                style={[
                  styles.chart,
                  {
                    borderBottomColor:
                      colors.border,
                  },
                ]}
              >
                {activityData.map(
                  (item, index) => {
                    const genuineHeight =
                      item.genuine > 0
                        ? Math.max(
                            4,
                            (item.genuine /
                              chartMaximum) *
                              75,
                          )
                        : 0;

                    const counterfeitHeight =
                      item.counterfeit > 0
                        ? Math.max(
                            4,
                            (item.counterfeit /
                              chartMaximum) *
                              75,
                          )
                        : 0;

                    return (
                      <View
                        key={`${item.label}-${index}`}
                        style={
                          styles.chartColumn
                        }
                      >
                        <View
                          style={styles.bars}
                        >
                          <View
                            style={[
                              styles.genuineBar,
                              {
                                backgroundColor:
                                  colors.primary,
                                height:
                                  genuineHeight,
                              },
                            ]}
                          />

                          <View
                            style={[
                              styles.counterfeitBar,
                              {
                                height:
                                  counterfeitHeight,
                              },
                            ]}
                          />
                        </View>

                        <Text
                          style={[
                            styles.chartLabel,
                            {
                              color:
                                colors.textMuted,
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  },
                )}
              </View>

              {/* ACTIVITY LIST */}

              <View
                style={styles.activityList}
              >
                {activityData.map(
                  (item, index) => (
                    <View
                      key={`${item.label}-activity-${index}`}
                      style={[
                        styles.activityRow,
                        {
                          borderBottomColor:
                            colors.border,
                        },
                      ]}
                    >
                      <View>
                        <Text
                          style={[
                            styles.activityLabel,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          {item.label}
                        </Text>

                        <Text
                          style={[
                            styles.activitySubLabel,
                            {
                              color:
                                colors.textMuted,
                            },
                          ]}
                        >
                          {item.total}{' '}
                          {item.total === 1
                            ? 'total scan'
                            : 'total scans'}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.badgesContainer
                        }
                      >
                        {/* GENUINE BADGE */}

                        <View
                          style={[
                            styles.badge,
                            styles.genuineBadge,
                            {
                              backgroundColor:
                                colors.iconBackground,
                              borderColor:
                                colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.genuineBadgeText,
                              {
                                color:
                                  colors.primary,
                              },
                            ]}
                          >
                            ✓ {item.genuine}
                          </Text>
                        </View>

                        {/* COUNTERFEIT BADGE */}

                        <View
                          style={[
                            styles.badge,
                            styles.counterfeitBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.counterfeitBadgeText,
                              {
                                color:
                                  '#FCA5A5',
                              },
                            ]}
                          >
                            ! {item.counterfeit}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ),
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* =====================================================
          BOTTOM NAVIGATION
      ===================================================== */}

      <BottomNavBar
        activeTab="insights"
        onTabChange={tab => {
          if (tab === 'home') {
            onHomePress?.();
            return;
          }

          if (tab === 'insights') {
            onInsightsPress?.();
            return;
          }

          if (tab === 'profile') {
            onProfilePress?.();
            return;
          }
        }}
      />
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // CONTAINER
  // ==========================================================

  container: {
    flex: 1,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  headerSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // ==========================================================
  // CARD
  // ==========================================================

  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  cardSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },

  // ==========================================================
  // SAFETY METER
  // ==========================================================

  meterContainer: {
    height: 130,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  meterTrack: {
    width: 220,
    height: 110,
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
    overflow: 'hidden',
    flexDirection: 'row',
  },

  meterDanger: {
    backgroundColor: '#EF4444',
  },

  meterSafe: {},

  meterCenter: {
    position: 'absolute',
    bottom: 0,
    width: 82,
    height: 62,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  meterScore: {
    fontSize: 19,
    fontWeight: '900',
  },

  meterLabel: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 1,
  },

  // ==========================================================
  // STATUS
  // ==========================================================

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  statusText: {
    fontSize: 15,
    fontWeight: '800',
  },

  description: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },

  // ==========================================================
  // PROGRESS
  // ==========================================================

  progressTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    marginTop: 17,
    marginBottom: 14,
  },

  genuineProgress: {
    height: '100%',
  },

  counterfeitProgress: {
    height: '100%',
    backgroundColor: '#EF4444',
  },

  unknownProgress: {
    height: '100%',
    backgroundColor: '#64748B',
  },

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 6,
  },

  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },

  unknownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  // ==========================================================
  // STATISTICS
  // ==========================================================

  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    marginHorizontal: -5,
  },

  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    marginHorizontal: 5,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  genuineIconText: {
    fontSize: 20,
    fontWeight: '900',
  },

  counterfeitIconText: {
    fontSize: 20,
    fontWeight: '900',
  },

  statNumber: {
    fontSize: 25,
    fontWeight: '900',
  },

  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  // ==========================================================
  // ACTIVITY HEADER
  // ==========================================================

  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  activityTitle: {
    flex: 1,
    paddingRight: 8,
  },

  // ==========================================================
  // DAILY / WEEKLY
  // ==========================================================

  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 3,
    borderWidth: 1,
  },

  segmentButton: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 7,
  },

  segmentText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // ==========================================================
  // CHART
  // ==========================================================

  chart: {
    height: 105,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    paddingBottom: 7,
  },

  chartColumn: {
    alignItems: 'center',
  },

  bars: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  genuineBar: {
    width: 7,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginRight: 3,
  },

  counterfeitBar: {
    width: 7,
    backgroundColor: '#EF4444',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  chartLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 5,
  },

  // ==========================================================
  // ACTIVITY LIST
  // ==========================================================

  activityList: {
    marginTop: 7,
  },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
  },

  activityLabel: {
    fontSize: 13,
    fontWeight: '800',
  },

  activitySubLabel: {
    fontSize: 10,
    marginTop: 2,
  },

  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    marginLeft: 6,
  },

  genuineBadge: {},

  genuineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  counterfeitBadge: {
    backgroundColor: '#3A1820',
    borderColor: '#7F1D1D',
  },

  counterfeitBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
  },

  emptyIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyIcon: {
    fontSize: 24,
    fontWeight: '900',
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  emptyDescription: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 250,
    marginTop: 5,
  },
});