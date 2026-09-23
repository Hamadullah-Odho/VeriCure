
import React, { useEffect, useRef, useState } from 'react';

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  useWindowDimensions,
  StatusBar,
  Animated,
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

interface Props {
  onLoginSuccess: (email: string) => void;
  onSignUpPress: () => void;
  onForgotPasswordPress: () => void;

  // Called when backend says the account is not verified.
  // App.tsx will use this to open the OTP screen.
  onOtpRequired: (email: string) => void;

  // Called when the user taps "Continue as Guest". This is
  // NOT the same as onLoginSuccess — there is no email and
  // nothing is persisted to AsyncStorage. App.tsx starts a
  // separate, in-memory-only guest session.
  onGuestPress: () => void;
}

export default function LoginScreen({
  onLoginSuccess,
  onSignUpPress,
  onForgotPasswordPress,
  onOtpRequired,
  onGuestPress,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isPasswordVisible, setIsPasswordVisible] =
    useState(false);

  const [isLoggingIn, setIsLoggingIn] =
    useState(false);

  const [emailError, setEmailError] =
    useState('');

  const [passwordError, setPasswordError] =
    useState('');

  const { height, width } = useWindowDimensions();
  const { colors, isDark } = useTheme();

  const isSmallScreen = height < 700;
  const isTablet = width >= 600;

  // ==========================================================
  // LOGIN ANIMATION
  // ==========================================================

  const spinValue = useRef(
    new Animated.Value(0)
  ).current;

  const dotsOpacity = useRef(
    new Animated.Value(0.3)
  ).current;

  useEffect(() => {
    if (!isLoggingIn) {
      spinValue.stopAnimation();
      dotsOpacity.stopAnimation();
      return;
    }

    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(dotsOpacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      spinValue.stopAnimation();
      dotsOpacity.stopAnimation();
    };
  }, [isLoggingIn]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ==========================================================
  // EMAIL VALIDATION
  // ==========================================================

  const validateEmail = (value: string) => {
    const trimmedEmail = value.trim();

    if (!trimmedEmail) {
      return 'Please enter your email address';
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address';
    }

    return '';
  };

  // ==========================================================
  // PASSWORD VALIDATION
  // ==========================================================

  const validatePassword = (value: string) => {
    if (!value.trim()) {
      return 'Please enter your password';
    }

    return '';
  };

  // ==========================================================
  // EMAIL CHANGE
  // ==========================================================

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (emailError) {
      setEmailError(validateEmail(value));
    }
  };

  // ==========================================================
  // PASSWORD CHANGE
  // ==========================================================

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    if (passwordError) {
      setPasswordError(validatePassword(value));
    }
  };

  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleLogin = async () => {
    if (isLoggingIn) {
      return;
    }

    // --------------------------------------------------------
    // CLEAR PREVIOUS ERRORS
    // --------------------------------------------------------

    setEmailError('');
    setPasswordError('');

    // --------------------------------------------------------
    // VALIDATE EMAIL
    // --------------------------------------------------------

    const emailValidation =
      validateEmail(email);

    // --------------------------------------------------------
    // VALIDATE PASSWORD
    // --------------------------------------------------------

    const passwordValidation =
      validatePassword(password);

    if (
      emailValidation ||
      passwordValidation
    ) {
      setEmailError(emailValidation);
      setPasswordError(passwordValidation);
      return;
    }

    // --------------------------------------------------------
    // NORMALIZED EMAIL
    // --------------------------------------------------------

    const normalizedEmail =
      email.trim().toLowerCase();

    setIsLoggingIn(true);

    const startTime = Date.now();

    try {
      // ======================================================
      // CALL SPRING BOOT BACKEND
      // ======================================================

      const response = await fetch(
        API_BASE_URL + '/api/auth/login',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            email: normalizedEmail,
            password: password,
          }),
        }
      );

      // ------------------------------------------------------
      // SAFELY READ RESPONSE
      // ------------------------------------------------------

      const responseText =
        await response.text();

      let data: any = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {
            message: responseText,
          };
        }
      }

      console.log(
        '================================'
      );

      console.log(
        'LOGIN RESPONSE'
      );

      console.log(
        'Status:',
        response.status
      );

      console.log(
        'Data:',
        data
      );

      console.log(
        '================================'
      );

      // ======================================================
      // KEEP LOGIN ANIMATION FOR AT LEAST 2 SECONDS
      // ======================================================

      const elapsedTime =
        Date.now() - startTime;

      const remainingTime =
        Math.max(
          0,
          2000 - elapsedTime
        );

      await new Promise(resolve =>
        setTimeout(
          resolve,
          remainingTime
        )
      );

      // ======================================================
      // SUCCESSFUL LOGIN
      // ======================================================

      if (
        response.ok &&
        data?.success === true &&
        data?.requiresOtp !== true
      ) {
        console.log(
          'Login successful. Account is verified.'
        );

        setIsLoggingIn(false);

        onLoginSuccess(normalizedEmail);

        return;
      }

      // ======================================================
      // ACCOUNT NOT VERIFIED
      // ======================================================

      if (
        data?.requiresOtp === true
      ) {
        console.log(
          'Account is not verified.'
        );

        console.log(
          'Opening OTP screen for:',
          normalizedEmail
        );

        setIsLoggingIn(false);

        /*
         * IMPORTANT:
         *
         * We now tell App.tsx that OTP verification
         * is required.
         *
         * The email is passed to OtpScreen so the OTP
         * verification request knows which account
         * is being verified.
         */

        onOtpRequired(
          normalizedEmail
        );

        return;
      }

      // ======================================================
      // INVALID EMAIL / PASSWORD
      // ======================================================

      if (
        data?.message ===
        'Invalid email or password'
      ) {
        setEmailError(
          'Email or password is incorrect'
        );

        setPasswordError(
          'Email or password is incorrect'
        );

        setIsLoggingIn(false);

        return;
      }

      // ======================================================
      // OTHER BACKEND ERROR
      // ======================================================

      setEmailError(
        data?.message ||
          'Unable to login. Please try again.'
      );

      setIsLoggingIn(false);

    } catch (error) {
      // ======================================================
      // NETWORK ERROR
      // ======================================================

      console.log(
        'Login error:',
        error
      );

      const elapsedTime =
        Date.now() - startTime;

      const remainingTime =
        Math.max(
          0,
          2000 - elapsedTime
        );

      await new Promise(resolve =>
        setTimeout(
          resolve,
          remainingTime
        )
      );

      setIsLoggingIn(false);

      setEmailError(
        'Unable to connect to the server'
      );
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

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

      {/* =====================================================
          BACKGROUND GLOW
      ===================================================== */}

      <View
        style={[
          styles.topGlow,
          {
            backgroundColor:
              colors.primary,
          },
        ]}
      />

      <View
        style={[
          styles.bottomGlow,
          {
            backgroundColor:
              colors.primary,
          },
        ]}
      />

      {/* =====================================================
          KEYBOARD
      ===================================================== */}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
        >
        <View
          style={[
            styles.content,
            {
              maxWidth: isTablet
                ? 480
                : 500,

              paddingHorizontal:
                isTablet
                  ? 32
                  : 24,
            },
          ]}
        >
          {/* =================================================
              LOGO
          ================================================= */}

          <View
            style={[
              styles.logoContainer,
              {
                marginTop:
                  isSmallScreen
                    ? 4
                    : 12,
              },
            ]}
          >
            <Image
              source={require(
                '../../assets/vericure_logo.png'
              )}
              style={{
                width: isTablet
                  ? 78
                  : 65,

                height: isTablet
                  ? 78
                  : 65,
              }}
              resizeMode="contain"
            />
          </View>

          {/* =================================================
              HEADER
          ================================================= */}

          <View
            style={[
              styles.header,
              {
                marginTop:
                  isSmallScreen
                    ? 4
                    : 8,

                marginBottom:
                  isSmallScreen
                    ? 18
                    : 24,
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  color:
                    colors.text,

                  fontSize:
                    isTablet
                      ? 31
                      : isSmallScreen
                      ? 26
                      : 29,
                },
              ]}
            >
              Welcome Back
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              Sign in to continue using VeriCure
            </Text>
          </View>

          {/* =================================================
              FORM
          ================================================= */}

          <View style={styles.form}>

            {/* =================================================
                EMAIL
            ================================================= */}

            <View
              style={[
                styles.inputContainer,
                {
                  marginBottom:
                    emailError
                      ? 10
                      : isSmallScreen
                      ? 12
                      : 15,
                },
              ]}
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
                      colors.cardSecondary,

                    borderColor:
                      emailError
                        ? '#FF4D4F'
                        : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.inputIcon,
                    {
                      color:
                        emailError
                          ? '#FF4D4F'
                          : colors.primary,
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
                        colors.text,
                    },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  value={email}
                  onChangeText={
                    handleEmailChange
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoggingIn}
                />
              </View>

              {emailError ? (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {emailError}
                </Text>
              ) : null}
            </View>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <View
              style={[
                styles.inputContainer,
                {
                  marginBottom:
                    passwordError
                      ? 8
                      : isSmallScreen
                      ? 8
                      : 10,
                },
              ]}
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
                Password
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor:
                      colors.cardSecondary,

                    borderColor:
                      passwordError
                        ? '#FF4D4F'
                        : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.inputIcon,
                    {
                      color:
                        passwordError
                          ? '#FF4D4F'
                          : colors.primary,
                    },
                  ]}
                >
                  ●
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  secureTextEntry={
                    !isPasswordVisible
                  }
                  value={password}
                  onChangeText={
                    handlePasswordChange
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoggingIn}
                />

                <TouchableOpacity
                  onPress={() =>
                    setIsPasswordVisible(
                      !isPasswordVisible
                    )
                  }
                  style={
                    styles.eyeButton
                  }
                  disabled={
                    isLoggingIn
                  }
                  hitSlop={{
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10,
                  }}
                >
                  <Text
                    style={[
                      styles.eyeText,
                      {
                        color:
                          colors.primary,
                      },
                    ]}
                  >
                    {isPasswordVisible
                      ? 'Hide'
                      : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>

              {passwordError ? (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {passwordError}
                </Text>
              ) : null}
            </View>

            {/* =================================================
                FORGOT PASSWORD
            ================================================= */}

            <TouchableOpacity
              onPress={
                onForgotPasswordPress
              }
              style={
                styles.forgotContainer
              }
              activeOpacity={0.7}
              disabled={isLoggingIn}
            >
              <Text
                style={[
                  styles.forgotText,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* =================================================
                SIGN IN
            ================================================= */}

            <TouchableOpacity
              style={[
                styles.loginButton,
                {
                  height:
                    isSmallScreen
                      ? 50
                      : 54,

                  backgroundColor:
                    colors.primary,

                  borderColor:
                    colors.primary,

                  shadowColor:
                    colors.primary,

                  opacity:
                    isLoggingIn
                      ? 0.9
                      : 1,
                },
              ]}
              onPress={
                handleLogin
              }
              activeOpacity={0.85}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <View
                  style={
                    styles.loadingContainer
                  }
                >
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: spin,
                        },
                      ],
                    }}
                  >
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  </Animated.View>

                  <Text
                    style={
                      styles.loginButtonText
                    }
                  >
                    Logging in
                  </Text>

                  <Animated.Text
                    style={[
                      styles.dots,
                      {
                        opacity:
                          dotsOpacity,
                      },
                    ]}
                  >
                    ...
                  </Animated.Text>
                </View>
              ) : (
                <>
                  <Text
                    style={
                      styles.loginButtonText
                    }
                  >
                    Sign In
                  </Text>

                  <Text
                    style={styles.arrow}
                  >
                    →
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* =================================================
                GUEST LOGIN
            ================================================= */}

            <TouchableOpacity
              style={[
                styles.guestButton,
                {
                  height:
                    isSmallScreen
                      ? 48
                      : 52,

                  backgroundColor:
                    colors.cardSecondary,

                  borderColor:
                    colors.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={
                onGuestPress
              }
              disabled={
                isLoggingIn
              }
            >
              <Text
                style={[
                  styles.guestButtonText,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                Continue as Guest
              </Text>
            </TouchableOpacity>
          </View>

          {/* =================================================
              REGISTER
          ================================================= */}

          <View
            style={styles.footer}
          >
            <Text
              style={[
                styles.footerText,
                {
                  color:
                    colors.textMuted,
                },
              ]}
            >
              Don't have an account?
            </Text>

            <TouchableOpacity
              onPress={
                onSignUpPress
              }
              activeOpacity={0.7}
              disabled={isLoggingIn}
            >
              <Text
                style={[
                  styles.registerText,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                {' '}Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* =================================================
              BOTTOM BRANDING
          ================================================= */}

          <Text
            style={[
              styles.bottomText,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >
            Scan. Verify. Trust.
          </Text>
        </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 14,
  },

  // ==========================================================
  // BACKGROUND
  // ==========================================================

  topGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.1,
    top: -130,
    right: -110,
  },

  bottomGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.08,
    bottom: -170,
    left: -140,
  },

  // ==========================================================
  // LOGO
  // ==========================================================

  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    alignItems: 'center',
  },

  title: {
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },

  // ==========================================================
  // FORM
  // ==========================================================

  form: {
    width: '100%',
  },

  inputContainer: {
    width: '100%',
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

  passwordInput: {
    paddingRight: 55,
  },

  eyeButton: {
    position: 'absolute',
    right: 15,
  },

  eyeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ==========================================================
  // ERRORS
  // ==========================================================

  errorText: {
    color: '#FF4D4F',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 5,
    marginLeft: 4,
  },

  // ==========================================================
  // FORGOT PASSWORD
  // ==========================================================

  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: 3,
    marginBottom: 15,
    paddingVertical: 4,
  },

  forgotText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ==========================================================
  // SIGN IN
  // ==========================================================

  loginButton: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,

    position: 'relative',
  },

  loginButtonText: {
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

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dots: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 1,
    marginTop: -5,
  },

  // ==========================================================
  // GUEST
  // ==========================================================

  guestButton: {
    width: '100%',
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  guestButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ==========================================================
  // FOOTER
  // ==========================================================

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  footerText: {
    fontSize: 13,
  },

  registerText: {
    fontSize: 13,
    fontWeight: '800',
  },

  bottomText: {
    fontSize: 10.5,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginTop: 4,
  },
});
