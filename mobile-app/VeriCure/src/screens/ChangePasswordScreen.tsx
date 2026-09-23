import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

/*
 * ============================================================
 * BACKEND
 * ============================================================
 * API_BASE_URL now lives in one shared file: src/config/api.ts
 * Change your IP address there ONCE — it applies to every screen.
 */

import { API_BASE_URL } from '../config/api';

/*
 * ============================================================
 * PROPS
 * ============================================================
 */

interface Props {
  /*
   * The email of the currently logged-in user.
   * Passed down from App.tsx (stored at login time).
   */
  email: string;

  onBackPress?: () => void;
}

export default function ChangePasswordScreen({
  email,
  onBackPress,
}: Props) {
  const { colors } = useTheme();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const [toastMessage, setToastMessage] =
    useState<string | null>(null);

  const [toastIsError, setToastIsError] =
    useState(false);

  /*
   * ==========================================================
   * NORMALIZE EMAIL
   * ==========================================================
   */

  const normalizedEmail =
    typeof email === 'string'
      ? email.trim().toLowerCase()
      : '';

  /*
   * ==========================================================
   * TOAST
   * ==========================================================
   */

  const showToast = (
    message: string,
    isError: boolean = false
  ) => {
    setToastMessage(message);
    setToastIsError(isError);

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

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
   * UPDATE PASSWORD
   * ==========================================================
   */

  const handleUpdatePassword = async () => {

    Keyboard.dismiss();

    /*
     * ========================================================
     * VALIDATE EMAIL (SESSION)
     * ========================================================
     */

    if (!normalizedEmail) {
      Alert.alert(
        'Session Error',
        'We could not find your logged-in account. Please log out and log back in.'
      );

      return;
    }

    /*
     * ========================================================
     * VALIDATE FIELDS
     * ========================================================
     */

    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast(
        'Please fill in all fields',
        true
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(
        'New passwords do not match',
        true
      );

      return;
    }

    /*
     * Match backend rules:
     * at least 8 characters + 1 special character.
     */

    if (newPassword.length < 8) {
      showToast(
        'Password must be at least 8 characters',
        true
      );

      return;
    }

    const hasSpecialChar =
      /[!@#$%^&*(),.?":{}|<>]/.test(
        newPassword
      );

    if (!hasSpecialChar) {
      showToast(
        'Password must contain at least one special character',
        true
      );

      return;
    }

    if (newPassword === oldPassword) {
      showToast(
        'New password must be different from the current password',
        true
      );

      return;
    }

    /*
     * ========================================================
     * PREVENT DOUBLE TAP
     * ========================================================
     */

    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      console.log(
        '================================'
      );

      console.log(
        'CHANGE PASSWORD'
      );

      console.log(
        'Email:',
        normalizedEmail
      );

      console.log(
        '================================'
      );

      /*
       * ======================================================
       * CALL BACKEND
       * ======================================================
       *
       * POST /api/auth/change-password
       *
       * Body:
       * {
       *   email: "user@gmail.com",
       *   currentPassword: "...",
       *   newPassword: "..."
       * }
       */

      const response =
        await fetch(
          API_BASE_URL +
            '/api/auth/change-password',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              email:
                normalizedEmail,

              currentPassword:
                oldPassword,

              newPassword:
                newPassword,
            }),
          }
        );

      console.log(
        'Change password status:',
        response.status
      );

      const data =
        await readResponse(response);

      console.log(
        'Change password response:',
        data
      );

      /*
       * ======================================================
       * BACKEND ERROR
       * ======================================================
       */

      if (!response.ok) {
        let message =
          'Unable to change password. Please try again.';

        if (
          data &&
          typeof data.message === 'string'
        ) {
          message = data.message;
        } else if (
          typeof data === 'string' &&
          data.trim().length > 0
        ) {
          message = data;
        }

        showToast(
          message,
          true
        );

        return;
      }

      /*
       * ======================================================
       * SUCCESS
       * ======================================================
       */

      console.log(
        'Password changed successfully.'
      );

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      showToast(
        'Password updated successfully! ✅'
      );

    } catch (error) {

      console.log(
        'Change password error:',
        error
      );

      showToast(
        'Unable to connect to the server. Please check your connection and try again.',
        true
      );

    } finally {
      setIsLoading(false);
    }
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
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >

        <TouchableOpacity
          onPress={onBackPress}
          disabled={isLoading}
          style={[
            styles.backBtn,
            {
              backgroundColor: colors.cardSecondary,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.backArrow,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            ←
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.textPrimary,
            },
          ]}
        >
          Change Password
        </Text>

        <View style={styles.headerSpacer} />

      </View>


      {/* =====================================================
          CONTENT
          ===================================================== */}

      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        accessible={false}
      >
      <View style={styles.content}>

        {/* =================================================
            TOAST
            ================================================= */}

        {toastMessage && (
          <View
            style={[
              styles.toast,
              toastIsError
                ? {
                    backgroundColor:
                      colors.errorBackground ||
                      '#FDECEC',
                    borderColor:
                      colors.error ||
                      '#D64545',
                  }
                : {
                    backgroundColor: colors.successBackground,
                    borderColor: colors.success,
                  },
            ]}
          >
            <Text
              style={[
                styles.toastText,
                {
                  color: toastIsError
                    ? (colors.error || '#D64545')
                    : colors.success,
                },
              ]}
            >
              {toastMessage}
            </Text>
          </View>
        )}


        {/* =================================================
            CURRENT PASSWORD
            ================================================= */}

        <Text
          style={[
            styles.label,
            {
              color: colors.textPrimary,
            },
          ]}
        >
          Current Password
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          secureTextEntry
          placeholder="Enter current password"
          placeholderTextColor={colors.textSecondary}
          value={oldPassword}
          onChangeText={setOldPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />


        {/* =================================================
            NEW PASSWORD
            ================================================= */}

        <Text
          style={[
            styles.label,
            {
              color: colors.textPrimary,
            },
          ]}
        >
          New Password
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          secureTextEntry
          placeholder="Enter new password"
          placeholderTextColor={colors.textSecondary}
          value={newPassword}
          onChangeText={setNewPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />


        {/* =================================================
            CONFIRM PASSWORD
            ================================================= */}

        <Text
          style={[
            styles.label,
            {
              color: colors.textPrimary,
            },
          ]}
        >
          Confirm New Password
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          secureTextEntry
          placeholder="Re-enter new password"
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />

        <Text
          style={[
            styles.requirement,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Password must be at least 8 characters and
          include at least one special character.
        </Text>


        {/* =================================================
            UPDATE BUTTON
            ================================================= */}

        <TouchableOpacity
          style={[
            styles.updateBtn,
            {
              backgroundColor: colors.primary,
            },
            isLoading && styles.disabledBtn,
          ]}
          onPress={handleUpdatePassword}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
              <Text style={styles.updateBtnText}>
                Updating...
              </Text>
            </View>
          ) : (
            <Text style={styles.updateBtnText}>
              Update Password
            </Text>
          )}
        </TouchableOpacity>

      </View>
      </TouchableWithoutFeedback>

    </SafeAreaView>
  );
}


/* ============================================================
   STYLES
   ============================================================ */

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  /* ==========================================================
     HEADER
     ========================================================== */

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

  /* ==========================================================
     CONTENT
     ========================================================== */

  content: {
    padding: 20,
  },

  /* ==========================================================
     TOAST
     ========================================================== */

  toast: {
    borderWidth: 1,
    borderRadius: 12,

    padding: 14,
    marginBottom: 20,

    alignItems: 'center',
  },

  toastText: {
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },

  /* ==========================================================
     LABEL
     ========================================================== */

  label: {
    fontSize: 13,
    fontWeight: '700',

    marginBottom: 6,
    marginTop: 10,
  },

  /* ==========================================================
     INPUT
     ========================================================== */

  input: {
    borderRadius: 12,

    borderWidth: 1,

    paddingHorizontal: 16,
    paddingVertical: 12,

    fontSize: 15,
  },

  requirement: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },

  /* ==========================================================
     BUTTON
     ========================================================== */

  updateBtn: {
    borderRadius: 14,

    paddingVertical: 14,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 24,
  },

  disabledBtn: {
    opacity: 0.65,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  updateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

});
