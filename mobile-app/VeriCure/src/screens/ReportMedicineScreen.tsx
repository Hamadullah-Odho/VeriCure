
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { API_BASE_URL } from '../config/api';

interface Props {
  email?: string;
  isGuest?: boolean;
  onBackPress?: () => void;
  onSubmitReport?: () => void;
}

const CATEGORIES = [
  'Capsule',
  'Tablet',
  'Syrup',
  'Injection',
  'Inhaler',
  'Other',
];

export default function ReportMedicineScreen({
  email,
  isGuest = false,
  onBackPress,
  onSubmitReport,
}: Props) {
  const { colors, isDark } = useTheme();

  const [medicineName, setMedicineName] = useState('');
  const [category, setCategory] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSubmit = async () => {
    if (!medicineName.trim()) {
      Alert.alert(
        'Required',
        'Please enter the medicine name.',
      );
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        API_BASE_URL + '/api/support/report-medicine',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Guests submit with no email, same as guest scans
            // never being tied to an account.
            email:
              !isGuest && email
                ? email.trim().toLowerCase()
                : undefined,
            medicineName: medicineName.trim(),
            category,
            batchNumber: batchNumber.trim(),
            description: description.trim(),
            contactPhone: contactPhone.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        Alert.alert(
          'Submission Failed',
          data.message ||
            'Unable to submit your report. Please try again.',
        );
        return;
      }

      Alert.alert(
        'Report Sent',
        'Your report has been submitted successfully. Thank you for helping keep medicines safe.',
      );

      if (onSubmitReport) {
        onSubmitReport();
      }
    } catch (error) {
      console.log(
        'Medicine report submission error:',
        error,
      );

      Alert.alert(
        'Connection Error',
        'Unable to connect to the VeriCure server. Please check your connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
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
              { color: colors.primary },
            ]}
          >
            ‹
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: colors.text },
          ]}
        >
          Report a Medicine
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Card */}
        <View
          style={[
            styles.introCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.supportIcon}>
            <View
              style={[
                styles.supportIconCircle,
                {
                  backgroundColor: colors.iconBackground,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.supportIconText,
                  { color: colors.primaryLight },
                ]}
              >
                ⚠
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.title,
              { color: colors.text },
            ]}
          >
            Report a Suspicious Medicine
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            Tell us about a medicine you're concerned
            about — our team will review it.
          </Text>
        </View>

        {/* Medicine Name */}
        <View style={styles.fieldContainer}>
          <Text
            style={[
              styles.label,
              { color: colors.textSecondary },
            ]}
          >
            Medicine Name
            <Text
              style={[
                styles.required,
                { color: colors.danger },
              ]}
            >
              {' '}*
            </Text>
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Enter medicine name"
            placeholderTextColor={colors.textMuted}
            value={medicineName}
            onChangeText={setMedicineName}
          />
        </View>

        {/* Category */}
        <View style={styles.fieldContainer}>
          <Text
            style={[
              styles.label,
              { color: colors.textSecondary },
            ]}
          >
            Category
          </Text>

          <TouchableOpacity
            style={[
              styles.dropdownSelector,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dropdownText,
                {
                  color: category
                    ? colors.text
                    : colors.textMuted,
                },
              ]}
            >
              {category || 'Select category'}
            </Text>

            <View style={styles.dropdownIcon}>
              <View
                style={[
                  styles.arrowDown,
                  { borderColor: colors.primary },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Batch Number */}
        <View style={styles.fieldContainer}>
          <Text
            style={[
              styles.label,
              { color: colors.textSecondary },
            ]}
          >
            Batch Number
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Enter batch number (if visible)"
            placeholderTextColor={colors.textMuted}
            value={batchNumber}
            onChangeText={setBatchNumber}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text
            style={[
              styles.label,
              { color: colors.textSecondary },
            ]}
          >
            What's the concern?
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Describe what looks off — packaging, effects, where you bought it, etc."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Contact Phone (optional) */}
        <View style={styles.fieldContainer}>
          <Text
            style={[
              styles.label,
              { color: colors.textSecondary },
            ]}
          >
            Contact Phone (optional)
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="If you'd like us to follow up"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={contactPhone}
            onChangeText={setContactPhone}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary },
          ]}
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text
            style={[
              styles.submitBtnText,
              { color: colors.white },
            ]}
          >
            {isSubmitting
              ? 'Submitting...'
              : 'Submit Report'}
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.bottomNote,
            { color: colors.textMuted },
          ]}
        >
          Your information will only be used to review
          this report.
        </Text>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: colors.overlay },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.text },
                ]}
              >
                Select Category
              </Text>

              <TouchableOpacity
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor:
                      colors.cardSecondary,
                  },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text
                  style={[
                    styles.closeBtnText,
                    { color: colors.textSecondary },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    {
                      borderBottomColor:
                        colors.border,
                    },
                  ]}
                  onPress={() => {
                    setCategory(item);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          category === item
                            ? colors.primaryLight
                            : colors.textSecondary,
                        fontWeight:
                          category === item
                            ? '800'
                            : '400',
                      },
                    ]}
                  >
                    {item}
                  </Text>

                  {category === item && (
                    <View
                      style={[
                        styles.selectedIndicator,
                        {
                          backgroundColor:
                            colors.primary,
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Header */
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
    lineHeight: 36,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 40,
  },

  /* Content */
  content: {
    padding: 18,
    paddingBottom: 40,
  },

  /* Intro */
  introCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1,
    alignItems: 'center',
  },

  supportIcon: {
    marginBottom: 12,
  },

  supportIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  supportIconText: {
    fontSize: 23,
    fontWeight: '800',
  },

  title: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 7,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  /* Fields */
  fieldContainer: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },

  required: {
    fontWeight: '700',
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 14,
  },

  textArea: {
    height: 110,
    paddingTop: 13,
  },

  /* Dropdown */
  dropdownSelector: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dropdownText: {
    fontSize: 14,
  },

  dropdownIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowDown: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },

  /* Submit */
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 6,
  },

  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },

  bottomNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 12,
    paddingHorizontal: 20,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContent: {
    width: '88%',
    maxHeight: '65%',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeBtnText: {
    fontSize: 23,
    lineHeight: 25,
  },

  modalItem: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalItemText: {
    fontSize: 14,
  },

  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
