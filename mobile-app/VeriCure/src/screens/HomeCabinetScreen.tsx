import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import { getExpiryStatus } from '../utils/expiryDate';

/**
 * Recomputes isExpired live from the stored expiryDate string,
 * rather than trusting whatever was stored at save time.
 *
 * A medicine saved as "not yet expired" previously can become
 * expired later, so expiry status is recalculated whenever the
 * cabinet is loaded.
 *
 * Items with an unparseable or missing expiry date are treated
 * as not expired because we cannot reliably determine their status.
 */
function withLiveExpiryStatus(items: MedicineItem[]): MedicineItem[] {
  return items.map((item) => {
    const status = getExpiryStatus(item.expiryDate);

    return {
      ...item,
      isExpired: status ? status.isExpired : false,
    };
  });
}

interface MedicineItem {
  id: string;
  name: string;
  dosage: string;
  expiryDate: string;
  isExpired?: boolean;
  category: string;
  notes: {
    en: string;
    ur: string;
    sd: string;
  };
}

interface Props {
  email: string;
  onBackPress: () => void;
  onAddMedicinePress: () => void;
}

/*
 * The cabinet's storage key is scoped per logged-in user's
 * email, so different accounts on the same device never see
 * each other's saved medicines.
 */
const CABINET_STORAGE_PREFIX =
  '@vericure_cabinet_medicines_';

function getCabinetStorageKey(email: string): string {
  const normalizedEmail =
    typeof email === 'string'
      ? email.trim().toLowerCase()
      : '';

  return (
    CABINET_STORAGE_PREFIX +
    (normalizedEmail || 'unknown_user')
  );
}

