import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';

import BottomNavBar from '../screens/BottomNavBar';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

import {
  fetchVerificationHistory,
  mapScanToMedicine,
  isScanAuthentic,
  RawVerificationScan,
} from '../utils/verificationHistory';

interface Props {
  email: string;
  onScanPress?: () => void;
  onSeeAllPress?: () => void;
  onMedicinePress?: (med: any) => void;
  onProfilePress?: () => void;
  onInsightsPress?: () => void;
  onCabinetPress?: () => void;
}

const motivationalQuotes = [
  'Stay safe, verify every medicine before use.',
  'Your health and safety come first.',
  'Spot the fake, protect your family.',
  'Verify medicines with confidence.',
];

export default function HomeScreen({
  email,
  onScanPress,
  onSeeAllPress,
  onMedicinePress,
  onProfilePress,
  onInsightsPress,
  onCabinetPress,
}: Props) {
  const { colors } = useTheme();

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isAboutModalVisible, setIsAboutModalVisible] =
    useState(false);

  /* ============================================================
     SCAN HISTORY
     ============================================================ */

  const [allScans, setAllScans] =
    useState<RawVerificationScan[]>([]);

  const [isLoadingScans, setIsLoadingScans] =
    useState(true);

  useEffect(() => {

    let isCancelled = false;

    const loadScans = async () => {

      setIsLoadingScans(true);

      const scans =
        await fetchVerificationHistory(email);

      if (!isCancelled) {
        setAllScans(scans);
        setIsLoadingScans(false);
      }
    };

    loadScans();

    return () => {
      isCancelled = true;
    };

  }, [email]);

  const displayedScans =
    allScans.slice(0, 3);

  /* ============================================================
     MOTIVATIONAL QUOTE ROTATION
     ============================================================ */

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => {
        return (prevIndex + 1) % motivationalQuotes.length;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >

      {/* ========================================================
          SAFE AREA CONTENT
          ======================================================== */}

      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
          },
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
            },
          ]}
        >

          <View style={styles.headerTopRow}>

            <View>
              <Text
                style={[
                  styles.greeting,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Welcome back 👋
              </Text>

              <Text
                style={[
                  styles.headerTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                VeriCure
              </Text>

              <Text
                style={[
                  styles.headerSubtitle,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Medicine Safety Assistant
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.logoWrapper,
                {
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setIsAboutModalVisible(true)}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../assets/vericure_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

          </View>

        </View>

        {/* ======================================================
            MAIN CONTENT
            ====================================================== */}

        <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* ====================================================
              WELCOME CARD
              ==================================================== */}

          <View
            style={[
              styles.welcomeCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.welcomeIconContainer,
                {
                  backgroundColor: colors.iconBackground,
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.welcomeTextContainer}>

              <Text
                style={[
                  styles.welcomeTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Protect Your Health
              </Text>

              <Text
                style={[
                  styles.welcomeDescription,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Verify your medicine before use and
                make safer healthcare decisions.
              </Text>

            </View>

          </View>

          {/* ====================================================
              SCAN BANNER
              ==================================================== */}

          <View
            style={[
              styles.scanBanner,
              {
                backgroundColor: colors.cardSecondary,
                borderColor: colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.scanIconContainer,
                {
                  backgroundColor: colors.iconBackground,
                },
              ]}
            >
              <Ionicons
                name="camera-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <Text
              style={[
                styles.bannerTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Verify Drug Authenticity
            </Text>

            <Text
              style={[
                styles.bannerSub,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Scan your medicine package to check
              whether it is genuine or potentially
              counterfeit.
            </Text>

            <TouchableOpacity
              style={[
                styles.scanBtn,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={onScanPress}
              activeOpacity={0.8}
            >
              <Text style={styles.scanBtnText}>
                Scan Medicine
              </Text>

              <Text style={styles.scanArrow}>
                →
              </Text>
            </TouchableOpacity>

          </View>

          {/* ====================================================
              MOTIVATIONAL MESSAGE
              ==================================================== */}

          <View
            style={[
              styles.quoteContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.quoteIconContainer,
                {
                  backgroundColor: colors.iconBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.quoteIcon,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ✦
              </Text>
            </View>

            <Text
              style={[
                styles.quoteText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {motivationalQuotes[currentQuoteIndex]}
            </Text>

          </View>

          {/* ====================================================
              MEDICINE CABINET
              ==================================================== */}

          <TouchableOpacity
            style={[
              styles.cabinetBanner,
              {
                backgroundColor: colors.cardSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={onCabinetPress}
            activeOpacity={0.85}
          >

            <View style={styles.cabinetHeader}>

              <View
                style={[
                  styles.cabinetBadge,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text style={styles.cabinetBadgeText}>
                  FAMILY HEALTH
                </Text>
              </View>

              <Text
                style={[
                  styles.cabinetArrow,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                →
              </Text>

            </View>

            <Text
              style={[
                styles.cabinetTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              My Medicine Cabinet
            </Text>

            <Text
              style={[
                styles.cabinetDesc,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Save medicines, monitor expiry dates,
              and keep your family's medicines
              organized.
            </Text>

          </TouchableOpacity>

          {/* ====================================================
              RECENT SCANS
              ==================================================== */}

          <View style={styles.sectionHeader}>

            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Recent Scans
            </Text>

            <TouchableOpacity
              onPress={onSeeAllPress}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.seeAllText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                See All
              </Text>
            </TouchableOpacity>

          </View>

          {/* ====================================================
              LOADING
              ==================================================== */}

          {isLoadingScans ? (

            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            </View>

          ) : displayedScans.length > 0 ? (

            /* ==================================================
               SCAN LIST
               ================================================== */

            <View>
              {displayedScans.map((scan) => {

                const authentic =
                  isScanAuthentic(scan.result);

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
                      onMedicinePress?.(
                        mapScanToMedicine(scan),
                      )
                    }
                    activeOpacity={0.8}
                  >

                    <View
                      style={[
                        styles.scanCardIcon,
                        {
                          backgroundColor:
                            authentic
                              ? colors.successBackground
                              : colors.dangerBackground,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                        }}
                      >
                        {authentic ? '✅' : '⚠️'}
                      </Text>
                    </View>

                    <View
                      style={styles.scanCardTextContainer}
                    >
                      <Text
                        style={[
                          styles.scanCardName,
                          {
                            color: colors.text,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {scan.medicineName}
                      </Text>

                      <Text
                        style={[
                          styles.scanCardMeta,
                          {
                            color: colors.textMuted,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {authentic
                          ? 'Genuine'
                          : scan.result === 'UNKNOWN'
                            ? 'Uncertain result'
                            : 'Counterfeit'}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.scanCardArrow,
                        {
                          color: colors.textMuted,
                        },
                      ]}
                    >
                      ›
                    </Text>

                  </TouchableOpacity>
                );
              })}
            </View>

          ) : (

            /* ==================================================
               EMPTY STATE (no scans at all yet)
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
                    backgroundColor: colors.iconBackground,
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
                  ⌕
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
                No scans yet
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Your verified medicines will appear
                here after you scan them.
              </Text>

              <TouchableOpacity
                style={[
                  styles.emptyScanButton,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={onScanPress}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyScanButtonText}>
                  Scan Your First Medicine
                </Text>
              </TouchableOpacity>

            </View>
          )}

        </ScrollView>

      </SafeAreaView>

      {/* ========================================================
          ABOUT MODAL
          ======================================================== */}

      <Modal
        animationType="fade"
        transparent={true}
        visible={isAboutModalVisible}
        onRequestClose={() =>
          setIsAboutModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.modalLogoContainer,
                {
                  backgroundColor: colors.iconBackground,
                },
              ]}
            >

              <Image
                source={require('../../assets/vericure_logo.png')}
                style={styles.modalLogo}
                resizeMode="contain"
              />

            </View>

            <Text
              style={[
                styles.modalAppTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              VeriCure
            </Text>

            <Text
              style={[
                styles.versionText,
                {
                  color: colors.primary,
                },
              ]}
            >
              Version 1.0
            </Text>

            <Text
              style={[
                styles.modalDescription,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Smart Medicine Authentication
            </Text>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: colors.border,
                },
              ]}
            />

            <Text
              style={[
                styles.founderLabel,
                {
                  color: colors.primary,
                },
              ]}
            >
              FYP PROJECT
            </Text>

            <Text
              style={[
                styles.founderName,
                {
                  color: colors.text,
                },
              ]}
            >
              VeriCure Medicine Verification
            </Text>

            <Text
              style={[
                styles.noteText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Empowering safer healthcare through
              intelligent medicine verification.
            </Text>

            <TouchableOpacity
              style={[
                styles.closeBtn,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() =>
                setIsAboutModalVisible(false)
              }
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>
                Close
              </Text>
            </TouchableOpacity>

          </View>

        </View>

      </Modal>

      {/* ========================================================
          BOTTOM NAVIGATION

          IMPORTANT:
          This is OUTSIDE SafeAreaView.
          Therefore the navbar can sit directly at bottom.
          ======================================================== */}

      <BottomNavBar
        activeTab="home"
        onTabChange={(tab) => {

          if (tab === 'home') {
            return;
          }

          if (tab === 'insights') {
            onInsightsPress?.();
          }

          if (tab === 'profile') {
            onProfilePress?.();
          }

        }}
      />

    </View>
  );
}


/* ================================================================
   STYLES
   ================================================================ */

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  /* ============================================================
     HEADER
     ============================================================ */

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },

  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  greeting: {
    fontSize: 13,
    fontWeight: '500',
  },

  headerTitle: {
    fontSize: 27,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.3,
  },

  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  logoWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  logoImage: {
    width: 43,
    height: 43,
  },

  /* ============================================================
     SEARCH
     ============================================================ */

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    marginTop: 16,
    height: 48,
  },

  searchIcon: {
    fontSize: 22,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  /* ============================================================
     CONTENT
     ============================================================ */

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,

    /*
     * Space for the floating bottom navbar.
     * Prevents the last card from being hidden behind it.
     */
    paddingBottom: 100,
  },

  /* ============================================================
     WELCOME CARD
     ============================================================ */

  welcomeCard: {
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },

  welcomeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  welcomeIcon: {
    fontSize: 23,
  },

  welcomeTextContainer: {
    flex: 1,
  },

  welcomeTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  welcomeDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  /* ============================================================
     SCAN BANNER
     ============================================================ */

  scanBanner: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    borderWidth: 1,
  },

  scanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  scanIcon: {
    fontSize: 23,
  },

  bannerTitle: {
    fontSize: 21,
    fontWeight: '800',
  },

  bannerSub: {
    fontSize: 13,
    marginTop: 7,
    lineHeight: 19,
  },

  scanBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 19,
  },

  scanBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

  scanArrow: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    marginLeft: 8,
  },

  /* ============================================================
     QUOTE
     ============================================================ */

  quoteContainer: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  quoteIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  quoteIcon: {
    fontSize: 16,
  },

  quoteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },

  /* ============================================================
     MEDICINE CABINET
     ============================================================ */

  cabinetBanner: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 17,
    marginBottom: 25,
  },

  cabinetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },

  cabinetBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  cabinetBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  cabinetArrow: {
    fontSize: 21,
    fontWeight: '700',
  },

  cabinetTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  cabinetDesc: {
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },

  /* ============================================================
     RECENT SCANS
     ============================================================ */

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* ============================================================
     SCAN LIST (Recent Scans / Search Results)
     ============================================================ */

  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },

  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },

  scanCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  scanCardTextContainer: {
    flex: 1,
  },

  scanCardName: {
    fontSize: 14,
    fontWeight: '700',
  },

  scanCardMeta: {
    fontSize: 12,
    marginTop: 2,
  },

  scanCardArrow: {
    fontSize: 22,
    fontWeight: '600',
    marginLeft: 8,
  },

  /* ============================================================
     EMPTY STATE
     ============================================================ */

  emptyState: {
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },

  emptyIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  emptyIcon: {
    fontSize: 25,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  emptyDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 5,
    paddingHorizontal: 15,
  },

  emptyScanButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 16,
  },

  emptyScanButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ============================================================
     MODAL
     ============================================================ */

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  modalContent: {
    borderRadius: 24,
    padding: 25,
    width: '87%',
    alignItems: 'center',
    borderWidth: 1,
  },

  modalLogoContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  modalLogo: {
    width: 57,
    height: 57,
  },

  modalAppTitle: {
    fontSize: 22,
    fontWeight: '800',
  },

  versionText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  modalDescription: {
    fontSize: 12,
    marginTop: 3,
  },

  divider: {
    width: '100%',
    height: 1,
    marginVertical: 18,
  },

  founderLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  founderName: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 5,
  },

  noteText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 17,
  },

  closeBtn: {
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 13,
    width: '100%',
    alignItems: 'center',
  },

  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});