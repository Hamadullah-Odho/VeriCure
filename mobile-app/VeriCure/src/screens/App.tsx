import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  StyleSheet,
  StatusBar,
  View,
  AppState,
  Alert,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from './src/config/api';

import {
  ThemeProvider,
  useTheme,
} from './src/theme/ThemeContext';

/* ============================================================
   AUTH SCREENS
   ============================================================ */

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OtpScreen from './src/screens/OtpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

/* ============================================================
   MAIN SCREENS
   ============================================================ */

import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import VerificationResultScreen from './src/screens/VerificationResultScreen';
import SeeAllMedicinesScreen from './src/screens/SeeAllMedicinesScreen';
import MedicineDetailScreen from './src/screens/MedicineDetailScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RequestCallScreen from './src/screens/RequestCallScreen';
import ChatScreen from './src/screens/ChatScreen';
import HomeCabinetScreen from './src/screens/HomeCabinetScreen';

/* ============================================================
   PROFILE SUB-SCREENS
   ============================================================ */

import SavedScansScreen from './src/screens/SavedScansScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SecurityPrivacyScreen from './src/screens/SecurityPrivacyScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';

/* ============================================================
   SCREEN TYPES
   ============================================================ */

type ScreenName =
  | 'splash'
  | 'login'
  | 'register'
  | 'otp'
  | 'forgotPassword'
  | 'resetPassword'
  | 'home'
  | 'scan'
  | 'verificationResult'
  | 'seeAll'
  | 'medicineDetail'
  | 'insights'
  | 'profile'
  | 'savedScans'
  | 'notifications'
  | 'security'
  | 'changePassword'
  | 'helpSupport'
  | 'requestCall'
  | 'chat'
  | 'homeCabinet';

/* ============================================================
   OTP PURPOSE
   ============================================================ */

type OtpPurpose =
  | 'registration'
  | 'login'
  | 'forgotPassword'
  | 'emailChange';

/* ============================================================
   ROOT APP
   ============================================================ */

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

/* ============================================================
   APP CONTENT
   ============================================================ */

