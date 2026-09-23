import React, { useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

export interface RecallItem {
  id: string;
  medicineName: string;
  batchNumber: string;
  manufacturer: string;
  reason: string;
  date: string;
  severity: 'High Risk' | 'Moderate' | 'Warning';
}

interface Props {
  onBackPress?: () => void;
  onSelectBatch?: (item: RecallItem) => void;

  // Backend data will be passed here
  recallData?: RecallItem[];
}

export default function BatchRecallScreen({
  onBackPress,
  onSelectBatch,
  recallData = [],
}: Props) {
  const { colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');

  /*
   * ============================================================
   * FILTER BACKEND DATA
   * ============================================================
   */

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return recallData;
    }

    return recallData.filter(
      (item) =>
        item.medicineName.toLowerCase().includes(query) ||
        item.batchNumber.toLowerCase().includes(query) ||
        item.manufacturer.toLowerCase().includes(query)
    );
  }, [recallData, searchQuery]);

  /*
   * ============================================================
   * CARD PRESS
   * ============================================================
   */

  const handleCardPress = (item: RecallItem) => {
    if (onSelectBatch) {
      onSelectBatch(item);
    } else {
      Alert.alert(
        `Alert: ${item.medicineName}`,
        `Batch: ${item.batchNumber}\nSeverity: ${item.severity}\n\n${item.reason}`
      );
    }
  };

  /*
   * ============================================================
   * SEVERITY COLORS
   *
   * These remain semantic colors, but use the theme colors
   * wherever possible.
   * ============================================================
   */

  const getSeverityStyle = (
    severity: RecallItem['severity']
  ) => {
    switch (severity) {
      case 'High Risk':
        return {
          bg: colors.dangerBackground,
          text: colors.danger,
        };

      case 'Moderate':
        return {
          bg: colors.warningBackground,
          text: colors.warning,
        };

      case 'Warning':
      default:
        return {
          bg: colors.iconBackground,
          text: colors.primaryDark,
        };
    }
  };

  /*
   * ============================================================
   * DYNAMIC STYLES
   * ============================================================
   */

  const styles = StyleSheet.create({
    /*
     * ==========================================================
     * CONTAINER
     * ==========================================================
     */

    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    /*
     * ==========================================================
     * HEADER
     * ==========================================================
     */

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',

      paddingHorizontal: 20,
      paddingVertical: 14,

      backgroundColor: colors.background,

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,

      backgroundColor: colors.card,

      justifyContent: 'center',
      alignItems: 'center',

      borderWidth: 1,
      borderColor: colors.border,
    },

    backArrow: {
      fontSize: 22,
      color: colors.primaryLight,
      fontWeight: '600',

      marginTop: -2,
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },

    headerSpacer: {
      width: 38,
    },

    /*
     * ==========================================================
     * CONTENT
     * ==========================================================
     */

    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },

    /*
     * ==========================================================
     * INFO BANNER
     * ==========================================================
     */

    infoBanner: {
      backgroundColor: colors.cardSecondary,
      borderColor: colors.border,

      borderWidth: 1,
      borderRadius: 14,

      padding: 14,

      flexDirection: 'row',
      alignItems: 'center',

      marginBottom: 16,
    },

    infoIcon: {
      fontSize: 24,
      marginRight: 12,
    },

    infoTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primaryLight,
    },

    infoDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 16,
    },

    /*
     * ==========================================================
     * SEARCH
     * ==========================================================
     */

    searchContainer: {
      backgroundColor: colors.inputBackground,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 12,

      paddingHorizontal: 14,
      paddingVertical: 10,

      marginBottom: 20,

      flexDirection: 'row',
      alignItems: 'center',
    },

    searchInput: {
      flex: 1,

      fontSize: 14,
      color: colors.textPrimary,
    },

    clearSearch: {
      fontSize: 14,
      color: colors.textMuted,

      paddingHorizontal: 4,
    },

    /*
     * ==========================================================
     * SECTION TITLE
     * ==========================================================
     */

    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',

      color: colors.textSecondary,

      marginBottom: 12,

      textTransform: 'uppercase',
    },

    /*
     * ==========================================================
     * CARD
     * ==========================================================
     */

    card: {
      backgroundColor: colors.card,

      borderRadius: 16,

      padding: 16,
      marginBottom: 14,

      borderWidth: 1,
      borderColor: colors.border,
    },

    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },

    medName: {
      fontSize: 16,
      fontWeight: '700',

      color: colors.textPrimary,
    },

    manufacturer: {
      fontSize: 12,

      color: colors.textSecondary,

      marginTop: 2,
    },

    /*
     * ==========================================================
     * SEVERITY BADGE
     * ==========================================================
     */

    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,

      borderRadius: 8,
    },

    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },

    /*
     * ==========================================================
     * BATCH ROW
     * ==========================================================
     */

    batchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',

      marginVertical: 12,

      backgroundColor: colors.cardSecondary,

      padding: 10,

      borderRadius: 10,
    },

    batchTag: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    batchLabel: {
      fontSize: 11,
      fontWeight: '700',

      color: colors.textSecondary,

      marginRight: 6,
    },

    batchValue: {
      fontSize: 13,
      fontWeight: '800',

      color: colors.textPrimary,
    },

    dateText: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    /*
     * ==========================================================
     * REASON
     * ==========================================================
     */

    reasonText: {
      fontSize: 13,

      color: colors.textSecondary,

      lineHeight: 18,
    },

    /*
     * ==========================================================
     * EMPTY STATE
     * ==========================================================
     */

    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',

      paddingVertical: 50,
      paddingHorizontal: 20,
    },

    emptyIcon: {
      fontSize: 40,
      marginBottom: 10,
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',

      color: colors.textPrimary,
    },

    emptyDesc: {
      fontSize: 13,

      color: colors.textSecondary,

      marginTop: 4,

      textAlign: 'center',
    },
  });

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <SafeAreaView style={styles.container}>

      {/* ======================================================
          HEADER
          ====================================================== */}

      <View style={styles.header}>

        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Batch Recall Alerts
        </Text>

        <View style={styles.headerSpacer} />

      </View>

      <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ====================================================
            INFO BOX
            ==================================================== */}

        <View style={styles.infoBanner}>

          <Text style={styles.infoIcon}>
            🚨
          </Text>

          <View style={{ flex: 1 }}>

            <Text style={styles.infoTitle}>
              DRAP & Official Warnings
            </Text>

            <Text style={styles.infoDesc}>
              Check recently recalled or flagged drug
              batches in Pakistan to ensure your medicine
              is safe.
            </Text>

          </View>

        </View>

        {/* ====================================================
            SEARCH
            ==================================================== */}

        <View style={styles.searchContainer}>

          <TextInput
            style={styles.searchInput}
            placeholder="Search by Medicine, Manufacturer or Batch No"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {searchQuery !== '' && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearch}>
                ✕
              </Text>
            </TouchableOpacity>
          )}

        </View>

        {/* ====================================================
            LIST TITLE
            ==================================================== */}

        <Text style={styles.sectionTitle}>
          Active Warnings ({filteredData.length})
        </Text>

        {/* ====================================================
            EMPTY STATE
            ==================================================== */}

        {filteredData.length === 0 ? (

          <View style={styles.emptyContainer}>

            <Text style={styles.emptyIcon}>
              🔍
            </Text>

            <Text style={styles.emptyTitle}>
              {searchQuery
                ? 'No Flagged Batches Found'
                : 'No Active Recall Warnings'}
            </Text>

            <Text style={styles.emptyDesc}>
              {searchQuery
                ? `No active recall warnings matched "${searchQuery}".`
                : 'There are currently no recall warnings available.'}
            </Text>

          </View>

        ) : (

          /* ==================================================
             BACKEND DATA LIST
             ================================================== */

          filteredData.map((item) => {

            const { bg, text } =
              getSeverityStyle(item.severity);

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() =>
                  handleCardPress(item)
                }
              >

                <View style={styles.cardHeader}>

                  <View style={{ flex: 1 }}>

                    <Text style={styles.medName}>
                      {item.medicineName}
                    </Text>

                    <Text style={styles.manufacturer}>
                      {item.manufacturer}
                    </Text>

                  </View>

                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: text,
                        },
                      ]}
                    >
                      {item.severity}
                    </Text>
                  </View>

                </View>

                <View style={styles.batchRow}>

                  <View style={styles.batchTag}>

                    <Text style={styles.batchLabel}>
                      BATCH NO:
                    </Text>

                    <Text style={styles.batchValue}>
                      {item.batchNumber}
                    </Text>

                  </View>

                  <Text style={styles.dateText}>
                    {item.date}
                  </Text>

                </View>

                <Text style={styles.reasonText}>
                  {item.reason}
                </Text>

              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>

    </SafeAreaView>
  );
}