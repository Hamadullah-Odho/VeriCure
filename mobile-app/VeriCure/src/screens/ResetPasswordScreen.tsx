
import React, { useRef, useState } from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { API_BASE_URL } from '../config/api';

const width = Math.min(Dimensions.get('window').width, 500);

/*
 * ============================================================
 * PROPS
 * ============================================================
 */

interface Props {
  email: string;
  otp: string;

  onBackPress?: () => void;

  onResetSuccess?: () => void;
}

/*
 * ============================================================
 * RESET PASSWORD SCREEN
 * ============================================================
 */

export default function ResetPasswordScreen({
  email,
  otp,
  onBackPress,
  onResetSuccess,
}: Props) {
  const { colors, isDark } = useTheme();

  /*
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [toastMessage, setToastMessage] =
    useState<string | null>(null);

  const fadeAnim = useRef(
    new Animated.Value(0)
  ).current;

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
   * NORMALIZE OTP
   * ==========================================================
   */

  const normalizedOtp =
    typeof otp === 'string'
      ? otp.trim()
      : '';

  /*
   * ==========================================================
   * TOAST
   * ==========================================================
   */

  const showToast = (
    message: string
  ) => {
    setToastMessage(message);

    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setToastMessage(null);
      });
    }, 2500);
  };

  /*
   * ==========================================================
   * RESET PASSWORD
   * ==========================================================
   */

  const handleResetPassword = async () => {
    Keyboard.dismiss();

    /*
     * ========================================================
     * VALIDATE EMAIL
     * ========================================================
     */

    if (!normalizedEmail) {
      showToast(
        'Email address is missing. Please try again.'
      );

      return;
    }

    /*
     * ========================================================
     * VALIDATE OTP
     * ========================================================
     */

    if (
      !normalizedOtp ||
      normalizedOtp.length !== 4
    ) {
      showToast(
        'OTP is missing or invalid. Please verify again.'
      );

      return;
    }

    /*
     * ========================================================
     * VALIDATE NEW PASSWORD
     * ========================================================
     */

    if (!newPassword.trim()) {
      showToast(
        'Please enter a new password.'
      );

      return;
    }

    if (newPassword.length < 6) {
      showToast(
        'Password must be at least 6 characters.'
      );

      return;
    }

    /*
     * ========================================================
     * VALIDATE CONFIRM PASSWORD
     * ========================================================
     */

    if (!confirmPassword.trim()) {
      showToast(
        'Please confirm your new password.'
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(
        'Passwords do not match.'
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

    /*
     * ========================================================
     * START
     * ========================================================
     */

    setIsLoading(true);

    console.log(
      '================================'
    );

    console.log(
      'RESET PASSWORD REQUEST'
    );

    console.log(
      'URL:',
      `${API_BASE_URL}/api/auth/reset-password`
    );

    console.log(
      'Email:',
      normalizedEmail
    );

    console.log(
      'OTP:',
      normalizedOtp
    );

    console.log(
      'Password length:',
      newPassword.length
    );

    console.log(
      '================================'
    );

    /*
     * ========================================================
     * REQUEST WITH TIMEOUT
     * ========================================================
     */

    const controller =
      new AbortController();

    const timeoutId =
      setTimeout(() => {
        controller.abort();
      }, 15000);

    try {
      /*
       * ======================================================
       * API REQUEST
       * ======================================================
       */

      const response =
        await fetch(
          `${API_BASE_URL}/api/auth/reset-password`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',
            },

            body: JSON.stringify({
              email:
                normalizedEmail,

              otp:
                normalizedOtp,

              newPassword:
                newPassword,
            }),

            signal:
              controller.signal,
          }
        );

      clearTimeout(timeoutId);

      console.log(
        'Reset password HTTP status:',
        response.status
      );

      /*
       * ======================================================
       * READ RAW RESPONSE
       * ======================================================
       */

      const responseText =
        await response.text();

      console.log(
        'Reset password raw response:',
        responseText
      );

      /*
       * ======================================================
       * PARSE RESPONSE
       * ======================================================
       */

      let data: any = null;

      if (responseText) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch {
          data =
            responseText;
        }
      }

      console.log(
        'Reset password parsed response:',
        data
      );

      /*
       * ======================================================
       * BACKEND ERROR
       * ======================================================
       */

      if (!response.ok) {
        let message =
          'Unable to reset password.';

        if (
          typeof data === 'string' &&
          data.trim().length > 0
        ) {
          message =
            data;
        } else if (
          data &&
          typeof data.message ===
            'string'
        ) {
          message =
            data.message;
        } else if (
          data &&
          typeof data.error ===
            'string'
        ) {
          message =
            data.error;
        }

        console.log(
          'Reset password backend error:',
          message
        );

        showToast(
          message
        );

        return;
      }

      /*
       * ======================================================
       * SUCCESS
       * ======================================================
       */

      console.log(
        '================================'
      );

      console.log(
        'PASSWORD RESET SUCCESSFUL'
      );

      console.log(
        '================================'
      );

      /*
       * Clear password fields.
       */

      setNewPassword('');
      setConfirmPassword('');

      /*
       * Show success message.
       */

      showToast(
        'Password reset successfully!'
      );

      /*
       * Return to login after
       * showing success message.
       */

      setTimeout(() => {
        onResetSuccess?.();
      }, 1000);

    } catch (error: any) {
      clearTimeout(timeoutId);

      console.log(
        '================================'
      );

      console.log(
        'RESET PASSWORD ERROR'
      );

      console.log(
        error
      );

      console.log(
        '================================'
      );

      /*
       * ======================================================
       * TIMEOUT
       * ======================================================
       */

      if (
        error?.name ===
        'AbortError'
      ) {
        showToast(
          'Server took too long to respond. Please check that the backend is running.'
        );

        return;
      }

      /*
       * ======================================================
       * CONNECTION ERROR
       * ======================================================
       */

      showToast(
        'Unable to connect to the server. Please check your connection and try again.'
      );

    } finally {
      clearTimeout(timeoutId);

      setIsLoading(false);
    }
  };

  /*
   * ==========================================================
   * THEMED STYLES
   * ==========================================================
   */

  const themedStyles = {
    container: {
      backgroundColor:
        colors.background,
    },

    navBar: {
      backgroundColor:
        colors.background,
    },

    backButton: {
      backgroundColor:
        colors.card,

      borderColor:
        colors.border,
    },

    backArrow: {
      color:
        colors.primary,
    },

    iconContainer: {
      backgroundColor:
        colors.iconBackground,

      borderColor:
        colors.border,
    },

    iconText: {
      color:
        colors.primary,
    },

    title: {
      color:
        colors.textPrimary,
    },

    subtitle: {
      color:
        colors.textSecondary,
    },

    emailHighlight: {
      color:
        colors.primary,
    },

    input: {
      backgroundColor:
        colors.card,

      borderColor:
        colors.border,

      color:
        colors.textPrimary,
    },

    inputLabel: {
      color:
        colors.textPrimary,
    },

    eyeButton: {
      color:
        colors.primary,
    },

    resetButton: {
      backgroundColor:
        colors.primary,

      shadowColor:
        colors.primary,
    },

    toastContainer: {
      backgroundColor:
        colors.card,

      borderColor:
        colors.border,
    },

    toastIcon: {
      backgroundColor:
        colors.iconBackground,
    },

    toastIconText: {
      color:
        colors.primary,
    },

    toastText: {
      color:
        colors.textPrimary,
    },
  };

  /*
   * ==========================================================
   * UI
   * ==========================================================
   */

  return (
    <SafeAreaView
      style={[
        styles.container,
        themedStyles.container,
      ]}
    >
      <StatusBar
        barStyle={
          isDark
            ? 'light-content'
            : 'dark-content'
        }
        backgroundColor={
          colors.background
        }
      />

      {/* ======================================================
          NAVIGATION
         ====================================================== */}

      <View
        style={[
          styles.navBar,
          themedStyles.navBar,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            themedStyles.backButton,
          ]}
          onPress={
            onBackPress
          }
          disabled={
            isLoading
          }
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.backArrow,
              themedStyles.backArrow,
            ]}
          >
            ←
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================================
          CONTENT
         ====================================================== */}

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        style={
          styles.keyboardView
        }
      >
        <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback
            onPress={
              Keyboard.dismiss
            }
            accessible={false}
          >
            <View>

              {/* ==================================================
                  HEADER
                 ================================================== */}

              <View
                style={
                  styles.headerSection
                }
              >
                <View
                  style={[
                    styles.iconContainer,
                    themedStyles.iconContainer,
                  ]}
                >
                  <Text
                    style={[
                      styles.iconText,
                      themedStyles.iconText,
                    ]}
                  >
                    🔒
                  </Text>
                </View>

                <Text
                  style={[
                    styles.title,
                    themedStyles.title,
                  ]}
                >
                  Reset Password
                </Text>

                <Text
                  style={[
                    styles.subtitle,
                    themedStyles.subtitle,
                  ]}
                >
                  Create a new password for
                </Text>

                <Text
                  style={[
                    styles.emailHighlight,
                    themedStyles.emailHighlight,
                  ]}
                >
                  {normalizedEmail ||
                    'your email'}
                </Text>
              </View>

              {/* ==================================================
                  FORM
                 ================================================== */}

              <View
                style={
                  styles.formSection
                }
              >

                {/* =================================================
                    NEW PASSWORD
                   ================================================= */}

                <Text
                  style={[
                    styles.inputLabel,
                    themedStyles.inputLabel,
                  ]}
                >
                  New Password
                </Text>

                <View
                  style={
                    styles.inputWrapper
                  }
                >
                  <TextInput
                    style={[
                      styles.input,
                      themedStyles.input,
                    ]}
                    placeholder="Enter new password"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    value={
                      newPassword
                    }
                    onChangeText={
                      setNewPassword
                    }
                    secureTextEntry={
                      !showPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={
                      !isLoading
                    }
                    selectionColor={
                      colors.primary
                    }
                  />

                  <TouchableOpacity
                    style={
                      styles.eyeButton
                    }
                    onPress={() =>
                      setShowPassword(
                        previous =>
                          !previous
                      )
                    }
                    disabled={
                      isLoading
                    }
                  >
                    <Text
                      style={[
                        styles.eyeText,
                        themedStyles.eyeButton,
                      ]}
                    >
                      {showPassword
                        ? 'Hide'
                        : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* =================================================
                    CONFIRM PASSWORD
                   ================================================= */}

                <Text
                  style={[
                    styles.inputLabel,
                    themedStyles.inputLabel,
                  ]}
                >
                  Confirm Password
                </Text>

                <View
                  style={
                    styles.inputWrapper
                  }
                >
                  <TextInput
                    style={[
                      styles.input,
                      themedStyles.input,
                    ]}
                    placeholder="Confirm new password"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    value={
                      confirmPassword
                    }
                    onChangeText={
                      setConfirmPassword
                    }
                    secureTextEntry={
                      !showConfirmPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={
                      !isLoading
                    }
                    selectionColor={
                      colors.primary
                    }
                  />

                  <TouchableOpacity
                    style={
                      styles.eyeButton
                    }
                    onPress={() =>
                      setShowConfirmPassword(
                        previous =>
                          !previous
                      )
                    }
                    disabled={
                      isLoading
                    }
                  >
                    <Text
                      style={[
                        styles.eyeText,
                        themedStyles.eyeButton,
                      ]}
                    >
                      {showConfirmPassword
                        ? 'Hide'
                        : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* =================================================
                    PASSWORD REQUIREMENT
                   ================================================= */}

                <Text
                  style={[
                    styles.requirement,
                    {
                      color:
                        colors.textMuted,
                    },
                  ]}
                >
                  Password must contain at least 6
                  characters.
                </Text>

                {/* =================================================
                    RESET BUTTON
                   ================================================= */}

                <TouchableOpacity
                  style={[
                    styles.resetButton,
                    themedStyles.resetButton,
                    isLoading &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    handleResetPassword
                  }
                  activeOpacity={0.8}
                  disabled={
                    isLoading
                  }
                >
                  {isLoading ? (
                    <View
                      style={
                        styles.loadingContent
                      }
                    >
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.resetButtonText
                        }
                      >
                        Resetting...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text
                        style={
                          styles.resetButtonText
                        }
                      >
                        Reset Password
                      </Text>

                      <Text
                        style={
                          styles.resetArrow
                        }
                      >
                        →
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

              </View>

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ======================================================
          TOAST
         ====================================================== */}

      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            themedStyles.toastContainer,
            {
              opacity:
                fadeAnim,
            },
          ]}
        >
          <View
            style={[
              styles.toastIcon,
              themedStyles.toastIcon,
            ]}
          >
            <Text
              style={[
                styles.toastIconText,
                themedStyles.toastIconText,
              ]}
            >
              ✓
            </Text>
          </View>

          <Text
            style={[
              styles.toastText,
              themedStyles.toastText,
            ]}
          >
            {toastMessage}
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  navBar: {
    paddingHorizontal:
      width * 0.06,

    paddingTop: 10,

    paddingBottom: 10,
  },

  backButton: {
    width: 40,

    height: 40,

    borderRadius: 20,

    justifyContent:
      'center',

    alignItems:
      'center',

    borderWidth: 1,
  },

  backArrow: {
    fontSize: 22,

    fontWeight: '600',

    marginTop: -2,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,

    paddingHorizontal:
      width * 0.07,

    justifyContent:
      'center',

    paddingBottom: 40,
  },

  headerSection: {
    marginBottom: 32,

    alignItems:
      'center',
  },

  iconContainer: {
    width: 62,

    height: 62,

    borderRadius: 20,

    justifyContent:
      'center',

    alignItems:
      'center',

    marginBottom: 16,

    borderWidth: 1,
  },

  iconText: {
    fontSize: 27,
  },

  title: {
    fontSize:
      width * 0.07,

    fontWeight: '800',

    marginBottom: 9,

    textAlign:
      'center',
  },

  subtitle: {
    fontSize:
      width * 0.038,

    lineHeight: 22,

    textAlign:
      'center',
  },

  emailHighlight: {
    fontSize:
      width * 0.038,

    fontWeight: '700',

    textAlign:
      'center',

    marginTop: 3,
  },

  formSection: {
    width: '100%',
  },

  inputLabel: {
    fontSize: 14,

    fontWeight: '700',

    marginBottom: 8,

    marginTop: 5,
  },

  inputWrapper: {
    width: '100%',

    position: 'relative',

    marginBottom: 18,
  },

  input: {
    width: '100%',

    height: 56,

    borderWidth: 1,

    borderRadius: 15,

    paddingHorizontal: 17,

    paddingRight: 70,

    fontSize: 15,
  },

  eyeButton: {
    position: 'absolute',

    right: 16,

    top: 0,

    height: 56,

    justifyContent:
      'center',

    alignItems:
      'center',
  },

  eyeText: {
    fontSize: 12,

    fontWeight: '800',
  },

  requirement: {
    fontSize: 12,

    marginTop: -4,

    marginBottom: 22,
  },

  resetButton: {
    width: '100%',

    paddingVertical: 15,

    borderRadius: 15,

    alignItems:
      'center',

    justifyContent:
      'center',

    flexDirection:
      'row',

    shadowOffset: {
      width: 0,

      height: 5,
    },

    shadowOpacity: 0.3,

    shadowRadius: 10,

    elevation: 6,

    position: 'relative',
  },

  disabledButton: {
    opacity: 0.6,
  },

  loadingContent: {
    flexDirection:
      'row',

    alignItems:
      'center',

    justifyContent:
      'center',

    gap: 10,
  },

  resetButtonText: {
    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '800',
  },

  resetArrow: {
    position: 'absolute',

    right: 18,

    color: '#FFFFFF',

    fontSize: 21,

    fontWeight: '700',
  },

  toastContainer: {
    position: 'absolute',

    bottom: 40,

    alignSelf:
      'center',

    maxWidth: '88%',

    flexDirection:
      'row',

    alignItems:
      'center',

    paddingVertical: 12,

    paddingHorizontal: 18,

    borderRadius: 18,

    borderWidth: 1,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,

      height: 5,
    },

    shadowOpacity: 0.35,

    shadowRadius: 10,

    elevation: 8,

    zIndex: 999,
  },

  toastIcon: {
    width: 26,

    height: 26,

    borderRadius: 13,

    justifyContent:
      'center',

    alignItems:
      'center',

    marginRight: 9,
  },

  toastIconText: {
    fontSize: 14,

    fontWeight: '900',
  },

  toastText: {
    fontSize: 13,

    fontWeight: '600',

    textAlign:
      'center',

    flexShrink: 1,
  },
});
