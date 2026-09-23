
import React, { useState } from 'react';

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

/*
 * ============================================================
 * BACKEND
 * ============================================================
 *
 * API_BASE_URL now lives in one shared file:
 * src/config/api.ts
 *
 * Change your IP address there ONCE and it applies
 * to every screen automatically.
 */

import { API_BASE_URL } from '../config/api';

/*
 * ============================================================
 * PROPS
 * ============================================================
 */

interface Props {
  onBackPress?: () => void;

  /*
   * Called after the backend successfully sends
   * the forgot-password OTP.
   *
   * The parent should then open OtpScreen.
   */
  onOtpSendSuccess?: (email: string) => void;
}

/*
 * ============================================================
 * FORGOT PASSWORD SCREEN
 * ============================================================
 */

export default function ForgotPasswordScreen({
  onBackPress,
  onOtpSendSuccess,
}: Props) {
  /*
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const [email, setEmail] = useState('');

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  /*
   * ==========================================================
   * THEME
   * ==========================================================
   */

  const { colors, isDark } = useTheme();

  const { height, width } =
    useWindowDimensions();

  const isSmallScreen =
    height < 700;

  const isTablet =
    width >= 600;

  /*
   * ==========================================================
   * NORMALIZE EMAIL
   * ==========================================================
   */

  const normalizedEmail =
    email.trim().toLowerCase();

  /*
   * ==========================================================
   * EMAIL VALIDATION
   * ==========================================================
   */

  const isValidEmail = (
    value: string
  ) => {
    /*
     * Basic email validation.
     *
     * Example:
     * user@gmail.com
     * user@yahoo.com
     * user@hotmail.com
     */

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(value);
  };

  /*
   * ==========================================================
   * SAFE RESPONSE READER
   * ==========================================================
   *
   * Prevents errors if Spring Boot returns:
   *
   * JSON
   * OR
   * plain text
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
      return JSON.parse(
        responseText
      );
    } catch {
      return responseText;
    }
  };

  /*
   * ==========================================================
   * SEND OTP
   * ==========================================================
   */

  const handleSendOtp = async () => {
    /*
     * Remove keyboard.
     */

    Keyboard.dismiss();

    /*
     * Clear previous error.
     */

    setErrorMessage('');

    /*
     * ========================================================
     * EMPTY EMAIL
     * ========================================================
     */

    if (!normalizedEmail) {
      setErrorMessage(
        'Please enter your email address.'
      );

      return;
    }

    /*
     * ========================================================
     * INVALID EMAIL
     * ========================================================
     */

    if (
      !isValidEmail(
        normalizedEmail
      )
    ) {
      setErrorMessage(
        'Please enter a valid email address.'
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
        'FORGOT PASSWORD'
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
       * POST:
       *
       * /api/auth/forgot-password
       *
       * Body:
       *
       * {
       *   email: "user@gmail.com"
       * }
       */

      const response =
        await fetch(
          API_BASE_URL +
            '/api/auth/forgot-password',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              email:
                normalizedEmail,
            }),
          }
        );

      console.log(
        'Forgot password status:',
        response.status
      );

      /*
       * ======================================================
       * READ RESPONSE
       * ======================================================
       */

      const data =
        await readResponse(
          response
        );

      console.log(
        'Forgot password response:',
        data
      );

      /*
       * ======================================================
       * BACKEND ERROR
       * ======================================================
       */

      if (!response.ok) {
        let message =
          'Unable to send OTP. Please try again.';

        /*
         * Spring Boot normally returns:
         *
         * {
         *   success: false,
         *   message: "User not found"
         * }
         */

        if (
          data &&
          typeof data.message ===
            'string'
        ) {
          message =
            data.message;
        } else if (
          typeof data === 'string' &&
          data.trim().length > 0
        ) {
          message =
            data;
        }

        setErrorMessage(message);

        return;
      }

      /*
       * ======================================================
       * SUCCESS
       * ======================================================
       */

      console.log(
        'Forgot password OTP sent successfully.'
      );

      /*
       * ======================================================
       * OPEN OTP SCREEN
       * ======================================================
       *
       * Pass the normalized email.
       *
       * The parent App.tsx should use this email
       * when opening OtpScreen.
       */

      if (onOtpSendSuccess) {
        onOtpSendSuccess(
          normalizedEmail
        );
      }

    } catch (error) {
      /*
       * ======================================================
       * NETWORK ERROR
       * ======================================================
       */

      console.log(
        'Forgot password error:',
        error
      );

      setErrorMessage(
        'Unable to connect to the server. Please check your connection and try again.'
      );

    } finally {
      setIsLoading(false);
    }
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
        {
          backgroundColor:
            colors.background,
        },
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
          BACKGROUND GLOWS
         ====================================================== */}

      <View
        style={styles.topGlow}
      />

      <View
        style={styles.bottomGlow}
      />

      {/* ======================================================
          HEADER
         ====================================================== */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.background,

            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onBackPress}
          disabled={isLoading}
          style={[
            styles.backButton,
            {
              backgroundColor:
                colors.cardSecondary,

              borderColor:
                colors.border,
            },
          ]}
          activeOpacity={0.7}
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
        >
          <Text
            style={[
              styles.backArrow,
              {
                color:
                  colors.textPrimary,
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
              color:
                colors.textPrimary,
            },
          ]}
        >
          Forgot Password
        </Text>

        <View
          style={
            styles.headerSpacer
          }
        />
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
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal:
                isTablet
                  ? 32
                  : 24,

              maxWidth:
                isTablet
                  ? 480
                  : 500,
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================================================
              MAIN CONTENT
             ================================================== */}

          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
          <View
            style={styles.content}
          >

            {/* =================================================
                ICON
               ================================================= */}

            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    colors.iconBackground,

                  borderColor:
                    colors.primary,

                  marginBottom:
                    isSmallScreen
                      ? 18
                      : 24,
                },
              ]}
            >
              <Text
                style={[
                  styles.iconText,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                ?
              </Text>
            </View>

            {/* =================================================
                HEADING
               ================================================= */}

            <View
              style={[
                styles.headerSection,
                {
                  marginBottom:
                    isSmallScreen
                      ? 22
                      : 28,
                },
              ]}
            >
              <Text
                style={[
                  styles.title,
                  {
                    color:
                      colors.textPrimary,

                    fontSize:
                      isTablet
                        ? 31
                        : isSmallScreen
                        ? 26
                        : 29,
                  },
                ]}
              >
                Forgot Password?
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Enter your registered
                email address and
                we'll send you a
                verification code to
                reset your password.
              </Text>
            </View>

            {/* =================================================
                FORM
               ================================================= */}

            <View
              style={styles.form}
            >

              {/* =================================================
                  EMAIL
                 ================================================= */}

              <View
                style={
                  styles.inputContainer
                }
              >
                <Text
                  style={[
                    styles.label,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Email Address
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor:
                        colors.inputBackground,

                      borderColor:
                        errorMessage
                          ? '#D64545'
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.inputIcon,
                      {
                        color:
                          colors.primary,
                      },
                    ]}
                  >
                    @
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        color:
                          colors.textPrimary,
                      },
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={(
                      text
                    ) => {
                      setEmail(text);

                      /*
                       * Remove error as soon
                       * as user starts editing.
                       */

                      if (
                        errorMessage
                      ) {
                        setErrorMessage(
                          ''
                        );
                      }
                    }}
                    editable={
                      !isLoading
                    }
                    returnKeyType="done"
                    onSubmitEditing={
                      handleSendOtp
                    }
                  />
                </View>

                {/* =================================================
                    ERROR MESSAGE
                   ================================================= */}

                {errorMessage ? (
                  <Text
                    style={[
                      styles.errorText,
                      {
                        color:
                          '#D64545',
                      },
                    ]}
                  >
                    {errorMessage}
                  </Text>
                ) : null}
              </View>

              {/* =================================================
                  SEND OTP BUTTON
                 ================================================= */}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor:
                      colors.primaryDark,

                    borderColor:
                      colors.primary,

                    height:
                      isSmallScreen
                        ? 50
                        : 54,
                  },

                  isLoading &&
                    styles.disabledButton,
                ]}
                onPress={
                  handleSendOtp
                }
                activeOpacity={0.85}
                disabled={isLoading}
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
                        styles.submitButtonText
                      }
                    >
                      Sending...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text
                      style={
                        styles.submitButtonText
                      }
                    >
                      Send OTP Code
                    </Text>

                    <Text
                      style={styles.arrow}
                    >
                      →
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* =================================================
                INFORMATION
               ================================================= */}

            <View
              style={
                styles.infoContainer
              }
            >
              <Text
                style={[
                  styles.infoText,
                  {
                    color:
                      colors.textMuted,
                  },
                ]}
              >
                You'll receive a
                verification code at
                your registered email
                address.
              </Text>
            </View>

          </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
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

  /* ==========================================================
     BACKGROUND
     ========================================================== */

  topGlow: {
    position: 'absolute',

    width: 260,

    height: 260,

    borderRadius: 130,

    backgroundColor: '#087EA4',

    opacity: 0.10,

    top: -130,

    right: -110,
  },

  bottomGlow: {
    position: 'absolute',

    width: 300,

    height: 300,

    borderRadius: 150,

    backgroundColor: '#1266E8',

    opacity: 0.08,

    bottom: -170,

    left: -140,
  },

  /* ==========================================================
     HEADER
     ========================================================== */

  header: {
    height: 62,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    paddingHorizontal: 20,

    borderBottomWidth: 1,
  },

  backButton: {
    width: 38,

    height: 38,

    borderRadius: 19,

    borderWidth: 1,

    justifyContent: 'center',

    alignItems: 'center',
  },

  backArrow: {
    fontSize: 22,

    fontWeight: '600',

    marginTop: -2,
  },

  headerTitle: {
    fontSize: 17,

    fontWeight: '800',
  },

  headerSpacer: {
    width: 38,
  },

  /* ==========================================================
     LAYOUT
     ========================================================== */

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,

    width: '100%',

    alignSelf: 'center',

    paddingTop: 20,

    paddingBottom: 35,

    justifyContent: 'center',
  },

  content: {
    width: '100%',
  },

  /* ==========================================================
     ICON
     ========================================================== */

  iconContainer: {
    width: 64,

    height: 64,

    borderRadius: 32,

    alignSelf: 'center',

    justifyContent: 'center',

    alignItems: 'center',

    borderWidth: 1,
  },

  iconText: {
    fontSize: 28,

    fontWeight: '800',
  },

  /* ==========================================================
     HEADING
     ========================================================== */

  headerSection: {
    alignItems: 'center',
  },

  title: {
    fontWeight: '800',

    letterSpacing: 0.2,

    textAlign: 'center',

    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,

    lineHeight: 21,

    textAlign: 'center',
  },

  /* ==========================================================
     FORM
     ========================================================== */

  form: {
    width: '100%',
  },

  inputContainer: {
    width: '100%',

    marginBottom: 18,
  },

  label: {
    fontSize: 13,

    fontWeight: '600',

    marginBottom: 7,

    marginLeft: 3,
  },

  inputWrapper: {
    height: 52,

    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderRadius: 15,

    paddingHorizontal: 14,
  },

  inputIcon: {
    width: 25,

    fontSize: 15,

    fontWeight: '700',

    textAlign: 'center',

    marginRight: 5,
  },

  input: {
    flex: 1,

    height: '100%',

    fontSize: 14.5,

    paddingVertical: 0,
  },

  errorText: {
    fontSize: 12.5,

    marginTop: 7,

    marginLeft: 3,

    fontWeight: '600',
  },

  /* ==========================================================
     BUTTON
     ========================================================== */

  submitButton: {
    width: '100%',

    borderRadius: 16,

    borderWidth: 1,

    alignItems: 'center',

    justifyContent: 'center',

    position: 'relative',
  },

  disabledButton: {
    opacity: 0.65,
  },

  loadingContent: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 10,
  },

  submitButtonText: {
    color: '#FFFFFF',

    fontSize: 15.5,

    fontWeight: '800',
  },

  arrow: {
    position: 'absolute',

    right: 18,

    color: '#FFFFFF',

    fontSize: 21,
  },

  /* ==========================================================
     INFORMATION
     ========================================================== */

  infoContainer: {
    marginTop: 22,

    paddingHorizontal: 10,
  },

  infoText: {
    fontSize: 11.5,

    lineHeight: 17,

    textAlign: 'center',
  },
});