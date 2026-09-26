import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import {
  fetchVerificationHistory,
  formatScanDate,
  isScanAuthentic,
  mapScanToMedicine,
  RawVerificationScan,
} from '../utils/verificationHistory';

interface Props {
  email: string;
  onBackPress?: () => void;
  onItemPress?: (item: any) => void;
}

export default function SavedScansScreen({
  email,
  onBackPress,
  onItemPress,
}: Props) {
  const { colors } = useTheme();

  const [scans, setScans] = useState<RawVerificationScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      setIsLoading(true);

      const history =
        await fetchVerificationHistory(email);

      if (isMounted) {
        setScans(history);
        setIsLoading(false);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [email]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >

      {/* ======================================================
          HEADER
          ====================================================== */}

      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >

        <TouchableOpacity
          onPress={onBackPress}
          style={[
            styles.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.backArrow,
              { color: colors.primary },
            ]}
          >
            ←
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: colors.text },
          ]}
        >
          Saved Scan Reports
        </Text>

        <View style={styles.headerSpacer} />

      </View>


      {/* ======================================================
          CONTENT
          ====================================================== */}

      <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {isLoading ? (

          <View style={styles.loadingState}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
          </View>

        ) : scans.length === 0 ? (

          /* ==================================================
             EMPTY STATE
             ================================================== */

          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >

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
                  { color: colors.primary },
                ]}
              >
                ⌕
              </Text>
            </View>

            <Text
              style={[
                styles.emptyTitle,
                { color: colors.text },
              ]}
            >
              No Saved Scans
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                { color: colors.textSecondary },
              ]}
            >
              Your medicine verification reports will appear
              here after you scan and save them.
            </Text>

          </View>

        ) : (

          /* ==================================================
             REAL BACKEND DATA
             ================================================== */

          scans.map((scan) => {

            const authentic =
              isScanAuthentic(scan.result);

            const uncertain =
              typeof scan.result === 'string' &&
              scan.result.toUpperCase() === 'UNKNOWN';

            const badgeColor = authentic
              ? colors.success
              : uncertain
                ? colors.warning
                : colors.danger;

            const badgeBackground = authentic
              ? colors.successBackground
              : uncertain
                ? colors.warningBackground
                : colors.dangerBackground;

            return (
              <TouchableOpacity
                key={scan.id}
                style={[
                  styles.scanCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  onItemPress?.(
                    mapScanToMedicine(scan),
                  )
                }
                activeOpacity={0.8}
              >

                <View style={styles.scanInfo}>

                  <Text
                    style={[
                      styles.scanName,
                      { color: colors.text },
                    ]}
                  >
                    {scan.medicineName}
                  </Text>

                  <Text
                    style={[
                      styles.scanBatch,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Batch: {scan.batchNumber || 'N/A'}
                  </Text>

                  <Text
                    style={[
                      styles.scanDate,
                      { color: colors.textMuted },
                    ]}
                  >
                    {formatScanDate(scan.scannedAt)}
                  </Text>

                </View>

                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: badgeBackground,
                      borderColor: badgeColor,
                    },
                  ]}
                >

                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: badgeColor,
                      },
                    ]}
                  >
                    {scan.result}
                  </Text>

                </View>

              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>

    </SafeAreaView>
  );
}


/* ================================================================
   STYLES
   ================================================================ */

const styles = StyleSheet.create({

  /* ============================================================
     CONTAINER
     ============================================================ */

  container: {
    flex: 1,
  },


  /* ============================================================
     HEADER
     ============================================================ */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 20,
    paddingVertical: 14,

    borderBottomWidth: 1,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 1,
  },

  backArrow: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: -2,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 38,
  },


  /* ============================================================
     CONTENT
     ============================================================ */

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },


  /* ============================================================
     EMPTY STATE
     ============================================================ */

  emptyState: {
    borderRadius: 20,

    padding: 28,

    alignItems: 'center',

    borderWidth: 1,

    marginTop: 40,
  },

  loadingState: {
    paddingTop: 60,
    alignItems: 'center',
  },

  emptyIconContainer: {
    width: 58,
    height: 58,

    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 14,
  },

  emptyIcon: {
    fontSize: 29,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',

    marginBottom: 6,
  },

  emptyDescription: {
    fontSize: 13,

    textAlign: 'center',

    lineHeight: 19,

    paddingHorizontal: 10,
  },


  /* ============================================================
     SCAN CARD
     ============================================================ */

  scanCard: {
    borderRadius: 18,

    padding: 16,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 12,

    borderWidth: 1,
  },

  scanInfo: {
    flex: 1,
    paddingRight: 12,
  },

  scanName: {
    fontSize: 15,
    fontWeight: '800',
  },

  scanBatch: {
    fontSize: 12,
    marginTop: 4,
  },

  scanDate: {
    fontSize: 11,
    marginTop: 4,
  },


  /* ============================================================
     STATUS BADGES
     ============================================================ */

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 10,

    borderWidth: 1,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

});