function AppContent() {
  const {
    colors,
    isDark,
  } = useTheme();

  /* ==========================================================
     SCREEN STACK
     ========================================================== */

  const [screenStack, setScreenStack] =
    useState<ScreenName[]>(['splash']);

  const currentScreen =
    screenStack[screenStack.length - 1];

  /* ==========================================================
     MEDICINE DATA
     ========================================================== */

  const [selectedMedicine, setSelectedMedicine] =
    useState<any>(null);

  /* ==========================================================
     OTP EMAIL
     ========================================================== */

  const [otpEmail, setOtpEmail] =
    useState<string>('');

  const otpEmailRef =
    useRef<string>('');

  /* ==========================================================
     LOGGED-IN USER SESSION
     ==========================================================
     No JWT / tokens — we just remember which email is
     currently logged in, persisted via AsyncStorage so the
     user doesn't have to log in again every time the app
     is reopened.
     ========================================================== */

  const SESSION_STORAGE_KEY =
    'vericure_logged_in_email';

  const [loggedInEmail, setLoggedInEmail] =
    useState<string>('');

  const loggedInEmailRef =
    useRef<string>('');

  const persistLogin = async (
    email: string
  ) => {

    const normalizedEmail =
      email.trim().toLowerCase();

    loggedInEmailRef.current =
      normalizedEmail;

    setLoggedInEmail(
      normalizedEmail
    );

    try {
      await AsyncStorage.setItem(
        SESSION_STORAGE_KEY,
        normalizedEmail
      );
    } catch (error) {
      console.log(
        'Unable to persist login session:',
        error
      );
    }
  };

  const clearLoginSession = async () => {

    loggedInEmailRef.current =
      '';

    setLoggedInEmail('');

    try {
      await AsyncStorage.removeItem(
        SESSION_STORAGE_KEY
      );
    } catch (error) {
      console.log(
        'Unable to clear login session:',
        error
      );
    }
  };

  /* ==========================================================
     VERIFIED OTP
     ========================================================== */

  /*
   * IMPORTANT
   *
   * We keep the verified OTP in BOTH:
   *
   * 1. State
   * 2. Ref
   *
   * State is used for rendering.
   * Ref guarantees that the OTP is immediately available
   * even before React finishes updating state.
   */

  const [verifiedOtp, setVerifiedOtp] =
    useState<string>('');

  const verifiedOtpRef =
    useRef<string>('');

  /* ==========================================================
     OTP PURPOSE
     ========================================================== */

  const [otpPurpose, setOtpPurpose] =
    useState<OtpPurpose>('registration');

  /* ==========================================================
     ACCOUNT CREATED ANIMATION
     ========================================================== */

  const [showAccountCreated, setShowAccountCreated] =
    useState(false);

  const successOpacity =
    useRef(
      new Animated.Value(0)
    ).current;

  const successScale =
    useRef(
      new Animated.Value(0.85)
    ).current;

  /* ==========================================================
     SCREEN TRANSITION ANIMATION
     ========================================================== */

  const screenOpacity =
    useRef(
      new Animated.Value(1)
    ).current;

  const screenTranslateX =
    useRef(
      new Animated.Value(0)
    ).current;

  /* ==========================================================
     BIOMETRIC / APP LOCK
     ========================================================== */

  const [isBiometricEnabled, setIsBiometricEnabled] =
    useState(false);

  const [isAppLocked, setIsAppLocked] =
    useState(false);

  const appState =
    useRef(
      AppState.currentState
    );

  /* ==========================================================
     SCREEN TRANSITION
     ========================================================== */

  const animateToScreen = (
    screen: ScreenName
  ) => {
    Keyboard.dismiss();

    screenTranslateX.setValue(45);
    screenOpacity.setValue(0);

    setScreenStack(
      previousStack => [
        ...previousStack,
        screen,
      ]
    );

    Animated.parallel([
      Animated.timing(
        screenOpacity,
        {
          toValue: 1,
          duration: 400,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        screenTranslateX,
        {
          toValue: 0,
          duration: 400,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),
    ]).start();
  };

  /* ==========================================================
     NAVIGATION
     ========================================================== */

  const navigateTo = (
    screen: ScreenName
  ) => {
    animateToScreen(screen);
  };

  /* ==========================================================
     BACK NAVIGATION
     ========================================================== */

  const goBack = () => {
    Keyboard.dismiss();

    if (
      screenStack.length <= 1
    ) {
      return;
    }

    Animated.parallel([
      Animated.timing(
        screenOpacity,
        {
          toValue: 0,
          duration: 220,
          easing:
            Easing.in(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        screenTranslateX,
        {
          toValue: 45,
          duration: 220,
          easing:
            Easing.in(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),
    ]).start(() => {

      setScreenStack(
        previousStack => {

          if (
            previousStack.length <= 1
          ) {
            return previousStack;
          }

          return previousStack.slice(
            0,
            previousStack.length - 1
          );
        }
      );

      screenTranslateX.setValue(-45);
      screenOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(
          screenOpacity,
          {
            toValue: 1,
            duration: 350,
            easing:
              Easing.out(
                Easing.cubic
              ),
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          screenTranslateX,
          {
            toValue: 0,
            duration: 350,
            easing:
              Easing.out(
                Easing.cubic
              ),
            useNativeDriver: true,
          }
        ),
      ]).start();
    });
  };

  /* ==========================================================
     HOME NAVIGATION
     ========================================================== */

  const goToHome = () => {
    Keyboard.dismiss();

    screenOpacity.setValue(0);
    screenTranslateX.setValue(-25);

    setScreenStack([
      'home',
    ]);

    Animated.parallel([
      Animated.timing(
        screenOpacity,
        {
          toValue: 1,
          duration: 350,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        screenTranslateX,
        {
          toValue: 0,
          duration: 350,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),
    ]).start();
  };

  /* ==========================================================
     INSIGHTS NAVIGATION
     ========================================================== */

  const goToInsights = () => {
    Keyboard.dismiss();

    screenOpacity.setValue(0);
    screenTranslateX.setValue(25);

    setScreenStack([
      'insights',
    ]);

    Animated.parallel([
      Animated.timing(
        screenOpacity,
        {
          toValue: 1,
          duration: 350,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        screenTranslateX,
        {
          toValue: 0,
          duration: 350,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),
    ]).start();
  };

  /* ==========================================================
     PROFILE NAVIGATION
     ========================================================== */

  const goToProfile = () => {
    Keyboard.dismiss();

    screenOpacity.setValue(0);
    screenTranslateX.setValue(25);

    setScreenStack([
      'profile',
    ]);

    Animated.parallel([
      Animated.timing(
        screenOpacity,
        {
          toValue: 1,
          duration: 350,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        screenTranslateX,
        {
          toValue: 0,
          duration: 350,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),
    ]).start();
  };

  /* ==========================================================
     BIOMETRIC / APP LOCK
     ========================================================== */

  useEffect(() => {

    const subscription =
      AppState.addEventListener(
        'change',
        async nextAppState => {

          if (
            appState.current.match(
              /inactive|background/
            ) &&
            nextAppState === 'active' &&
            isBiometricEnabled
          ) {

            setIsAppLocked(true);

            await triggerPasscodeAuth();
          }

          appState.current =
            nextAppState;
        }
      );

    return () => {
      subscription.remove();
    };

  }, [
    isBiometricEnabled,
  ]);

  /* ==========================================================
     PHONE PASSCODE AUTHENTICATION
     ========================================================== */

  const triggerPasscodeAuth =
    async () => {

      try {

        const result =
          await LocalAuthentication.authenticateAsync({

            promptMessage:
              'Enter Phone Passcode to unlock VeriCure',

            fallbackLabel:
              'Use Passcode',

            cancelLabel:
              'Cancel',

            disableDeviceFallback:
              false,
          });

        if (
          result.success
        ) {

          setIsAppLocked(false);

        } else {

          Alert.alert(
            'Authentication Failed',
            'Please enter your passcode to unlock.'
          );
        }

      } catch (error) {

        console.log(
          'Authentication error:',
          error
        );
      }
    };

  /* ==========================================================
     OPEN OTP
     ========================================================== */

  const openOtpScreen = (
    email: string,
    purpose: OtpPurpose
  ) => {

    if (
      typeof email !== 'string' ||
      email.trim().length === 0
    ) {

      console.log(
        'ERROR: OTP email is missing:',
        email
      );

      Alert.alert(
        'OTP Error',
        'Your email address could not be received. Please try again.'
      );

      return;
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    console.log(
      'Opening OTP screen for:',
      normalizedEmail,
      'Purpose:',
      purpose
    );

    /* Store email */

    otpEmailRef.current =
      normalizedEmail;

    setOtpEmail(
      normalizedEmail
    );

    /* Store purpose */

    setOtpPurpose(
      purpose
    );

    /*
     * Clear previous verified OTP.
     */

    verifiedOtpRef.current =
      '';

    setVerifiedOtp('');

    /* Open OTP */

    animateToScreen(
      'otp'
    );
  };

  /* ==========================================================
     REGISTRATION → OTP
     ========================================================== */

  const handleNavigateToOTP = (
    email: string
  ) => {

    openOtpScreen(
      email,
      'registration'
    );
  };

  /* ==========================================================
     LOGIN → OTP
     ========================================================== */

  const handleLoginOtpRequired = (
    email: string
  ) => {

    console.log(
      'Login requires OTP verification:',
      email
    );

    openOtpScreen(
      email,
      'login'
    );
  };

  /* ==========================================================
     FORGOT PASSWORD → OTP
     ========================================================== */

  const handleForgotPasswordOtpRequired = (
    email: string
  ) => {

    console.log(
      'Forgot password OTP requested:',
      email
    );

    openOtpScreen(
      email,
      'forgotPassword'
    );
  };

  /* ==========================================================
     ACCOUNT CREATED
     ========================================================== */

  const showAccountCreatedAnimation =
    () => {

      setShowAccountCreated(
        true
      );

      successOpacity.setValue(0);
      successScale.setValue(0.85);

      Animated.parallel([

        Animated.timing(
          successOpacity,
          {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }
        ),

        Animated.spring(
          successScale,
          {
            toValue: 1,
            friction: 7,
            tension: 80,
            useNativeDriver: true,
          }
        ),

      ]).start();

      setTimeout(() => {

        Animated.parallel([

          Animated.timing(
            successOpacity,
            {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            successScale,
            {
              toValue: 0.9,
              duration: 250,
              useNativeDriver: true,
            }
          ),

        ]).start(() => {

          setShowAccountCreated(
            false
          );

          otpEmailRef.current =
            '';

          setOtpEmail(
            ''
          );

          setOtpPurpose(
            'registration'
          );

          verifiedOtpRef.current =
            '';

          setVerifiedOtp(
            ''
          );

          screenOpacity.setValue(0);
          screenTranslateX.setValue(-35);

          setScreenStack([
            'login',
          ]);

          Animated.parallel([

            Animated.timing(
              screenOpacity,
              {
                toValue: 1,
                duration: 450,
                easing:
                  Easing.out(
                    Easing.cubic
                  ),
                useNativeDriver: true,
              }
            ),

            Animated.timing(
              screenTranslateX,
              {
                toValue: 0,
                duration: 450,
                easing:
                  Easing.out(
                    Easing.cubic
                  ),
                useNativeDriver: true,
              }
            ),

          ]).start();

        });

      }, 1800);
    };

  /* ==========================================================
     OTP SUCCESS
     ========================================================== */

  const handleOtpSuccess = (
    verifiedOtpValue: string
  ) => {

    Keyboard.dismiss();

    /*
     * Normalize OTP.
     */

    const normalizedOtp =
      typeof verifiedOtpValue === 'string'
        ? verifiedOtpValue.trim()
        : '';

    console.log(
      'OTP success. Purpose:',
      otpPurpose
    );

    console.log(
      'Verified OTP:',
      normalizedOtp
    );

    /*
     * Safety check.
     */

    if (
      normalizedOtp.length === 0
    ) {

      Alert.alert(
        'OTP Error',
        'The verified OTP is missing. Please enter the OTP again.'
      );

      return;
    }

    /*
     * CRITICAL FIX
     *
     * Save OTP to REF first.
     *
     * This happens immediately and does not wait
     * for React state to update.
     */

    verifiedOtpRef.current =
      normalizedOtp;

    /*
     * Also save it to state for rendering.
     */

    setVerifiedOtp(
      normalizedOtp
    );

    /* ========================================================
       REGISTRATION OTP
       ======================================================== */

    if (
      otpPurpose ===
      'registration'
    ) {

      showAccountCreatedAnimation();

      return;
    }

    /* ========================================================
       LOGIN OTP
       ======================================================== */

    if (
      otpPurpose ===
      'login'
    ) {

      console.log(
        'Login OTP verified. Opening Home.'
      );

      persistLogin(
        otpEmailRef.current
      );

      otpEmailRef.current =
        '';

      setOtpEmail('');

      setOtpPurpose(
        'registration'
      );

      verifiedOtpRef.current =
        '';

      setVerifiedOtp('');

      screenOpacity.setValue(0);
      screenTranslateX.setValue(45);

      setScreenStack([
        'home',
      ]);

      Animated.parallel([

        Animated.timing(
          screenOpacity,
          {
            toValue: 1,
            duration: 500,
            easing:
              Easing.out(
                Easing.cubic
              ),
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          screenTranslateX,
          {
            toValue: 0,
            duration: 500,
            easing:
              Easing.out(
                Easing.cubic
              ),
            useNativeDriver: true,
          }
        ),

      ]).start();

      return;
    }

    /* ========================================================
       FORGOT PASSWORD OTP
       ======================================================== */

    if (
      otpPurpose ===
      'forgotPassword'
    ) {

      console.log(
        'Forgot password OTP verified.'
      );

      console.log(
        'Email:',
        otpEmailRef.current
      );

      console.log(
        'OTP:',
        verifiedOtpRef.current
      );

      /*
       * Make sure email exists.
       */

      if (
        !otpEmailRef.current
      ) {

        Alert.alert(
          'Error',
          'Email address is missing. Please restart the forgot password process.'
        );

        return;
      }

      /*
       * Make absolutely sure OTP exists.
       */

      if (
        !verifiedOtpRef.current
      ) {

        Alert.alert(
          'Error',
          'OTP is missing. Please verify the OTP again.'
        );

        return;
      }

      /*
       * IMPORTANT
       *
       * We use the REF when ResetPasswordScreen
       * is rendered.
       *
       * This avoids the asynchronous setState problem.
       */

      screenTranslateX.setValue(45);
      screenOpacity.setValue(0);

      setScreenStack(
        previousStack => [
          ...previousStack,
          'resetPassword',
        ]
      );

      Animated.parallel([

        Animated.timing(
          screenOpacity,
          {
            toValue: 1,
            duration: 400,
            easing:
              Easing.out(
                Easing.cubic
              ),
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          screenTranslateX,
          {
            toValue: 0,
            duration: 400,
            easing:
              Easing.out(
                Easing.cubic
              ),
            useNativeDriver: true,
          }
        ),

      ]).start();

      return;
    }

    /* ========================================================
       EMAIL CHANGE OTP
       ======================================================== */

    if (
      otpPurpose ===
      'emailChange'
    ) {

      const currentEmail =
        loggedInEmailRef.current;

      const newEmail =
        otpEmailRef.current;

      console.log(
        'Email change OTP verified.'
      );

      console.log(
        'Current email:',
        currentEmail
      );

      console.log(
        'New email:',
        newEmail
      );

      if (
        !currentEmail ||
        !newEmail
      ) {

        Alert.alert(
          'Error',
          'Something went wrong. Please try changing your email again.'
        );

        return;
      }

      (async () => {

        try {

          const response =
            await fetch(
              API_BASE_URL +
                '/api/auth/confirm-email-change',
              {
                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                body: JSON.stringify({
                  currentEmail:
                    currentEmail,

                  newEmail:
                    newEmail,

                  otp:
                    normalizedOtp,
                }),
              }
            );

          const responseText =
            await response.text();

          let data: any = null;

          try {
            data =
              responseText
                ? JSON.parse(responseText)
                : null;
          } catch {
            data = responseText;
          }

          console.log(
            'Confirm email change response:',
            data
          );

          if (!response.ok) {

            const message =
              data &&
              typeof data.message === 'string'
                ? data.message
                : 'Unable to update email. Please try again.';

            Alert.alert(
              'Email Change Failed',
              message
            );

            return;
          }

          /*
           * SUCCESS
           *
           * Update the persisted session to the
           * new email, then go back to Profile.
           */

          await persistLogin(
            newEmail
          );

          otpEmailRef.current =
            '';

          setOtpEmail('');

          setOtpPurpose(
            'registration'
          );

          verifiedOtpRef.current =
            '';

          setVerifiedOtp('');

          Alert.alert(
            'Success',
            'Your email has been updated successfully.'
          );

          setScreenStack(
            previousStack =>
              previousStack.slice(
                0,
                -1
              )
          );

        } catch (error) {

          console.log(
            'Confirm email change error:',
            error
          );

          Alert.alert(
            'Error',
            'Unable to connect to the server. Please check your connection and try again.'
          );
        }
      })();

      return;
    }
  };

  /* ==========================================================
     RESET PASSWORD SUCCESS
     ========================================================== */

  const handleResetPasswordSuccess = () => {

    Keyboard.dismiss();

    console.log(
      'Password reset successfully.'
    );

    /*
     * Clear sensitive reset data.
     */

    verifiedOtpRef.current =
      '';

    setVerifiedOtp('');

    otpEmailRef.current =
      '';

    setOtpEmail('');

    setOtpPurpose(
      'registration'
    );

    /*
     * Go back to login.
     */

    screenOpacity.setValue(0);
    screenTranslateX.setValue(-35);

    setScreenStack([
      'login',
    ]);

    Animated.parallel([

      Animated.timing(
        screenOpacity,
        {
          toValue: 1,
          duration: 450,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        screenTranslateX,
        {
          toValue: 0,
          duration: 450,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

    ]).start();
  };

  /* ==========================================================
     LOGIN SUCCESS
     ========================================================== */

  const handleLoginSuccess = (
    email: string
  ) => {

    Keyboard.dismiss();

    persistLogin(email);

    screenOpacity.setValue(0);
    screenTranslateX.setValue(45);

    setScreenStack([
      'home',
    ]);

    Animated.parallel([

      Animated.timing(
        screenOpacity,
        {
          toValue: 1,
          duration: 500,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        screenTranslateX,
        {
          toValue: 0,
          duration: 500,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

    ]).start();
  };

  /* ==========================================================
     LOGOUT
     ========================================================== */

  const handleLogout = () => {

    Keyboard.dismiss();

    clearLoginSession();

    screenOpacity.setValue(0);
    screenTranslateX.setValue(-35);

    setScreenStack([
      'login',
    ]);

    Animated.parallel([

      Animated.timing(
        screenOpacity,
        {
          toValue: 1,
          duration: 400,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        screenTranslateX,
        {
          toValue: 0,
          duration: 400,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: true,
        }
      ),

    ]).start();
  };

  /* ==========================================================
     SCREEN RENDERING
     ========================================================== */

  const renderScreen = () => {

    switch (currentScreen) {

      /* ======================================================
         SPLASH
         ====================================================== */

      case 'splash':

        return (
          <SplashScreen
            onFinish={async () => {

              /*
               * Check if a session is already saved.
               *
               * If so, skip login and go straight to Home.
               */

              let savedEmail: string | null = null;

              try {
                savedEmail =
                  await AsyncStorage.getItem(
                    SESSION_STORAGE_KEY
                  );
              } catch (error) {
                console.log(
                  'Unable to read saved session:',
                  error
                );
              }

              screenOpacity.setValue(1);
              screenTranslateX.setValue(0);

              if (
                savedEmail &&
                savedEmail.trim().length > 0
              ) {

                console.log(
                  'Restoring session for:',
                  savedEmail
                );

                loggedInEmailRef.current =
                  savedEmail;

                setLoggedInEmail(
                  savedEmail
                );

                setScreenStack([
                  'home',
                ]);

                return;
              }

              setScreenStack([
                'login',
              ]);
            }}
          />
        );

      /* ======================================================
         LOGIN
         ====================================================== */

      case 'login':

        return (
          <LoginScreen

            onLoginSuccess={
              handleLoginSuccess
            }

            onOtpRequired={
              handleLoginOtpRequired
            }

            onSignUpPress={() => {

              navigateTo(
                'register'
              );
            }}

            onForgotPasswordPress={() => {

              navigateTo(
                'forgotPassword'
              );
            }}
          />
        );

      /* ======================================================
         REGISTER
         ====================================================== */

      case 'register':

        return (
          <RegisterScreen

            onBackPress={
              goBack
            }

            onNavigateToOTP={
              handleNavigateToOTP
            }

            onSignInPress={() => {

              Keyboard.dismiss();

              screenOpacity.setValue(0);
              screenTranslateX.setValue(-35);

              setScreenStack([
                'login',
              ]);

              Animated.parallel([

                Animated.timing(
                  screenOpacity,
                  {
                    toValue: 1,
                    duration: 400,
                    easing:
                      Easing.out(
                        Easing.cubic
                      ),
                    useNativeDriver:
                      true,
                  }
                ),

                Animated.timing(
                  screenTranslateX,
                  {
                    toValue: 0,
                    duration: 400,
                    easing:
                      Easing.out(
                        Easing.cubic
                      ),
                    useNativeDriver:
                      true,
                  }
                ),

              ]).start();
            }}
          />
        );

      /* ======================================================
         OTP
         ====================================================== */

      case 'otp':

        return (
          <OtpScreen

            email={
              otpEmail ||
              otpEmailRef.current
            }

            /*
             * Only meaningful for purpose === 'emailChange':
             * the account's CURRENT email, needed so resend
             * can call /request-email-change correctly.
             */

            currentEmail={
              loggedInEmailRef.current ||
              loggedInEmail
            }

            /*
             * IMPORTANT
             *
             * Do NOT convert login to registration.
             * Pass the actual purpose.
             */

            purpose={
              otpPurpose
            }

            onBackPress={
              goBack
            }

            /*
             * OtpScreen MUST call:
             *
             * onVerifySuccess(enteredOtp)
             */

            onVerifySuccess={
              handleOtpSuccess
            }
          />
        );

      /* ======================================================
         FORGOT PASSWORD
         ====================================================== */

      case 'forgotPassword':

        return (
          <ForgotPasswordScreen

            onBackPress={
              goBack
            }

            onOtpSendSuccess={
              handleForgotPasswordOtpRequired
            }
          />
        );

      /* ======================================================
         RESET PASSWORD
         ====================================================== */

      case 'resetPassword':

        /*
         * CRITICAL FIX
         *
         * Use the ref first.
         *
         * This guarantees that the OTP is available
         * immediately after verification.
         */

        const resetEmail =
          otpEmailRef.current ||
          otpEmail;

        const resetOtp =
          verifiedOtpRef.current ||
          verifiedOtp;

        console.log(
          'Rendering ResetPasswordScreen'
        );

        console.log(
          'Reset email:',
          resetEmail
        );

        console.log(
          'Reset OTP:',
          resetOtp
        );

        return (
          <ResetPasswordScreen

            email={
              resetEmail
            }

            otp={
              resetOtp
            }

            onBackPress={
              goBack
            }

            onResetSuccess={
              handleResetPasswordSuccess
            }
          />
        );

      /* ======================================================
         HOME
         ====================================================== */

      case 'home':

        return (
          <HomeScreen

            onScanPress={() => {

              navigateTo(
                'scan'
              );
            }}

            onSeeAllPress={() => {

              navigateTo(
                'seeAll'
              );
            }}

            onMedicinePress={
              (medicine: any) => {

                setSelectedMedicine(
                  medicine
                );

                navigateTo(
                  'medicineDetail'
                );
              }
            }

            onCabinetPress={() => {

              navigateTo(
                'homeCabinet'
              );
            }}

            onHomePress={
              goToHome
            }

            onInsightsPress={
              goToInsights
            }

            onProfilePress={
              goToProfile
            }
          />
        );

      /* ======================================================
         INSIGHTS
         ====================================================== */

      case 'insights':

        return (
          <InsightsScreen

            onBackPress={
              goBack
            }

            onHomePress={
              goToHome
            }

            onInsightsPress={
              goToInsights
            }

            onProfilePress={
              goToProfile
            }
          />
        );

      /* ======================================================
         PROFILE
         ====================================================== */

      case 'profile':

        return (
          <ProfileScreen

            email={
              loggedInEmailRef.current ||
              loggedInEmail
            }

            onBackPress={
              goBack
            }

            onLogoutPress={
              handleLogout
            }

            onRequestEmailChange={(
              newEmail: string
            ) => {

              openOtpScreen(
                newEmail,
                'emailChange'
              );
            }}

            onScanHistoryPress={() => {

              navigateTo(
                'savedScans'
              );
            }}

            onNotificationsPress={() => {

              navigateTo(
                'notifications'
              );
            }}

            onSecurityPress={() => {

              navigateTo(
                'security'
              );
            }}

            onHelpSupportPress={() => {

              navigateTo(
                'helpSupport'
              );
            }}

            onHomePress={
              goToHome
            }

            onInsightsPress={
              goToInsights
            }

            onProfilePress={
              goToProfile
            }
          />
        );

      /* ======================================================
         HOME CABINET
         ====================================================== */

      case 'homeCabinet':

        return (
          <HomeCabinetScreen

            onBackPress={
              goBack
            }

            onScanPress={() => {

              navigateTo(
                'scan'
              );
            }}
          />
        );

      /* ======================================================
         SCAN
         ====================================================== */

      case 'scan':

        return (
          <ScanScreen

            onBackPress={
              goBack
            }

            onScanComplete={
              (result: any) => {

                setSelectedMedicine(
                  result
                );

                navigateTo(
                  'verificationResult'
                );
              }
            }

            onGalleryUpload={() => {

              console.log(
                'Gallery upload clicked'
              );
            }}
          />
        );

      /* ======================================================
         VERIFICATION RESULT
         ====================================================== */

      case 'verificationResult':

        return (
          <VerificationResultScreen

            medicine={
              selectedMedicine
            }

            onBackPress={
              goBack
            }

            onViewDetailsPress={() => {

              navigateTo(
                'medicineDetail'
              );
            }}

            onScanAnotherPress={() => {

              navigateTo(
                'scan'
              );
            }}
          />
        );

      /* ======================================================
         SEE ALL
         ====================================================== */

      case 'seeAll':

        return (
          <SeeAllMedicinesScreen

            onBackPress={
              goBack
            }

            onItemPress={
              (medicine: any) => {

                setSelectedMedicine(
                  medicine
                );

                navigateTo(
                  'medicineDetail'
                );
              }
            }
          />
        );

      /* ======================================================
         MEDICINE DETAIL
         ====================================================== */

      case 'medicineDetail':

        return (
          <MedicineDetailScreen

            medicine={
              selectedMedicine
            }

            onBackPress={
              goBack
            }

            onRequestCallPress={() => {

              navigateTo(
                'requestCall'
              );
            }}

            onOpenChatPress={() => {

              navigateTo(
                'chat'
              );
            }}
          />
        );

      /* ======================================================
         SAVED SCANS
         ====================================================== */

      case 'savedScans':

        return (
          <SavedScansScreen

            onBackPress={
              goBack
            }

            onItemPress={
              (medicine: any) => {

                setSelectedMedicine(
                  medicine
                );

                navigateTo(
                  'medicineDetail'
                );
              }
            }
          />
        );

      /* ======================================================
         NOTIFICATIONS
         ====================================================== */

      case 'notifications':

        return (
          <NotificationsScreen
            onBackPress={
              goBack
            }
          />
        );

      /* ======================================================
         SECURITY
         ====================================================== */

      case 'security':

        return (
          <SecurityPrivacyScreen

            onBackPress={
              goBack
            }

            onChangePasswordPress={() => {

              navigateTo(
                'changePassword'
              );
            }}

            isBiometricEnabled={
              isBiometricEnabled
            }

            setIsBiometricEnabled={
              setIsBiometricEnabled
            }
          />
        );

      /* ======================================================
         CHANGE PASSWORD
         ====================================================== */

      case 'changePassword':

        return (
          <ChangePasswordScreen
            email={
              loggedInEmailRef.current ||
              loggedInEmail
            }
            onBackPress={
              goBack
            }
          />
        );

      /* ======================================================
         HELP & SUPPORT
         ====================================================== */

      case 'helpSupport':

        return (
          <HelpSupportScreen

            onBackPress={
              goBack
            }

            onRequestCallPress={() => {

              navigateTo(
                'requestCall'
              );
            }}

            onOpenChatPress={() => {

              navigateTo(
                'chat'
              );
            }}
          />
        );

      /* ======================================================
         REQUEST CALL
         ====================================================== */

      case 'requestCall':

        return (
          <RequestCallScreen

            onBackPress={
              goBack
            }

            onSubmitCallRequest={
              goBack
            }
          />
        );

      /* ======================================================
         CHAT
         ====================================================== */

      case 'chat':

        return (
          <ChatScreen
            onBackPress={
              goBack
            }
          />
        );

      /* ======================================================
         FALLBACK
         ====================================================== */

      default:

        return (
          <LoginScreen

            onLoginSuccess={
              handleLoginSuccess
            }

            onOtpRequired={
              handleLoginOtpRequired
            }

            onSignUpPress={() => {

              navigateTo(
                'register'
              );
            }}

            onForgotPasswordPress={() => {

              navigateTo(
                'forgotPassword'
              );
            }}
          />
        );
    }
  };

  /* ==========================================================
     APP UI
     ========================================================== */

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
          APP LOCK
         ====================================================== */}

      {isAppLocked ? (

        <View
          style={[
            styles.lockOverlay,
            {
              backgroundColor:
                colors.background,
            },
          ]}
        >

          <Text
            style={
              styles.lockIcon
            }
          >
            🔑
          </Text>

          <Text
            style={[
              styles.lockTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            VeriCure Locked
          </Text>

          <Text
            style={[
              styles.lockDesc,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Enter your phone passcode/PIN
            to unlock the app.
          </Text>

          <TouchableOpacity
            style={[
              styles.unlockBtn,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}
            onPress={
              triggerPasscodeAuth
            }
            activeOpacity={0.8}
          >

            <Text
              style={
                styles.unlockBtnText
              }
            >
              Enter Passcode
            </Text>

          </TouchableOpacity>

        </View>

      ) : (

        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
        >

          <Animated.View
            style={[
              styles.content,
              {
                opacity:
                  screenOpacity,

                transform: [
                  {
                    translateX:
                      screenTranslateX,
                  },
                ],
              },
            ]}
          >

            {renderScreen()}

          </Animated.View>

        </TouchableWithoutFeedback>
      )}

      {/* ======================================================
          ACCOUNT CREATED SUCCESS MESSAGE
         ====================================================== */}

      {showAccountCreated && (

        <View
          style={
            styles.successOverlay
          }
        >

          <Animated.View
            style={[
              styles.successCard,
              {
                backgroundColor:
                  colors.cardSecondary,

                borderColor:
                  colors.border,

                opacity:
                  successOpacity,

                transform: [
                  {
                    scale:
                      successScale,
                  },
                ],
              },
            ]}
          >

            <View
              style={[
                styles.successCircle,
                {
                  backgroundColor:
                    colors.primary,
                },
              ]}
            >

              <Text
                style={
                  styles.successCheck
                }
              >
                ✓
              </Text>

            </View>

            <Text
              style={[
                styles.successTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Account Created!
            </Text>

            <Text
              style={[
                styles.successMessage,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Your VeriCure account has been
              created successfully.
            </Text>

            <Text
              style={[
                styles.successLoginText,
                {
                  color:
                    colors.primaryLight,
                },
              ]}
            >
              Taking you to Login...
            </Text>

          </Animated.View>

        </View>
      )}

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

  content: {
    flex: 1,
  },

  /* ========================================================
     LOCK SCREEN
     ======================================================== */

  lockOverlay: {
    flex: 1,
    justifyContent:
      'center',
    alignItems:
      'center',
    paddingHorizontal:
      24,
  },

  lockIcon: {
    fontSize: 50,
    marginBottom: 16,
  },

  lockTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },

  lockDesc: {
    fontSize: 14,
    textAlign:
      'center',
    marginBottom: 28,
    lineHeight: 20,
  },

  unlockBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },

  unlockBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  /* ========================================================
     ACCOUNT CREATED
     ======================================================== */

  successOverlay: {
    position:
      'absolute',

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    justifyContent:
      'center',

    alignItems:
      'center',

    backgroundColor:
      'rgba(0, 0, 0, 0.45)',

    paddingHorizontal:
      25,

    zIndex: 999,
  },

  successCard: {
    width: '100%',
    maxWidth: 380,

    borderRadius: 24,
    borderWidth: 1,

    paddingHorizontal: 28,
    paddingVertical: 32,

    alignItems:
      'center',

    elevation: 12,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.25,

    shadowRadius: 20,
  },

  successCircle: {
    width: 68,
    height: 68,

    borderRadius: 34,

    justifyContent:
      'center',

    alignItems:
      'center',

    marginBottom: 18,
  },

  successCheck: {
    color: '#FFFFFF',

    fontSize: 38,

    fontWeight: '800',

    marginTop: -3,
  },

  successTitle: {
    fontSize: 24,

    fontWeight: '800',

    marginBottom: 8,

    textAlign:
      'center',
  },

  successMessage: {
    fontSize: 14,

    lineHeight: 21,

    textAlign:
      'center',

    marginBottom: 18,
  },

  successLoginText: {
    fontSize: 13,

    fontWeight: '700',

    textAlign:
      'center',
  },

});