import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

import BottomNavBar from '../screens/BottomNavBar';
import { useTheme } from '../theme/ThemeContext';

/*
 * ============================================================
 * BACKEND
 * ============================================================
 * API_BASE_URL now lives in one shared file: src/config/api.ts
 * Change your IP address there ONCE — it applies to every screen.
 */

import { API_BASE_URL } from '../config/api';

interface Props {
  /*
   * The email of the currently logged-in user.
   * Passed down from App.tsx (stored at login time).
   */
  email: string;

  /*
   * True when this is a guest session — no account exists,
   * so name/email are locked and shown as "Guest" instead of
   * being fetched from the backend or made editable.
   */
  isGuest?: boolean;

  onLogoutPress?: () => void;
  onScanHistoryPress?: () => void;
  onSecurityPress?: () => void;
  onHelpSupportPress?: () => void;

  /*
   * Called after a new email has been requested and the
   * OTP has been sent to it. App.tsx handles the actual
   * OTP screen navigation.
   */
  onRequestEmailChange?: (newEmail: string) => void;

  // Bottom navigation
  onHomePress?: () => void;
  onInsightsPress?: () => void;
  onProfilePress?: () => void;
}

export default function ProfileScreen({
  email,
  isGuest = false,
  onLogoutPress,
  onScanHistoryPress,
  onSecurityPress,
  onHelpSupportPress,
  onRequestEmailChange,
  onHomePress,
  onInsightsPress,
  onProfilePress,
}: Props) {
  const { colors } = useTheme();

  const normalizedEmail =
    typeof email === 'string'
      ? email.trim().toLowerCase()
      : '';

  /*
   * ==========================================================
   * PROFILE DATA (loaded from backend)
   * ==========================================================
   */

  const [name, setName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  /*
   * ==========================================================
   * NAME EDITING
   * ==========================================================
   */

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  /*
   * ==========================================================
   * EMAIL EDITING
   * ==========================================================
   */

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [isRequestingEmailChange, setIsRequestingEmailChange] =
    useState(false);

  const displayName = isGuest
    ? 'Guest'
    : name.trim().length > 0
      ? name
      : 'User';

  const avatarLetter = isGuest
    ? 'G'
    : name.trim().length > 0
      ? name.trim().charAt(0).toUpperCase()
      : 'U';

  /*
   * ==========================================================
   * SAFE RESPONSE READER
   * ==========================================================
   */

  const readResponse = async (
    response: Response
  ): Promise<any> => {
    const responseText =
      await response.text();

    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return responseText;
    }
  };

  /*
   * ==========================================================
   * LOAD PROFILE
   * ==========================================================
   * Runs on mount, and again whenever `email` changes
   * (e.g. right after an email change is confirmed).
   */

  useEffect(() => {

    let isCancelled = false;

    const loadProfile = async () => {

      if (!normalizedEmail) {
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);

      try {

        const response =
          await fetch(
            API_BASE_URL +
              '/api/auth/profile?email=' +
              encodeURIComponent(
                normalizedEmail
              ),
            {
              method: 'GET',
            }
          );

        const data =
          await readResponse(response);

        if (isCancelled) {
          return;
        }

        if (
          response.ok &&
          data &&
          data.success
        ) {

          setName(
            typeof data.name === 'string'
              ? data.name
              : ''
          );

          setAccountEmail(
            typeof data.email === 'string'
              ? data.email
              : normalizedEmail
          );

        } else {

          console.log(
            'Unable to load profile:',
            data
          );

          setAccountEmail(
            normalizedEmail
          );
        }

      } catch (error) {

        if (isCancelled) {
          return;
        }

        console.log(
          'Load profile error:',
          error
        );

        setAccountEmail(
          normalizedEmail
        );

      } finally {

        if (!isCancelled) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isCancelled = true;
    };

  }, [normalizedEmail]);

  /*
   * ==========================================================
   * SAVE NAME
   * ==========================================================
   */

  const handleEditUsername = () => {
    setTempUsername(name);
    setIsEditingUsername(true);
  };

  const handleSaveUsername = async () => {
    const trimmedName = tempUsername.trim();

    if (trimmedName.length === 0) {
      Alert.alert(
        'Invalid Name',
        'Name cannot be empty.',
      );
      return;
    }

    if (!normalizedEmail) {
      Alert.alert(
        'Session Error',
        'We could not find your logged-in account. Please log out and log back in.'
      );
      return;
    }

    if (isSavingName) {
      return;
    }

    try {
      setIsSavingName(true);

      const response =
        await fetch(
          API_BASE_URL +
            '/api/auth/update-name',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              email: normalizedEmail,
              name: trimmedName,
            }),
          }
        );

      const data =
        await readResponse(response);

      if (!response.ok || !data || !data.success) {

        const message =
          data &&
          typeof data.message === 'string'
            ? data.message
            : 'Unable to update name. Please try again.';

        Alert.alert(
          'Update Failed',
          message
        );

        return;
      }

      setName(trimmedName);
      setIsEditingUsername(false);

    } catch (error) {

      console.log(
        'Update name error:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to connect to the server. Please check your connection and try again.'
      );

    } finally {
      setIsSavingName(false);
    }
  };

  /*
   * ==========================================================
   * REQUEST EMAIL CHANGE
   * ==========================================================
   */

  const handleEditEmail = () => {
    setTempEmail('');
    setIsEditingEmail(true);
  };

  const handleCancelEditEmail = () => {
    setTempEmail('');
    setIsEditingEmail(false);
  };

  const handleRequestEmailChange = async () => {

    const trimmedNewEmail =
      tempEmail.trim().toLowerCase();

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedNewEmail)) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return;
    }

    if (trimmedNewEmail === normalizedEmail) {
      Alert.alert(
        'Same Email',
        'This is already your current email address.'
      );
      return;
    }

    if (!normalizedEmail) {
      Alert.alert(
        'Session Error',
        'We could not find your logged-in account. Please log out and log back in.'
      );
      return;
    }

    if (isRequestingEmailChange) {
      return;
    }

    try {
      setIsRequestingEmailChange(true);

      const response =
        await fetch(
          API_BASE_URL +
            '/api/auth/request-email-change',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              currentEmail:
                normalizedEmail,

              newEmail:
                trimmedNewEmail,
            }),
          }
        );

      const data =
        await readResponse(response);

      if (!response.ok || !data || !data.success) {

        const message =
          data &&
          typeof data.message === 'string'
            ? data.message
            : 'Unable to request email change. Please try again.';

        Alert.alert(
          'Email Change Failed',
          message
        );

        return;
      }

      /*
       * Success — an OTP has been sent to the new email.
       * Hand off to App.tsx to open the OTP screen.
       */

      setIsEditingEmail(false);
      setTempEmail('');

      onRequestEmailChange?.(
        trimmedNewEmail
      );

    } catch (error) {

      console.log(
        'Request email change error:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to connect to the server. Please check your connection and try again.'
      );

    } finally {
      setIsRequestingEmailChange(false);
    }
  };

  /*
   * ==========================================================
   * LOGOUT CONFIRMATION
   * ==========================================================
   */

  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            onLogoutPress?.();
          },
        },
      ],
      { cancelable: true }
    );
  };

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
        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.text,
            },
          ]}
        >
          My Profile
        </Text>
      </View>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ===================================================
            USER CARD
        =================================================== */}

        <View
          style={[
            styles.userCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: colors.iconBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                {
                  color: colors.primary,
                },
              ]}
            >
              {avatarLetter}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text
              style={[
                styles.userName,
                {
                  color: colors.text,
                },
              ]}
            >
              {displayName}
            </Text>

            <Text
              style={[
                styles.userEmail,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {isGuest
                ? 'Guest Account'
                : (isLoadingProfile
                    ? 'Loading...'
                    : (accountEmail ||
                        normalizedEmail ||
                        'No email on file'))}
            </Text>

            <View
              style={[
                styles.regionBadge,
                {
                  backgroundColor: colors.iconBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.regionText,
                  {
                    color: colors.primaryLight,
                  },
                ]}
              >
                Verification Region
              </Text>
            </View>
          </View>
        </View>

        {/* ===================================================
            ACCOUNT SETTINGS
        =================================================== */}

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Account Settings
          </Text>

          {/* Username */}

          <View
            style={[
              styles.cardItem,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardItemContent}>
              <Text
                style={[
                  styles.itemLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Username
              </Text>

              {isEditingUsername ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderBottomColor: colors.primary,
                    },
                  ]}
                  value={tempUsername}
                  onChangeText={setTempUsername}
                  placeholder="Enter username"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  selectionColor={colors.primary}
                  editable={!isSavingName}
                />
              ) : (
                <Text
                  style={[
                    styles.itemValue,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {isLoadingProfile
                    ? 'Loading...'
                    : displayName}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.editBtn,
                {
                  backgroundColor: colors.iconBackground,
                  borderColor: colors.border,
                },
              ]}
              onPress={
                isGuest
                  ? undefined
                  : isEditingUsername
                    ? handleSaveUsername
                    : handleEditUsername
              }
              activeOpacity={0.8}
              disabled={isGuest || isLoadingProfile || isSavingName}
            >
              {isSavingName ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryLight}
                />
              ) : (
                <Text
                  style={[
                    styles.editBtnText,
                    {
                      color: isGuest
                        ? colors.textMuted
                        : colors.primaryLight,
                    },
                  ]}
                >
                  {isGuest
                    ? 'Locked'
                    : (isEditingUsername ? 'Save' : 'Edit')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Email */}

          <View
            style={[
              styles.cardItem,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                alignItems: isEditingEmail
                  ? 'flex-start'
                  : 'center',
              },
            ]}
          >
            <View style={styles.cardItemContent}>
              <Text
                style={[
                  styles.itemLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Email Address
              </Text>

              {isEditingEmail ? (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderBottomColor: colors.primary,
                      },
                    ]}
                    value={tempEmail}
                    onChangeText={setTempEmail}
                    placeholder="Enter new email"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    selectionColor={colors.primary}
                    editable={!isRequestingEmailChange}
                  />

                  <Text
                    style={[
                      styles.emailHint,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    We'll send a verification code to
                    this new email.
                  </Text>
                </>
              ) : (
                <Text
                  style={[
                    styles.itemValue,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {isLoadingProfile
                    ? 'Loading...'
                    : (accountEmail ||
                        normalizedEmail)}
                </Text>
              )}
            </View>

            {isEditingEmail ? (
              <View style={styles.emailBtnColumn}>

                <TouchableOpacity
                  style={[
                    styles.editBtn,
                    {
                      backgroundColor: colors.iconBackground,
                      borderColor: colors.border,
                      marginBottom: 6,
                    },
                  ]}
                  onPress={
                    handleRequestEmailChange
                  }
                  activeOpacity={0.8}
                  disabled={isRequestingEmailChange}
                >
                  {isRequestingEmailChange ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.primaryLight}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.editBtnText,
                        {
                          color: colors.primaryLight,
                        },
                      ]}
                    >
                      Send Code
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.editBtn,
                    {
                      backgroundColor: colors.iconBackground,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={
                    handleCancelEditEmail
                  }
                  activeOpacity={0.8}
                  disabled={isRequestingEmailChange}
                >
                  <Text
                    style={[
                      styles.editBtnText,
                      {
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.editBtn,
                  {
                    backgroundColor: colors.iconBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={
                  isGuest ? undefined : handleEditEmail
                }
                activeOpacity={0.8}
                disabled={isGuest || isLoadingProfile}
              >
                <Text
                  style={[
                    styles.editBtnText,
                    {
                      color: isGuest
                        ? colors.textMuted
                        : colors.primaryLight,
                    },
                  ]}
                >
                  {isGuest ? 'Locked' : 'Edit'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verification Region */}

          <View
            style={[
              styles.cardItem,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardItemContent}>
              <Text
                style={[
                  styles.itemLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Verification Region
              </Text>

              <Text
                style={[
                  styles.itemValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Not available
              </Text>
            </View>
          </View>
        </View>

        {/* ===================================================
            PREFERENCES & FEATURES
        =================================================== */}

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Preferences & Features
          </Text>

          {/* Saved Scans */}

          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={onScanHistoryPress}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.menuIconContainer,
                {
                  backgroundColor: colors.iconBackground,
                },
              ]}
            >
              <Text style={styles.menuIcon}>
                📋
              </Text>
            </View>

            <Text
              style={[
                styles.menuLabel,
                {
                  color: colors.text,
                },
              ]}
            >
              Saved Scan Reports
            </Text>

            <Text
              style={[
                styles.menuArrow,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>

          {/* Security */}

          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={onSecurityPress}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.menuIconContainer,
                {
                  backgroundColor: colors.iconBackground,
                },
              ]}
            >
              <Text style={styles.menuIcon}>
                🔒
              </Text>
            </View>

            <Text
              style={[
                styles.menuLabel,
                {
                  color: colors.text,
                },
              ]}
            >
              Security & Privacy
            </Text>

            <Text
              style={[
                styles.menuArrow,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>

          {/* Help */}

          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={onHelpSupportPress}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.menuIconContainer,
                {
                  backgroundColor: colors.iconBackground,
                },
              ]}
            >
              <Text style={styles.menuIcon}>
                💬
              </Text>
            </View>

            <Text
              style={[
                styles.menuLabel,
                {
                  color: colors.text,
                },
              ]}
            >
              Help & Support
            </Text>

            <Text
              style={[
                styles.menuArrow,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===================================================
            LOGOUT
        =================================================== */}

        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: colors.dangerBackground,
              borderColor: colors.danger,
            },
          ]}
          onPress={handleLogoutPress}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.logoutText,
              {
                color: colors.danger,
              },
            ]}
          >
            Log Out
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* =====================================================
          SHARED BOTTOM NAVIGATION
      ===================================================== */}

      <BottomNavBar
        activeTab="profile"
        onTabChange={(tab) => {
          if (tab === 'home') {
            onHomePress?.();
          }

          if (tab === 'insights') {
            onInsightsPress?.();
          }

          if (tab === 'profile') {
            onProfilePress?.();
          }
        }}
      />
    </SafeAreaView>
  );
}

/* ============================================================
   STATIC LAYOUT STYLES
   Colors are supplied by ThemeContext.
   ============================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* ================= HEADER ================= */

  header: {
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
  },

  /* ================= CONTENT ================= */

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },

  /* ================= USER CARD ================= */

  userCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 22,
  },

  avatarContainer: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 1,
  },

  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 19,
    fontWeight: '800',
  },

  userEmail: {
    fontSize: 12,
    marginTop: 3,
  },

  regionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    alignSelf: 'flex-start',
    marginTop: 9,
  },

  regionText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* ================= SECTION ================= */

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  /* ================= ACCOUNT CARDS ================= */

  cardItem: {
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
  },

  cardItemContent: {
    flex: 1,
    marginRight: 12,
  },

  itemLabel: {
    fontSize: 11,
    fontWeight: '700',
  },

  itemValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 3,
  },

  input: {
    borderBottomWidth: 1,
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 4,
    marginTop: 2,
  },

  emailHint: {
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },

  emailBtnColumn: {
    alignItems: 'flex-end',
  },

  editBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editBtnText: {
    fontWeight: '800',
    fontSize: 12,
  },

  /* ================= MENU ================= */

  menuItem: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },

  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  menuIcon: {
    fontSize: 17,
  },

  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },

  menuArrow: {
    fontSize: 23,
    fontWeight: '600',
  },

  /* ================= LOGOUT ================= */

  logoutBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 2,
  },

  logoutText: {
    fontWeight: '800',
    fontSize: 14,
  },

  /* ================= BOTTOM SPACE ================= */

  bottomSpace: {
    height: 85,
  },
});
