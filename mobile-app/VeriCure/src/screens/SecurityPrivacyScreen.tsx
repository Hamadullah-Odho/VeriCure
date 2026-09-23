import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';

import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';

interface Props {
  onBackPress?: () => void;
  onChangePasswordPress?: () => void;
}

export default function SecurityPrivacyScreen({
  onBackPress,
  onChangePasswordPress,
}: Props) {
  const [dataSharing, setDataSharing] = useState(false);

  // ==========================================================
  // THEME
  // ==========================================================

  const { colors, isDark, toggleTheme } = useTheme();

  // Create theme-aware styles
  const styles = createStyles(colors);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <SafeAreaView style={styles.container}>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <View style={styles.header}>

        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>
            ←
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Security & Privacy
        </Text>

        <View style={styles.headerSpacer} />

      </View>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* =================================================
            APPEARANCE
        ================================================= */}

        <Text style={styles.sectionTitle}>
          APPEARANCE
        </Text>

        {/* Theme Switch */}

        <View style={styles.cardRow}>

          <View style={styles.textContainer}>

            <Text style={styles.cardTitle}>
              Dark Mode
            </Text>

            <Text style={styles.cardDesc}>
              {isDark
                ? 'Dark theme is currently enabled.'
                : 'Light theme is currently enabled.'}
            </Text>

          </View>

          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{
              false: colors.border,
              true: colors.primary,
            }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.border}
          />

        </View>

        {/* =================================================
            APP ACCESS
        ================================================= */}

        <Text
          style={[
            styles.sectionTitle,
            styles.sectionSpacing,
          ]}
        >
          APP ACCESS CONTROL
        </Text>

        {/* Change Password */}

        <TouchableOpacity
          style={styles.cardBtn}
          onPress={onChangePasswordPress}
          activeOpacity={0.8}
        >

          <View style={styles.textContainer}>

            <Text style={styles.cardTitle}>
              Change Password
            </Text>

            <Text style={styles.cardDesc}>
              Update your account login password.
            </Text>

          </View>

          <Text style={styles.arrow}>
            →
          </Text>

        </TouchableOpacity>

        {/* =================================================
            DATA & ANALYTICS
        ================================================= */}

        <Text
          style={[
            styles.sectionTitle,
            styles.sectionSpacing,
          ]}
        >
          DATA & ANALYTICS
        </Text>

        {/* Anonymous Data Sharing */}

        <View style={styles.cardRow}>

          <View style={styles.textContainer}>

            <Text style={styles.cardTitle}>
              Anonymous Data Sharing
            </Text>

            <Text style={styles.cardDesc}>
              Share scan analytics to help improve fake
              medicine detection models.
            </Text>

          </View>

          <Switch
            value={dataSharing}
            onValueChange={setDataSharing}
            trackColor={{
              false: colors.border,
              true: colors.primary,
            }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.border}
          />

        </View>

        {/* =================================================
            PRIVACY NOTE
        ================================================= */}

        <View style={styles.privacyCard}>

          <View style={styles.privacyIconContainer}>

            <Text style={styles.privacyIcon}>
              ✓
            </Text>

          </View>

          <View style={styles.privacyTextContainer}>

            <Text style={styles.privacyTitle}>
              Your Privacy Matters
            </Text>

            <Text style={styles.privacyDesc}>
              Your account and verification data are
              protected. Data sharing is optional and
              can be disabled at any time.
            </Text>

          </View>

        </View>

      </ScrollView>

    </SafeAreaView>
  );
}

/* =============================================================
   THEME-AWARE STYLES
============================================================= */

const createStyles = (colors: any) =>
  StyleSheet.create({

    /* =========================================================
       CONTAINER
    ========================================================= */

    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    /* =========================================================
       HEADER
    ========================================================= */

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',

      paddingHorizontal: 20,
      paddingVertical: 14,

      backgroundColor: colors.background,

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,

      justifyContent: 'center',
      alignItems: 'center',

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,
    },

    backArrow: {
      fontSize: 22,
      fontWeight: '600',

      marginTop: -2,

      color: colors.primaryLight,
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: '800',

      color: colors.text,
    },

    headerSpacer: {
      width: 38,
    },

    /* =========================================================
       CONTENT
    ========================================================= */

    content: {
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 40,
    },

    /* =========================================================
       SECTION TITLES
    ========================================================= */

    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',

      marginBottom: 12,

      letterSpacing: 1,

      color: colors.primary,
    },

    sectionSpacing: {
      marginTop: 20,
    },

    /* =========================================================
       CARD ROW
    ========================================================= */

    cardRow: {
      borderRadius: 16,

      padding: 16,

      flexDirection: 'row',
      alignItems: 'center',

      marginBottom: 12,

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,
    },

    /* =========================================================
       CARD BUTTON
    ========================================================= */

    cardBtn: {
      borderRadius: 16,

      padding: 16,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',

      marginBottom: 12,

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,
    },

    /* =========================================================
       TEXT CONTAINER
    ========================================================= */

    textContainer: {
      flex: 1,
      paddingRight: 12,
    },

    cardTitle: {
      fontSize: 15,
      fontWeight: '800',

      color: colors.text,
    },

    cardDesc: {
      fontSize: 12,

      marginTop: 4,

      lineHeight: 17,

      color: colors.textSecondary,
    },

    /* =========================================================
       ARROW
    ========================================================= */

    arrow: {
      fontSize: 21,
      fontWeight: '700',

      color: colors.primaryLight,
    },

    /* =========================================================
       PRIVACY CARD
    ========================================================= */

    privacyCard: {
      borderRadius: 18,

      padding: 16,

      flexDirection: 'row',
      alignItems: 'center',

      marginTop: 8,

      backgroundColor: colors.cardSecondary,

      borderWidth: 1,
      borderColor: colors.border,
    },

    privacyIconContainer: {
      width: 40,
      height: 40,

      borderRadius: 13,

      justifyContent: 'center',
      alignItems: 'center',

      marginRight: 12,

      backgroundColor: colors.iconBackground,
    },

    privacyIcon: {
      fontSize: 20,
      fontWeight: '900',

      color: colors.primaryLight,
    },

    privacyTextContainer: {
      flex: 1,
    },

    privacyTitle: {
      fontSize: 14,
      fontWeight: '800',

      color: colors.text,
    },

    privacyDesc: {
      fontSize: 11.5,

      lineHeight: 17,

      marginTop: 4,

      color: colors.textSecondary,
    },

  });