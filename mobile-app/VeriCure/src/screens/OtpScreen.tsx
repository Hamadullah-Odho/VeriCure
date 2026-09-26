
import React, { useEffect, useRef, useState } from 'react';

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

/*
 * ============================================================
 * BACKEND
 * ============================================================
 * API_BASE_URL now lives in one shared file: src/config/api.ts
 * Change your IP address there ONCE — it applies to every screen.
 */

import { API_BASE_URL } from '../config/api';

const width = Math.min(Dimensions.get('window').width, 500);

/* ============================================================
   PROPS
   ============================================================ */

interface Props {
  email?: string;

  /*
   * Only used for purpose === 'emailChange'.
   * The account's CURRENT (already logged-in) email —
   * needed so resend can re-call /request-email-change.
   */
  currentEmail?: string;

  /*
   * registration:
   * OTP for account registration
   *
   * login:
   * OTP for login verification
   *
   * forgotPassword:
   * OTP before resetting password
   *
   * emailChange:
   * OTP sent to a NEW email address before it
   * replaces the account's current email
   */
  purpose?:
    | 'registration'
    | 'login'
    | 'forgotPassword'
    | 'emailChange';

  onBackPress?: () => void;

  /*
   * IMPORTANT:
   * Sends the EXACT OTP entered by the user
   * back to App.tsx.
   */
  onVerifySuccess?: (otp: string) => void;
}

/* ============================================================
   OTP SCREEN
   ============================================================ */

