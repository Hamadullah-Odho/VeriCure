import React, { useRef, useState } from 'react';

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
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
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
  onBackPress?: () => void;
  onRegisterSuccess?: () => void;
  onSignInPress?: () => void;

  // IMPORTANT:
  // Sends the registered email to App.tsx
  // so App.tsx can pass it to OtpScreen.
  onNavigateToOTP?: (email: string) => void;
}

export default function RegisterScreen({
  onBackPress,
  onRegisterSuccess,
  onSignInPress,
  onNavigateToOTP,
}: Props) {
  const { colors, isDark } = useTheme();

  // ============================================================
  // FORM STATES
  // ============================================================

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ============================================================
  // UI STATES
  // ============================================================

  const [isPasswordVisible, setIsPasswordVisible] =
    useState(false);

  const [isPasswordFocused, setIsPasswordFocused] =
    useState(false);

  const [emailTouched, setEmailTouched] =
    useState(false);

  const [confirmPasswordTouched, setConfirmPasswordTouched] =
    useState(false);

  const [isRegistering, setIsRegistering] =
    useState(false);

  const { height, width } = useWindowDimensions();

  const isSmallScreen = height < 700;
  const isTablet = width >= 600;

  // ============================================================
  // SCREEN ANIMATION
  // ============================================================

  const screenOpacity = useRef(
    new Animated.Value(1)
  ).current;

  const screenTranslateX = useRef(
    new Animated.Value(0)
  ).current;

  // ============================================================
  // PASSWORD VALIDATION
  // ============================================================

  const hasMinLength =
    password.length >= 8;

  const hasSpecialChar =
    /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isPasswordValid =
    hasMinLength && hasSpecialChar;

  // ============================================================
  // EMAIL VALIDATION
  // ============================================================

  const emailRegex =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  // ============================================================
  // BLOCKED TEST / FAKE DOMAINS
  // ============================================================

  const blockedDomains = [
    'example.com',
    'example.org',
    'example.net',
    'test.com',
    'fake.com',
    'localhost',
  ];

  // ============================================================
  // NORMALIZED EMAIL
  // ============================================================

  const trimmedEmail =
    email.trim().toLowerCase();

  const emailDomain =
    trimmedEmail.split('@')[1] || '';

  const isEmailValid =
    emailRegex.test(trimmedEmail) &&
    !blockedDomains.includes(emailDomain);

  // ============================================================
  // NAME VALIDATION
  // ============================================================

  const nameRegex =
    /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;

  const isNameValid =
    nameRegex.test(fullName.trim());

  // ============================================================
  // CONFIRM PASSWORD VALIDATION
  // ============================================================

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  // ============================================================
  // COMPLETE FORM VALIDATION
  // ============================================================

  const isFormValid =
    isNameValid &&
    isEmailValid &&
    isPasswordValid &&
    passwordsMatch;

  // ============================================================
  // MINIMUM LOADING TIME
  // ============================================================

  const minimumLoadingTime = (
    milliseconds: number
  ) => {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  };

  // ============================================================
  // ANIMATE REGISTER → OTP
  // ============================================================

  const animateToOTP = (
    normalizedEmail: string
  ) => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.timing(screenTranslateX, {
        toValue: -35,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {

      // IMPORTANT:
      // Send the email to App.tsx.
      if (onNavigateToOTP) {
        onNavigateToOTP(normalizedEmail);
      }

      // Backward compatibility
      else if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    });
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async () => {

    // ==========================================================
    // SHOW VALIDATION STATES
    // ==========================================================

    setEmailTouched(true);
    setConfirmPasswordTouched(true);

    // ==========================================================
    // PREVENT DOUBLE TAP
    // ==========================================================

    if (isRegistering) {
      return;
    }

    // ==========================================================
    // HIDE KEYBOARD
    // ==========================================================

    Keyboard.dismiss();

    // ==========================================================
    // FULL NAME
    // ==========================================================

    if (!fullName.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter your full name.'
      );
      return;
    }

    if (!isNameValid) {
      Alert.alert(
        'Invalid Name',
        'Please enter a valid name using letters, spaces, apostrophes, or hyphens.'
      );
      return;
    }

    // ==========================================================
    // EMAIL EMPTY
    // ==========================================================

    if (!email.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter your email address.'
      );
      return;
    }

    // ==========================================================
    // EMAIL FORMAT
    // ==========================================================

    if (!isEmailValid) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return;
    }

    // ==========================================================
    // PASSWORD EMPTY
    // ==========================================================

    if (!password) {
      Alert.alert(
        'Missing Information',
        'Please enter a password.'
      );
      return;
    }

    // ==========================================================
    // PASSWORD VALIDATION
    // ==========================================================

    if (!isPasswordValid) {
      Alert.alert(
        'Invalid Password',
        'Password must be at least 8 characters and include a special character.'
      );
      return;
    }

    // ==========================================================
    // CONFIRM PASSWORD
    // ==========================================================

    if (!confirmPassword) {
      Alert.alert(
        'Missing Information',
        'Please confirm your password.'
      );
      return;
    }

    // ==========================================================
    // PASSWORD MATCH
    // ==========================================================

    if (!passwordsMatch) {
      Alert.alert(
        'Password Mismatch',
        'Password and confirm password do not match.'
      );
      return;
    }

    // ==========================================================
    // FINAL VALIDATION
    // ==========================================================

    if (!isFormValid) {
      return;
    }

    // ==========================================================
    // START REGISTRATION
    // ==========================================================

    setIsRegistering(true);

    const loadingStartedAt = Date.now();

    try {

      console.log(
        'Sending registration request...'
      );

   
      // ========================================================
      // SEND REGISTRATION REQUEST
      // ========================================================

      const response = await fetch(
        API_BASE_URL + '/api/auth/register',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            name: fullName.trim(),
            email: trimmedEmail,
            password: password,
          }),
        }
      );

      console.log(
        'Registration response status:',
        response.status
      );

      // ========================================================
      // READ BACKEND RESPONSE
      // ========================================================

      const data = await response.json();

      console.log(
        'Registration response data:',
        data
      );

      // ========================================================
      // BACKEND ERROR
      // ========================================================

      if (!response.ok) {

        console.log(
          'Registration failed:',
          data
        );

        Alert.alert(
          'Registration Failed',

          typeof data === 'string'
            ? data
            : data.message ||
              'Unable to create your account.'
        );

        return;
      }

      // ========================================================
      // ENSURE USER SEES LOADING FOR AT LEAST 2 SECONDS
      // ========================================================

      const elapsedTime =
        Date.now() - loadingStartedAt;

      const remainingTime =
        Math.max(
          0,
          2000 - elapsedTime
        );

      if (remainingTime > 0) {
        await minimumLoadingTime(
          remainingTime
        );
      }

      // ========================================================
      // REGISTRATION SUCCESS
      // ========================================================

      console.log(
        'Registration successful:',
        data
      );

      console.log(
        'Moving to OTP with email:',
        trimmedEmail
      );

      // ========================================================
      // MOVE TO OTP
      //
      // THIS IS THE IMPORTANT FIX.
      // The email is passed to App.tsx.
      // ========================================================

      animateToOTP(
        trimmedEmail
      );

    } catch (error) {

      // ========================================================
      // NETWORK ERROR
      // ========================================================

      console.log(
        'Network error:',
        error
      );

      Alert.alert(
        'Connection Error',
        'Unable to connect to the VeriCure server. Please make sure the backend is running and your phone is connected to the same network as your computer.'
      );

    } finally {

      setIsRegistering(false);

    }
  };

  // ============================================================
  // EMAIL CHANGE
  // ============================================================

  const handleEmailChange = (
    text: string
  ) => {

    setEmail(text);

    const newEmail =
      text.trim().toLowerCase();

    const newDomain =
      newEmail.split('@')[1] || '';

    const valid =
      emailRegex.test(newEmail) &&
      !blockedDomains.includes(
        newDomain
      );

    // Once valid, remove error state
    if (valid) {
      setEmailTouched(false);
    }
  };

  // ============================================================
  // CONFIRM PASSWORD CHANGE
  // ============================================================

  const handleConfirmPasswordChange = (
    text: string
  ) => {

    setConfirmPassword(text);

    if (text.length > 0) {
      setConfirmPasswordTouched(true);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <Animated.View
      style={[
        styles.screenAnimated,
        {
          opacity: screenOpacity,

          transform: [
            {
              translateX:
                screenTranslateX,
            },
          ],
        },
      ]}
    >
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
                colors.primaryDark,
            },
          ]}
        />

        {/* =====================================================
            HEADER
            ===================================================== */}

        <View
          style={[
            styles.header,
            {
              backgroundColor:
                colors.background,
            },
          ]}
        >

          <TouchableOpacity
            onPress={onBackPress}
            disabled={isRegistering}

            style={[
              styles.backButton,
              {
                backgroundColor:
                  colors.cardSecondary,

                borderColor:
                  colors.border,

                opacity:
                  isRegistering
                    ? 0.5
                    : 1,
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
                    colors.text,
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
                  colors.text,
              },
            ]}
          >
            Create Account
          </Text>

          <View
            style={
              styles.headerSpacer
            }
          />

        </View>

        {/* =====================================================
            KEYBOARD VIEW
            ===================================================== */}

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
              styles.content,
              {
                maxWidth:
                  isTablet
                    ? 520
                    : 600,

                paddingHorizontal:
                  isTablet
                    ? 32
                    : 24,
              },
            ]}

            showsVerticalScrollIndicator={
              false
            }

            keyboardShouldPersistTaps="handled"
          >

          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
          <View>

            {/* =================================================
                INTRO
                ================================================= */}

            <View
              style={[
                styles.introSection,
                {
                  marginTop:
                    isSmallScreen
                      ? 4
                      : 12,

                  marginBottom:
                    isSmallScreen
                      ? 20
                      : 26,
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
                Create your account
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
                Sign up to verify medicines and
                access your VeriCure account.
              </Text>

            </View>

            {/* =================================================
                FORM
                ================================================= */}

            <View
              style={styles.form}
            >

              {/* =================================================
                  FULL NAME
                  ================================================= */}

              <View
                style={[
                  styles.inputContainer,
                  {
                    marginBottom:
                      isSmallScreen
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
                  Full Name
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor:
                        colors.inputBackground,

                      borderColor:
                        colors.border,
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
                    V
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        color:
                          colors.text,
                      },
                    ]}

                    placeholder="Enter your full name"

                    placeholderTextColor={
                      colors.textMuted
                    }

                    value={fullName}

                    onChangeText={
                      setFullName
                    }

                    autoCapitalize="words"

                    autoCorrect={false}

                    editable={
                      !isRegistering
                    }
                  />

                </View>

              </View>

              {/* =================================================
                  EMAIL
                  ================================================= */}

              <View
                style={[
                  styles.inputContainer,
                  {
                    marginBottom:
                      isSmallScreen
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
                        colors.inputBackground,

                      borderColor:
                        emailTouched &&
                        !isEmailValid
                          ? '#FF3B30'
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
                          colors.text,
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

                    onChangeText={
                      handleEmailChange
                    }

                    onBlur={() => {
                      setEmailTouched(
                        true
                      );
                    }}

                    editable={
                      !isRegistering
                    }
                  />

                </View>

                {/* EMAIL ERROR */}

                {emailTouched &&
                  !isEmailValid && (
                    <Text
                      style={
                        styles.emailError
                      }
                    >
                      Please enter a valid email
                      address.
                    </Text>
                  )}

                {/* EMAIL SUCCESS */}

                {emailTouched &&
                  isEmailValid &&
                  email.trim().length > 0 && (
                    <Text
                      style={
                        styles.emailSuccess
                      }
                    >
                      ✓ Email format looks good
                    </Text>
                  )}

              </View>

              {/* =================================================
                  PASSWORD
                  ================================================= */}

              <View
                style={[
                  styles.inputContainer,
                  {
                    marginBottom:
                      isSmallScreen
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
                  Password
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor:
                        colors.inputBackground,

                      borderColor:
                        colors.border,
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

                    placeholder="Create a password"

                    placeholderTextColor={
                      colors.textMuted
                    }

                    secureTextEntry={
                      !isPasswordVisible
                    }

                    value={password}

                    onChangeText={
                      setPassword
                    }

                    onFocus={() =>
                      setIsPasswordFocused(
                        true
                      )
                    }

                    onBlur={() =>
                      setIsPasswordFocused(
                        false
                      )
                    }

                    autoCapitalize="none"

                    autoCorrect={false}

                    editable={
                      !isRegistering
                    }
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setIsPasswordVisible(
                        !isPasswordVisible
                      )
                    }

                    style={
                      styles.showButton
                    }

                    hitSlop={{
                      top: 10,
                      bottom: 10,
                      left: 10,
                      right: 10,
                    }}

                    activeOpacity={0.7}

                    disabled={
                      isRegistering
                    }
                  >

                    <Text
                      style={[
                        styles.showText,
                        {
                          color:
                            colors.primaryLight,
                        },
                      ]}
                    >
                      {isPasswordVisible
                        ? 'Hide'
                        : 'Show'}
                    </Text>

                  </TouchableOpacity>

                </View>

                {/* PASSWORD REQUIREMENTS */}

                {isPasswordFocused && (
                  <View
                    style={
                      styles.passwordRequirements
                    }
                  >

                    <Text
                      style={[
                        styles.requirement,
                        {
                          color:
                            hasMinLength
                              ? colors.primaryLight
                              : colors.warning,
                        },
                      ]}
                    >
                      {hasMinLength
                        ? '✓'
                        : '○'}{' '}
                      At least 8 characters
                    </Text>

                    <Text
                      style={[
                        styles.requirement,
                        {
                          color:
                            hasSpecialChar
                              ? colors.primaryLight
                              : colors.warning,
                        },
                      ]}
                    >
                      {hasSpecialChar
                        ? '✓'
                        : '○'}{' '}
                      At least one special character
                    </Text>

                  </View>
                )}

              </View>

              {/* =================================================
                  CONFIRM PASSWORD
                  ================================================= */}

              <View
                style={[
                  styles.inputContainer,
                  {
                    marginBottom:
                      isSmallScreen
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
                  Confirm Password
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor:
                        colors.inputBackground,

                      borderColor:
                        confirmPasswordTouched &&
                        confirmPassword.length > 0 &&
                        !passwordsMatch
                          ? '#FF3B30'
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
                    ●
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        color:
                          colors.text,
                      },
                    ]}

                    placeholder="Re-enter your password"

                    placeholderTextColor={
                      colors.textMuted
                    }

                    secureTextEntry={
                      !isPasswordVisible
                    }

                    value={
                      confirmPassword
                    }

                    onChangeText={
                      handleConfirmPasswordChange
                    }

                    onBlur={() =>
                      setConfirmPasswordTouched(
                        true
                      )
                    }

                    autoCapitalize="none"

                    autoCorrect={false}

                    editable={
                      !isRegistering
                    }
                  />

                </View>

                {/* CONFIRM PASSWORD FEEDBACK */}

                {confirmPasswordTouched &&
                  confirmPassword.length > 0 && (
                    <Text
                      style={[
                        styles.confirmPasswordMessage,
                        {
                          color:
                            passwordsMatch
                              ? colors.primaryLight
                              : '#FF3B30',
                        },
                      ]}
                    >
                      {passwordsMatch
                        ? '✓ Passwords match'
                        : '✗ Passwords do not match'}
                    </Text>
                  )}

              </View>

              {/* =================================================
                  CREATE ACCOUNT BUTTON
                  ================================================= */}

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  {
                    height:
                      isSmallScreen
                        ? 50
                        : 54,

                    backgroundColor:
                      colors.primaryDark,

                    borderColor:
                      colors.primary,

                    shadowColor:
                      colors.primary,

                    opacity:
                      isRegistering
                        ? 0.75
                        : 1,
                  },
                ]}

                onPress={
                  handleRegister
                }

                activeOpacity={0.85}

                disabled={
                  isRegistering
                }
              >

                {isRegistering ? (

                  <View
                    style={
                      styles.loadingContent
                    }
                  >

                    <ActivityIndicator
                      size="small"
                      color={
                        colors.white
                      }
                    />

                    <Text
                      style={[
                        styles.registerButtonText,
                        {
                          color:
                            colors.white,
                        },
                      ]}
                    >
                      Creating Account...
                    </Text>

                  </View>

                ) : (

                  <>
                    <Text
                      style={[
                        styles.registerButtonText,
                        {
                          color:
                            colors.white,
                        },
                      ]}
                    >
                      Create Account
                    </Text>

                    <Text
                      style={[
                        styles.arrow,
                        {
                          color:
                            colors.white,
                        },
                      ]}
                    >
                      →
                    </Text>
                  </>

                )}

              </TouchableOpacity>

              {/* =================================================
                  SIGN IN
                  ================================================= */}

              <View
                style={
                  styles.footer
                }
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
                  Already have an account?
                </Text>

                <TouchableOpacity
                  onPress={
                    onSignInPress
                  }

                  activeOpacity={0.7}

                  disabled={
                    isRegistering
                  }
                >

                  <Text
                    style={[
                      styles.signInText,
                      {
                        color:
                          colors.primaryLight,

                        opacity:
                          isRegistering
                            ? 0.5
                            : 1,
                      },
                    ]}
                  >
                    {' '}Sign In
                  </Text>

                </TouchableOpacity>

              </View>

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

          </ScrollView>

        </KeyboardAvoidingView>

      </SafeAreaView>
    </Animated.View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  screenAnimated: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  // ==========================================================
  // BACKGROUND GLOW
  // ==========================================================

  topGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.10,
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
  // HEADER
  // ==========================================================

  header: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    fontSize: 18,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 38,
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  content: {
    width: '100%',
    alignSelf: 'center',
    paddingTop: 8,
    paddingBottom: 30,
  },

  // ==========================================================
  // INTRO
  // ==========================================================

  introSection: {
    alignItems: 'center',
  },

  title: {
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: 7,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 15,
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
    fontSize: 14,
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

  // ==========================================================
  // PASSWORD
  // ==========================================================

  passwordInput: {
    paddingRight: 60,
  },

  showButton: {
    position: 'absolute',
    right: 15,
  },

  showText: {
    fontSize: 12,
    fontWeight: '700',
  },

  passwordRequirements: {
    marginTop: 7,
    paddingHorizontal: 3,
  },

  requirement: {
    fontSize: 12,
    lineHeight: 18,
  },

  // ==========================================================
  // EMAIL ERROR / SUCCESS
  // ==========================================================

  emailError: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 3,
  },

  emailSuccess: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 3,
  },

  // ==========================================================
  // CONFIRM PASSWORD FEEDBACK
  // ==========================================================

  confirmPasswordMessage: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 3,
  },

  // ==========================================================
  // REGISTER BUTTON
  // ==========================================================

  registerButton: {
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

    marginTop: 4,
    marginBottom: 20,
  },

  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  registerButtonText: {
    fontSize: 15.5,
    fontWeight: '800',
  },

  arrow: {
    position: 'absolute',
    right: 18,
    fontSize: 21,
  },

  // ==========================================================
  // FOOTER
  // ==========================================================

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  footerText: {
    fontSize: 13,
  },

  signInText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // ==========================================================
  // BOTTOM BRANDING
  // ==========================================================

  bottomText: {
    fontSize: 10.5,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginTop: 24,
  },

});