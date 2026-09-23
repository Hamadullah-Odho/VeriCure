import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ActivityIndicator,
  Text,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  // ==========================================================
  // THEME
  // ==========================================================

  const { colors } = useTheme();

  const styles = createStyles(colors);

  // ==========================================================
  // SPLASH TIMER
  // ==========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        {/* ==================================================
            LOGO
        ================================================== */}

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/vericure_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* ==================================================
            APP NAME
        ================================================== */}

        <Text style={styles.appName}>
          VeriCure
        </Text>

        {/* ==================================================
            TAGLINE
        ================================================== */}

        <Text style={styles.tagline}>
          Verify. Protect. Trust.
        </Text>

        {/* ==================================================
            LOADING
        ================================================== */}

        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.loader}
        />

      </View>

      {/* ====================================================
          BOTTOM TEXT
      ==================================================== */}

      <Text style={styles.version}>
        Medicine Verification System
      </Text>
    </View>
  );
}

/* =============================================================
   THEME-AWARE STYLES

   No changes required in colors.ts or ThemeContext.tsx.
============================================================= */

const createStyles = (colors: any) =>
  StyleSheet.create({

    /* =========================================================
       CONTAINER
    ========================================================= */

    container: {
      flex: 1,

      backgroundColor: colors.background,

      justifyContent: 'center',
      alignItems: 'center',
    },

    /* =========================================================
       CONTENT
    ========================================================= */

    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* =========================================================
       LOGO
    ========================================================= */

    logoContainer: {
      width: 220,
      height: 180,

      justifyContent: 'center',
      alignItems: 'center',
    },

    logoImage: {
      width: 220,
      height: 180,
    },

    /* =========================================================
       APP NAME
    ========================================================= */

    appName: {
      marginTop: 10,

      fontSize: 32,
      fontWeight: '700',

      color: colors.text,

      letterSpacing: 0.5,
    },

    /* =========================================================
       TAGLINE
    ========================================================= */

    tagline: {
      marginTop: 6,

      fontSize: 14,

      color: colors.textSecondary,

      letterSpacing: 0.8,
    },

    /* =========================================================
       LOADER
    ========================================================= */

    loader: {
      marginTop: 35,
    },

    /* =========================================================
       BOTTOM TEXT
    ========================================================= */

    version: {
      position: 'absolute',

      bottom: 35,

      fontSize: 12,

      color: colors.textMuted,

      letterSpacing: 0.4,
    },
  });