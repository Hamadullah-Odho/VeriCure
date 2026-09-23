import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

interface Props {
  onBackPress?: () => void;
  onReportMedicinePress?: () => void;
  onOpenChatPress?: () => void;
}

export default function HelpSupportScreen({
  onBackPress,
  onReportMedicinePress,
  onOpenChatPress,
}: Props) {
  const { colors } = useTheme();

  const handleEmailSupport = async () => {
    try {
      await Linking.openURL('mailto:support@counterfeitdetector.pk');
    } catch (error) {
      Alert.alert(
        'Unable to Open Email',
        'Please open your email application and contact our support team.'
      );
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
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.backArrow,
              {
                color: colors.primary,
              },
            ]}
          >
            ‹
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
          Help & Support
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* =================================================
            HERO SECTION
            ================================================= */}

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.heroIconContainer,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text style={styles.heroIcon}>?</Text>
          </View>

          <Text
            style={[
              styles.heroTitle,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            How can we help you?
          </Text>

          <Text
            style={[
              styles.heroSub,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Get assistance with medicine verification, scanning,
            account-related questions, or other VeriCure features.
          </Text>
        </View>

        {/* =================================================
            AI ASSISTANT
            ================================================= */}

        <TouchableOpacity
          style={[
            styles.supportOption,
            {
              backgroundColor: colors.cardSecondary,
              borderColor: colors.border,
            },
          ]}
          onPress={onOpenChatPress}
          activeOpacity={0.75}
        >
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.optionIcon,
                {
                  color: colors.primary,
                },
              ]}
            >
              AI
            </Text>
          </View>

          <View style={styles.optionContent}>
            <Text
              style={[
                styles.optionTitle,
                {
                  color: colors.textPrimary,
                },
              ]}
            >
              AI Assistant
            </Text>

            <Text
              style={[
                styles.optionDesc,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Ask questions about medicine verification and get
              assistance instantly.
            </Text>
          </View>

          <Text
            style={[
              styles.arrow,
              {
                color: colors.textMuted,
              },
            ]}
          >
            ›
          </Text>
        </TouchableOpacity>

        {/* =================================================
            REPORT A MEDICINE
            ================================================= */}

        <TouchableOpacity
          style={[
            styles.supportOption,
            {
              backgroundColor: colors.cardSecondary,
              borderColor: colors.border,
            },
          ]}
          onPress={onReportMedicinePress}
          activeOpacity={0.75}
        >
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.optionIcon,
                {
                  color: colors.primary,
                },
              ]}
            >
              ⚠
            </Text>
          </View>

          <View style={styles.optionContent}>
            <Text
              style={[
                styles.optionTitle,
                {
                  color: colors.textPrimary,
                },
              ]}
            >
              Report a Medicine
            </Text>

            <Text
              style={[
                styles.optionDesc,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Report a suspicious or counterfeit medicine to the VeriCure team.
            </Text>
          </View>

          <Text
            style={[
              styles.arrow,
              {
                color: colors.textMuted,
              },
            ]}
          >
            ›
          </Text>
        </TouchableOpacity>

        {/* =================================================
            EMAIL SUPPORT
            ================================================= */}

        <TouchableOpacity
          style={[
            styles.supportOption,
            {
              backgroundColor: colors.cardSecondary,
              borderColor: colors.border,
            },
          ]}
          onPress={handleEmailSupport}
          activeOpacity={0.75}
        >
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.optionIcon,
                {
                  color: colors.primary,
                },
              ]}
            >
              @
            </Text>
          </View>

          <View style={styles.optionContent}>
            <Text
              style={[
                styles.optionTitle,
                {
                  color: colors.textPrimary,
                },
              ]}
            >
              Email Support
            </Text>

            <Text
              style={[
                styles.optionDesc,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Contact our support team through email.
            </Text>

            <Text
              style={[
                styles.emailText,
                {
                  color: colors.primary,
                },
              ]}
            >
              support@counterfeitdetector.pk
            </Text>
          </View>

          <Text
            style={[
              styles.arrow,
              {
                color: colors.textMuted,
              },
            ]}
          >
            ›
          </Text>
        </TouchableOpacity>

        {/* =================================================
            VERIFICATION HELP
            ================================================= */}

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.infoHeader}>
            <View
              style={[
                styles.infoIconContainer,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text style={styles.infoIcon}>i</Text>
            </View>

            <Text
              style={[
                styles.infoTitle,
                {
                  color: colors.textPrimary,
                },
              ]}
            >
              Need help with verification?
            </Text>
          </View>

          <Text
            style={[
              styles.infoText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Make sure the medicine package is clearly visible when
            scanning. Capture both the front and back sides of the
            package for the most reliable verification.
          </Text>
        </View>

        {/* =================================================
            APP INFORMATION
            ================================================= */}

        <View style={styles.appInfo}>
          <Text
            style={[
              styles.appName,
              {
                color: colors.primary,
              },
            ]}
          >
            VeriCure
          </Text>

          <Text
            style={[
              styles.appDescription,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Medicine Verification & Safety
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* =========================================================
     HEADER
     ========================================================= */

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },

  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  backArrow: {
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 38,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 40,
  },

  /* =========================================================
     MAIN CONTENT
     ========================================================= */

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  /* =========================================================
     HERO
     ========================================================= */

  heroCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
  },

  heroIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  heroIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
  },

  heroSub: {
    fontSize: 13,
    marginTop: 7,
    lineHeight: 20,
  },

  /* =========================================================
     SUPPORT OPTIONS
     ========================================================= */

  supportOption: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  optionIcon: {
    fontSize: 15,
    fontWeight: '900',
  },

  optionContent: {
    flex: 1,
    paddingRight: 8,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  optionDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  emailText: {
    fontSize: 11,
    marginTop: 5,
    fontWeight: '600',
  },

  arrow: {
    fontSize: 27,
    fontWeight: '300',
  },

  /* =========================================================
     INFORMATION CARD
     ========================================================= */

  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 6,
    borderWidth: 1,
  },

  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  infoIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  infoText: {
    fontSize: 12,
    lineHeight: 19,
  },

  /* =========================================================
     APP INFO
     ========================================================= */

  appInfo: {
    alignItems: 'center',
    marginTop: 28,
  },

  appName: {
    fontSize: 15,
    fontWeight: '900',
  },

  appDescription: {
    fontSize: 11,
    marginTop: 3,
  },
});