export default function OtpScreen({
  email,
  currentEmail,
  purpose = 'registration',
  onBackPress,
  onVerifySuccess,
}: Props) {
  const { colors, isDark } = useTheme();

  /* ==========================================================
     OTP STATE
     ========================================================== */

  const [otp, setOtp] = useState<string[]>([
    '',
    '',
    '',
    '',
  ]);

  /* ==========================================================
     UI STATE
     ========================================================== */

  const [isLoading, setIsLoading] = useState(false);

  const [isResending, setIsResending] =
    useState(false);

  const [toastMessage, setToastMessage] =
    useState<string | null>(null);

  /* ==========================================================
     RESEND TIMER
     ========================================================== */

  const [resendTimer, setResendTimer] =
    useState(60);

  const [canResend, setCanResend] =
    useState(false);

  /* ==========================================================
     TOAST ANIMATION
     ========================================================== */

  const fadeAnim = useRef(
    new Animated.Value(0)
  ).current;

  /* ==========================================================
     INPUT REFERENCES
     ========================================================== */

  const inputRefs = useRef<
    Array<TextInput | null>
  >([]);

  /* ==========================================================
     NORMALIZED EMAIL
     ========================================================== */

  const normalizedEmail =
    typeof email === 'string'
      ? email.trim().toLowerCase()
      : '';

  /* ==========================================================
     SCREEN TEXT
     ========================================================== */

  const isForgotPassword =
    purpose === 'forgotPassword';

  const isLogin =
    purpose === 'login';

  const isEmailChange =
    purpose === 'emailChange';

  const normalizedCurrentEmail =
    typeof currentEmail === 'string'
      ? currentEmail.trim().toLowerCase()
      : '';

  let screenTitle = 'Enter OTP Code';

  if (isForgotPassword) {
    screenTitle = 'Verify Your Email';
  } else if (isLogin) {
    screenTitle = 'Verify Login';
  } else if (isEmailChange) {
    screenTitle = 'Verify New Email';
  }

  const screenDescription =
    'We have sent a 4-digit verification code to';

  /* ==========================================================
     RESEND COUNTDOWN
     ========================================================== */

  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }

    setCanResend(false);

    const timer = setInterval(() => {
      setResendTimer((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [resendTimer]);

  /* ==========================================================
     TIMER FORMAT
     ========================================================== */

  const formattedTimer =
    '00:' +
    resendTimer
      .toString()
      .padStart(2, '0');

  /* ==========================================================
     TOAST
     ========================================================== */

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

  /* ==========================================================
     OTP INPUT
     ========================================================== */

  const handleOtpChange = (
    text: string,
    index: number
  ) => {
    const numericText =
      text.replace(/[^0-9]/g, '');

    /* ========================================================
       PASTE HANDLING
       ======================================================== */

    if (numericText.length > 1) {
      const digits = numericText
        .slice(0, 4)
        .split('');

      const updatedOtp = [
        '',
        '',
        '',
        '',
      ];

      digits.forEach(
        (digit, digitIndex) => {
          if (digitIndex < 4) {
            updatedOtp[digitIndex] =
              digit;
          }
        }
      );

      setOtp(updatedOtp);

      const nextIndex = Math.min(
        digits.length,
        3
      );

      inputRefs.current[
        nextIndex
      ]?.focus();

      return;
    }

    /* ========================================================
       SINGLE DIGIT
       ======================================================== */

    const updatedOtp = [...otp];

    updatedOtp[index] =
      numericText.length > 0
        ? numericText.charAt(0)
        : '';

    setOtp(updatedOtp);

    if (
      numericText.length > 0 &&
      index < 3
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  /* ==========================================================
     BACKSPACE
     ========================================================== */

  const handleKeyPress = (
    event: any,
    index: number
  ) => {
    if (
      event?.nativeEvent?.key ===
        'Backspace' &&
      otp[index] === '' &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }
  };

  /* ==========================================================
     SAFE RESPONSE READER
     ========================================================== */

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

  /* ==========================================================
     VERIFY OTP
     ========================================================== */

  const handleVerify = async () => {
    /*
     * EXACT OTP entered by user.
     */
    const enteredOtp =
      otp.join('').trim();

    console.log(
      'OTP entered:',
      enteredOtp
    );

    /* ========================================================
       CHECK OTP
       ======================================================== */

    if (enteredOtp.length !== 4) {
      showToast(
        'Please enter the complete 4-digit code.'
      );

      return;
    }

    /* ========================================================
       CHECK EMAIL
       ======================================================== */

    if (!normalizedEmail) {
      console.log(
        'OTP ERROR: Email missing:',
        email
      );

      showToast(
        'Email address is missing. Please go back and try again.'
      );

      return;
    }

    /* ========================================================
       PREVENT DOUBLE TAP
       ======================================================== */

    if (
      isLoading ||
      isResending
    ) {
      return;
    }

    Keyboard.dismiss();

    try {
      setIsLoading(true);

      console.log(
        '================================'
      );

      console.log(
        'VERIFY OTP'
      );

      console.log(
        'Purpose:',
        purpose
      );

      console.log(
        'Email:',
        normalizedEmail
      );

      console.log(
        'OTP:',
        enteredOtp
      );

      console.log(
        '================================'
      );

      /* ======================================================
         BACKEND
         ======================================================
         registration / login purposes must verify the
         USER's account (sets users.verified = true) via
         /verify-user-otp.

         forgotPassword / emailChange purposes only need the
         OTP record itself marked verified (checked later by
         reset-password / confirm-email-change) via
         /verify-otp — they must NOT touch users.verified.
         ====================================================== */

      const verifyEndpoint =
        purpose === 'registration' ||
        purpose === 'login'
          ? '/api/auth/verify-user-otp'
          : '/api/auth/verify-otp';

      const response =
        await fetch(
          API_BASE_URL +
            verifyEndpoint,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              email:
                normalizedEmail,

              otp:
                enteredOtp,
            }),
          }
        );

      console.log(
        'Verify OTP status:',
        response.status
      );

      const data =
        await readResponse(response);

      console.log(
        'Verify OTP response:',
        data
      );

      /* ======================================================
         BACKEND ERROR
         ====================================================== */

      if (!response.ok) {
        let message =
          'Invalid OTP. Please try again.';

        if (
          typeof data === 'string' &&
          data.trim().length > 0
        ) {
          message = data;
        } else if (
          data &&
          typeof data.message ===
            'string'
        ) {
          message =
            data.message;
        }

        showToast(message);

        return;
      }

      /* ======================================================
         SUCCESS
         ====================================================== */

      console.log(
        'OTP verified successfully.'
      );

      /*
       * IMPORTANT:
       *
       * Send the exact OTP back to App.tsx.
       *
       * This is especially important for
       * forgot-password reset.
       */

      showToast(
        'OTP verified successfully!'
      );

      setTimeout(() => {
        console.log(
          'Sending verified OTP to App.tsx:',
          enteredOtp
        );

        onVerifySuccess?.(
          enteredOtp
        );
      }, 800);

    } catch (error) {
      console.log(
        'OTP verification error:',
        error
      );

      showToast(
        'Unable to verify OTP. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ==========================================================
     RESEND OTP
     ========================================================== */

  const handleResend = async () => {
    if (!normalizedEmail) {
      showToast(
        'Email address is missing.'
      );

      return;
    }

    if (!canResend) {
      return;
    }

    if (
      isLoading ||
      isResending
    ) {
      return;
    }

    try {
      setIsResending(true);

      console.log(
        '================================'
      );

      console.log(
        'RESEND OTP'
      );

      console.log(
        'Email:',
        normalizedEmail
      );

      console.log(
        '================================'
      );

      /*
       * For forgot-password, use /forgot-password so the backend
       * re-confirms the user still exists (matches the initial
       * screen's call). For email-change, use
       * /request-email-change (different body shape: needs
       * both currentEmail and newEmail). For registration/login
       * OTP, use the generic /send-otp endpoint.
       */

      const resendEndpoint =
        isEmailChange
          ? '/api/auth/request-email-change'
          : isForgotPassword
            ? '/api/auth/forgot-password'
            : '/api/auth/send-otp';

      const resendBody =
        isEmailChange
          ? {
              currentEmail:
                normalizedCurrentEmail,

              newEmail:
                normalizedEmail,
            }
          : {
              email:
                normalizedEmail,
            };

      if (
        isEmailChange &&
        !normalizedCurrentEmail
      ) {
        showToast(
          'Your account email is missing. Please go back and try again.'
        );

        setIsResending(false);

        return;
      }

      const response =
        await fetch(
          API_BASE_URL +
            resendEndpoint,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify(
              resendBody
            ),
          }
        );

      console.log(
        'Resend OTP status:',
        response.status
      );

      const data =
        await readResponse(response);

      console.log(
        'Resend OTP response:',
        data
      );

      if (!response.ok) {
        let message =
          'Unable to resend OTP.';

        if (
          typeof data === 'string' &&
          data.trim().length > 0
        ) {
          message = data;
        } else if (
          data &&
          typeof data.message ===
            'string'
        ) {
          message =
            data.message;
        }

        showToast(message);

        return;
      }

      console.log(
        'New OTP sent successfully.'
      );

      setOtp([
        '',
        '',
        '',
        '',
      ]);

      setTimeout(() => {
        inputRefs.current[
          0
        ]?.focus();
      }, 100);

      setResendTimer(60);
      setCanResend(false);

      showToast(
        'A new OTP has been sent to your email.'
      );

    } catch (error) {
      console.log(
        'Resend OTP error:',
        error
      );

      showToast(
        'Unable to resend OTP. Please check your connection and try again.'
      );
    } finally {
      setIsResending(false);
    }
  };

  /* ==========================================================
     THEMED STYLES
     ========================================================== */

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

    otpBox: {
      backgroundColor:
        colors.card,

      borderColor:
        colors.border,

      color:
        colors.textPrimary,
    },

    verifyButton: {
      backgroundColor:
        colors.primary,

      shadowColor:
        colors.primary,
    },

    resendText: {
      color:
        colors.textMuted,
    },

    resendLink: {
      color:
        colors.primary,
    },

    timerText: {
      color:
        colors.textMuted,
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

  /* ==========================================================
     UI
     ========================================================== */

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
            isLoading ||
            isResending
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
                    ✓
                  </Text>
                </View>

                <Text
                  style={[
                    styles.title,
                    themedStyles.title,
                  ]}
                >
                  {screenTitle}
                </Text>

                <Text
                  style={[
                    styles.subtitle,
                    themedStyles.subtitle,
                  ]}
                >
                  {screenDescription}{' '}

                  <Text
                    style={[
                      styles.emailHighlight,
                      themedStyles.emailHighlight,
                    ]}
                  >
                    {normalizedEmail ||
                      'your email'}
                  </Text>
                  .
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
                {/* OTP BOXES */}

                <View
                  style={
                    styles.otpContainer
                  }
                >
                  {otp.map(
                    (digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          inputRefs.current[
                            index
                          ] = ref;
                        }}
                        style={[
                          styles.otpBox,
                          themedStyles.otpBox,
                        ]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(
                          text
                        ) =>
                          handleOtpChange(
                            text,
                            index
                          )
                        }
                        onKeyPress={(
                          event
                        ) =>
                          handleKeyPress(
                            event,
                            index
                          )
                        }
                        placeholder="-"
                        placeholderTextColor={
                          colors.textMuted
                        }
                        selectionColor={
                          colors.primary
                        }
                        editable={
                          !isLoading &&
                          !isResending
                        }
                        autoFocus={
                          index === 0
                        }
                      />
                    )
                  )}
                </View>

                {/* VERIFY BUTTON */}

                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    themedStyles.verifyButton,
                    isLoading &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    handleVerify
                  }
                  activeOpacity={0.8}
                  disabled={
                    isLoading ||
                    isResending
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
                          styles.verifyButtonText
                        }
                      >
                        Verifying...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text
                        style={
                          styles.verifyButtonText
                        }
                      >
                        Verify Code
                      </Text>

                      <Text
                        style={
                          styles.verifyArrow
                        }
                      >
                        →
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* RESEND */}

                <View
                  style={
                    styles.resendContainer
                  }
                >
                  <Text
                    style={[
                      styles.resendText,
                      themedStyles.resendText,
                    ]}
                  >
                    Didn't receive code?{' '}
                  </Text>

                  {canResend ? (
                    <TouchableOpacity
                      onPress={
                        handleResend
                      }
                      disabled={
                        isLoading ||
                        isResending
                      }
                      activeOpacity={0.7}
                    >
                      {isResending ? (
                        <View
                          style={
                            styles.resendLoading
                          }
                        >
                          <ActivityIndicator
                            size="small"
                            color={
                              colors.primary
                            }
                          />

                          <Text
                            style={[
                              styles.resendLink,
                              themedStyles.resendLink,
                            ]}
                          >
                            Sending...
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.resendLink,
                            themedStyles.resendLink,
                          ]}
                        >
                          Resend
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Text
                      style={[
                        styles.timerText,
                        themedStyles.timerText,
                      ]}
                    >
                      Resend in{' '}
                      {formattedTimer}
                    </Text>
                  )}
                </View>
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

/* ============================================================
   STATIC STYLES
   ============================================================ */

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
    alignItems: 'center',
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
    fontWeight: '900',
  },

  title: {
    fontSize:
      width * 0.07,

    fontWeight: '800',

    marginBottom: 9,

    textAlign: 'center',
  },

  subtitle: {
    fontSize:
      width * 0.038,

    lineHeight: 22,

    textAlign: 'center',
  },

  emailHighlight: {
    fontWeight: '700',
  },

  formSection: {
    width: '100%',
    alignItems: 'center',
  },

  otpContainer: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    width: '88%',

    marginBottom: 30,
  },

  otpBox: {
    width: 56,
    height: 58,

    borderWidth: 1,

    borderRadius: 15,

    textAlign: 'center',

    fontSize: 22,

    fontWeight: '800',
  },

  verifyButton: {
    width: '100%',

    paddingVertical: 15,

    borderRadius: 15,

    alignItems: 'center',

    justifyContent:
      'center',

    marginBottom: 20,

    flexDirection: 'row',

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
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'center',

    gap: 10,
  },

  verifyButtonText: {
    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '800',
  },

  verifyArrow: {
    position: 'absolute',

    right: 18,

    color: '#FFFFFF',

    fontSize: 21,

    fontWeight: '700',
  },

  resendContainer: {
    flexDirection: 'row',

    justifyContent:
      'center',

    alignItems:
      'center',
  },

  resendText: {
    fontSize: 14,
  },

  resendLink: {
    fontSize: 14,

    fontWeight: '800',
  },

  timerText: {
    fontSize: 14,

    fontWeight: '700',
  },

  resendLoading: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 7,
  },

  toastContainer: {
    position: 'absolute',

    bottom: 40,

    alignSelf: 'center',

    maxWidth: '88%',

    flexDirection: 'row',

    alignItems: 'center',

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

    textAlign: 'center',

    flexShrink: 1,
  },
});