export default function HomeCabinetScreen({
  email,
  onBackPress,
  onAddMedicinePress,
}: Props) {
  const { colors } = useTheme();

  const storageKey = getCabinetStorageKey(email);

  const [medicines, setMedicines] =
    useState<MedicineItem[]>([]);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [statusMessage, setStatusMessage] =
    useState('Cabinet ready');

  const [expiryBannerDismissed, setExpiryBannerDismissed] =
    useState(false);

  const [expiryBannerExpanded, setExpiryBannerExpanded] =
    useState(false);

  useEffect(() => {
    loadMedicines();
    setExpiryBannerDismissed(false);
    setExpiryBannerExpanded(false);
  }, [email]);

  // ==================================================
  // LOAD REAL SAVED MEDICINES
  // ==================================================

  const loadMedicines = async () => {
    try {
      const storedData =
        await AsyncStorage.getItem(storageKey);

      if (storedData) {
        const parsedData = JSON.parse(storedData);

        if (Array.isArray(parsedData)) {
          setMedicines(
            withLiveExpiryStatus(parsedData)
          );
        } else {
          setMedicines([]);
        }
      } else {
        setMedicines([]);
      }
    } catch (error) {
      console.error(
        'Error loading cabinet medicines:',
        error
      );

      setMedicines([]);
    }
  };

  // ==================================================
  // DELETE MEDICINE
  // ==================================================

  const handleDelete = async (id: string) => {
    try {
      const updatedList = medicines.filter(
        (med) => med.id !== id
      );

      setMedicines(updatedList);

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedList)
      );

      setStatusMessage(
        'Medicine removed from cabinet.'
      );
    } catch (error) {
      console.error(
        'Error deleting medicine:',
        error
      );

      setStatusMessage(
        'Unable to remove medicine.'
      );
    }
  };

  // ==================================================
  // SEARCH FILTER
  // ==================================================

  const trimmedQuery =
    searchQuery.trim().toLowerCase();

  const filteredMedicines =
    trimmedQuery.length > 0
      ? medicines.filter((med) =>
          med.name
            .toLowerCase()
            .includes(trimmedQuery)
        )
      : medicines;

  // ==================================================
  // NEAR-EXPIRY SUMMARY
  // ==================================================

  const expiringSoon = medicines
    .map((med) => {
      const status = getExpiryStatus(
        med.expiryDate
      );

      if (!status) {
        return null;
      }

      if (
        !status.isExpired &&
        !status.isUrgent &&
        !status.isUpcoming
      ) {
        return null;
      }

      return {
        id: med.id,
        name: med.name,
        daysUntil: status.daysUntil,
        isExpired: status.isExpired,
      };
    })
    .filter(
      (
        r
      ): r is {
        id: string;
        name: string;
        daysUntil: number;
        isExpired: boolean;
      } => r !== null
    )
    .sort(
      (a, b) =>
        a.daysUntil - b.daysUntil
    );

  // ==================================================
  // SCREEN
  // ==================================================

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      {/* ==================================================
          HEADER
          ================================================== */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.card,
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onBackPress}
          style={[
            styles.headerBackBtn,
            {
              backgroundColor:
                colors.cardSecondary,
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <View
          style={styles.headerTitleContainer}
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Medicine Cabinet
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            Your saved medicines
          </Text>
        </View>

        <View
          style={[
            styles.headerIconContainer,
            {
              backgroundColor:
                colors.iconBackground,
            },
          ]}
        >
          <Ionicons
            name="medical-outline"
            size={23}
            color={colors.primary}
          />
        </View>
      </View>

      {/* ==================================================
          CONTENT
          ================================================== */}

      <ScrollView
        canCancelContentTouches={true}
        delaysContentTouches={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        {/* ==================================================
            EXPIRING SOON BANNER
            ================================================== */}

        {expiringSoon.length > 0 &&
          !expiryBannerDismissed && (
            <View
              style={[
                styles.expiryBanner,
                {
                  backgroundColor:
                    colors.card,

                  /*
                   * FIX:
                   * expiringSoon objects have isExpired
                   * directly. They do NOT have a status
                   * property.
                   */
                  borderColor:
                    expiringSoon.some(
                      (e) => e.isExpired
                    )
                      ? colors.danger
                      : colors.primary,
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={
                  expiringSoon.some(
                    (e) => e.isExpired
                  )
                    ? colors.danger
                    : colors.primary
                }
              />

              <View
                style={
                  styles.expiryBannerTextContainer
                }
              >
                <Text
                  style={[
                    styles.expiryBannerTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {expiringSoon.length} medicine
                  {expiringSoon.length === 1
                    ? ''
                    : 's'} need
                  {expiringSoon.length === 1
                    ? 's'
                    : ''} attention
                </Text>

                <Text
                  style={[
                    styles.expiryBannerSubtitle,
                    {
                      color:
                        colors.textMuted,
                    },
                  ]}
                  numberOfLines={
                    expiryBannerExpanded
                      ? undefined
                      : 1
                  }
                >
                  {expiringSoon
                    .slice(
                      0,
                      expiryBannerExpanded
                        ? expiringSoon.length
                        : 3
                    )
                    .map(
                      /*
                       * FIX:
                       * expiringSoon objects have `name`
                       * directly. They do NOT have item.name.
                       */
                      (e) => e.name
                    )
                    .join(', ')}

                  {!expiryBannerExpanded &&
                    expiringSoon.length > 3
                    ? ', ...'
                    : ''}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setExpiryBannerDismissed(
                    true
                  )
                }
                hitSlop={{
                  top: 8,
                  bottom: 8,
                  left: 8,
                  right: 8,
                }}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={
                    colors.textMuted
                  }
                />
              </TouchableOpacity>
            </View>
          )}

        {/* ==================================================
            STATUS
            ================================================== */}

        <View
          style={[
            styles.statusBox,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={colors.primary}
          />

          <Text
            style={[
              styles.statusText,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            {statusMessage}
          </Text>
        </View>

        {/* ==================================================
            SEARCH
            ================================================== */}

        {medicines.length > 0 && (
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.primary}
            />

            <TextInput
              style={[
                styles.searchInput,
                {
                  color: colors.text,
                },
              ]}
              placeholder="Search your cabinet..."
              placeholderTextColor={
                colors.textMuted
              }
              value={searchQuery}
              onChangeText={
                setSearchQuery
              }
              autoCapitalize="none"
              returnKeyType="search"
            />

            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  setSearchQuery('')
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={
                    colors.textMuted
                  }
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ==================================================
            MEDICINE LIST
            ================================================== */}

        {filteredMedicines.length > 0 ? (
          filteredMedicines.map(
            (item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor:
                      colors.cardSecondary,
                    borderColor:
                      colors.border,
                  },
                  item.isExpired &&
                    styles.expiredCard,
                ]}
              >
                {/* CARD HEADER */}

                <View
                  style={styles.cardHeader}
                >
                  <View
                    style={
                      styles.medicineTitleContainer
                    }
                  >
                    <View
                      style={[
                        styles.medicineIcon,
                        {
                          backgroundColor:
                            colors.card,
                        },
                      ]}
                    >
                      <Ionicons
                        name="medical-outline"
                        size={20}
                        color={
                          item.isExpired
                            ? colors.danger
                            : colors.primary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.nameContainer
                      }
                    >
                      <View
                        style={
                          styles.nameRow
                        }
                      >
                        <Text
                          style={[
                            styles.medName,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>

                        {item.isExpired && (
                          <View
                            style={[
                              styles.alertBadge,
                              {
                                backgroundColor:
                                  colors.danger,
                              },
                            ]}
                          >
                            <Ionicons
                              name="warning-outline"
                              size={12}
                              color={
                                colors.white
                              }
                            />

                            <Text
                              style={
                                styles.alertBadgeText
                              }
                            >
                              Expired
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.medCategory,
                          {
                            color:
                              colors.textSecondary,
                          },
                        ]}
                      >
                        {item.category}
                      </Text>
                    </View>
                  </View>

                  {/* DELETE */}

                  <TouchableOpacity
                    onPress={() =>
                      handleDelete(
                        item.id
                      )
                    }
                    style={[
                      styles.deleteBtn,
                      {
                        backgroundColor:
                          colors.dangerBackground,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={
                        colors.danger
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* DETAILS */}

                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor:
                        colors.border,
                    },
                  ]}
                />

                {/* DOSAGE */}

                <View
                  style={styles.detailRow}
                >
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={
                      colors.textSecondary
                    }
                  />

                  <View>
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color:
                            colors.textMuted,
                        },
                      ]}
                    >
                      Dosage
                    </Text>

                    <Text
                      style={[
                        styles.dosageText,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      {item.dosage}
                    </Text>
                  </View>
                </View>

                {/* EXPIRY */}

                <View
                  style={styles.detailRow}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={17}
                    color={
                      item.isExpired
                        ? colors.danger
                        : colors.primary
                    }
                  />

                  <View>
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color:
                            colors.textMuted,
                        },
                      ]}
                    >
                      Expiry Date
                    </Text>

                    <Text
                      style={[
                        styles.expiryText,
                        {
                          color:
                            colors.primary,
                        },
                        item.isExpired &&
                          styles.expiredTextAlert,
                      ]}
                    >
                      {item.expiryDate}

                      {item.isExpired
                        ? '  •  Expired'
                        : ''}
                    </Text>
                  </View>
                </View>
              </View>
            )
          )
        ) : (
          /* ==================================================
             EMPTY STATE
             ================================================== */

          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
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
              <Ionicons
                name={
                  trimmedQuery.length > 0
                    ? 'search-outline'
                    : 'medkit-outline'
                }
                size={42}
                color={colors.primary}
              />
            </View>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {trimmedQuery.length > 0
                ? 'No Matches Found'
                : 'Your Cabinet Is Empty'}
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              {trimmedQuery.length > 0
                ? `No saved medicines match "${searchQuery.trim()}".`
                : 'Verified medicines that you save will appear here.'}
            </Text>

            {trimmedQuery.length === 0 && (
              <TouchableOpacity
                style={[
                  styles.emptyScanBtn,
                  {
                    backgroundColor:
                      colors.primary,
                  },
                ]}
                onPress={
                  onAddMedicinePress
                }
                activeOpacity={0.85}
              >
                <Ionicons
                  name="scan-outline"
                  size={20}
                  color={colors.white}
                />

                <Text
                  style={
                    styles.emptyScanBtnText
                  }
                >
                  Add Medicine
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ==================================================
            SCANNER BUTTON
            ================================================== */}

        {medicines.length > 0 && (
          <TouchableOpacity
            style={[
              styles.addBtn,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}
            onPress={
              onAddMedicinePress
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name="scan-outline"
              size={21}
              color={colors.white}
            />

            <Text
              style={styles.addBtnText}
            >
              Scan Another Medicine
            </Text>
          </TouchableOpacity>
        )}

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // --------------------------------------------------
  // EXPIRY BANNER
  // --------------------------------------------------

  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },

  expiryBannerTextContainer: {
    flex: 1,
  },

  expiryBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  expiryBannerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // --------------------------------------------------
  // HEADER
  // --------------------------------------------------

  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },

  headerBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerTitleContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },

  headerIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --------------------------------------------------
  // CONTENT
  // --------------------------------------------------

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  // --------------------------------------------------
  // STATUS
  // --------------------------------------------------

  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 11,
    marginBottom: 14,
    borderWidth: 1,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 9,
  },

  // --------------------------------------------------
  // MEDICINE CARD
  // --------------------------------------------------

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },

  expiredCard: {
    borderColor: '#7F1D1D',
    backgroundColor: '#1C1517',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  medicineTitleContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 10,
  },

  medicineIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  nameContainer: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  medName: {
    fontSize: 16,
    fontWeight: '800',
    maxWidth: '65%',
  },

  medCategory: {
    fontSize: 12,
    marginTop: 3,
  },

  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    marginLeft: 7,
  },

  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 3,
  },

  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: {
    height: 1,
    marginVertical: 14,
  },

  // --------------------------------------------------
  // DETAILS
  // --------------------------------------------------

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 10,
  },

  dosageText: {
    fontSize: 13,
    marginLeft: 10,
    marginTop: 2,
    fontWeight: '600',
  },

  expiryText: {
    fontSize: 13,
    marginLeft: 10,
    marginTop: 2,
    fontWeight: '700',
  },

  expiredTextAlert: {
    color: '#F87171',
  },

  // --------------------------------------------------
  // EMPTY STATE
  // --------------------------------------------------

  emptyContainer: {
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 4,
  },

  emptyIconContainer: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 22,
    maxWidth: 280,
  },

  emptyScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 25,
    borderRadius: 12,
  },

  emptyScanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },

  // --------------------------------------------------
  // SCAN BUTTON
  // --------------------------------------------------

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },

  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 8,
  },

  bottomSpace: {
    height: 20,
  },
});