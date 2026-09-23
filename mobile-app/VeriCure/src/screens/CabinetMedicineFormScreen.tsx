import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import { parseExpiryDate, formatMonthYear } from '../utils/expiryDate';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CABINET_STORAGE_PREFIX =
  '@vericure_cabinet_medicines_';

function getCabinetStorageKey(email: string): string {
  const normalizedEmail =
    typeof email === 'string'
      ? email.trim().toLowerCase()
      : '';

  return (
    CABINET_STORAGE_PREFIX +
    (normalizedEmail || 'unknown_user')
  );
}

interface Props {
  email: string;
  extractedDetails: any;
  onBackPress: () => void;
  onSaved: () => void;
}

export default function CabinetMedicineFormScreen({
  email,
  extractedDetails,
  onBackPress,
  onSaved,
}: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [name, setName] = useState(
    extractedDetails?.medicineName || '',
  );
  const [manufacturer, setManufacturer] = useState(
    extractedDetails?.manufacturer || '',
  );
  const [dosage, setDosage] = useState(
    extractedDetails?.dosage || '',
  );
  const [batchNumber, setBatchNumber] = useState(
    extractedDetails?.batchNumber || '',
  );
  const [category, setCategory] = useState(
    extractedDetails?.category || '',
  );

  // ---------------------------------------------------------
  // EXPIRY — structured Month/Year instead of free text.
  // If Gemini extracted something, try to parse it (handles
  // several formats, see utils/expiryDate.ts) to prefill the
  // picker; if it can't be parsed, the picker opens with no
  // selection and the user must set it manually, same as
  // before when Gemini found nothing.
  // ---------------------------------------------------------

  const parsedFromGemini = parseExpiryDate(
    extractedDetails?.expiryDate
  );

  const [expiryMonth, setExpiryMonth] = useState<number | null>(
    parsedFromGemini ? parsedFromGemini.getMonth() : null,
  );
  const [expiryYear, setExpiryYear] = useState<number | null>(
    parsedFromGemini ? parsedFromGemini.getFullYear() : null,
  );
  const [pickerVisible, setPickerVisible] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const geminiFoundExpiry = !!parsedFromGemini;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        'Medicine Name Required',
        'Please enter the medicine name.',
      );
      return;
    }

    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      const expiryDateString =
        expiryMonth !== null && expiryYear !== null
          ? `${String(expiryMonth + 1).padStart(2, '0')}/${expiryYear}`
          : 'Not available';

      const computedExpiry =
        expiryMonth !== null && expiryYear !== null
          ? parseExpiryDate(expiryDateString)
          : null;

      const isAlreadyExpired =
        computedExpiry
          ? computedExpiry.getTime() < new Date().setHours(0, 0, 0, 0)
          : false;

      const newItem = {
        id: Date.now().toString(),
        name: name.trim(),
        dosage: dosage.trim() || 'Not available',
        expiryDate: expiryDateString,
        isExpired: isAlreadyExpired,
        category: category.trim() || 'Not available',
        batchNo: batchNumber.trim() || 'Not available',
        manufacturer: manufacturer.trim() || 'Not available',
        notes: {
          en: `${name.trim()} was added to your cabinet manually.`,
          ur: `${name.trim()} apni cabinet mein khud shamil kiya gaya.`,
          sd: `${name.trim()} توهان جي cabinet ۾ شامل ڪيو ويو.`,
        },
      };

      const storageKey = getCabinetStorageKey(email);

      const existingData =
        await AsyncStorage.getItem(storageKey);

      const medicines = existingData
        ? JSON.parse(existingData)
        : [];

      const updatedList = [newItem, ...medicines];

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedList),
      );

      Alert.alert(
        'Added',
        'Medicine has been added to your Home Cabinet.',
      );

      onSaved();

    } catch (error) {
      console.log('Error saving to cabinet:', error);

      Alert.alert(
        'Error',
        'Could not save medicine to cabinet.',
      );

    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Review Details
        </Text>

        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios' ? 'padding' : undefined
        }
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
        >
          <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >

            <Text style={styles.helperText}>
              Check what we read from the packaging and fix
              anything that isn't quite right before saving.
            </Text>

            <Field
              label="Medicine Name"
              value={name}
              onChangeText={setName}
              styles={styles}
              colors={colors}
              required
            />

            <Field
              label="Manufacturer"
              value={manufacturer}
              onChangeText={setManufacturer}
              styles={styles}
              colors={colors}
            />

            <Field
              label="Dosage / Strength"
              value={dosage}
              onChangeText={setDosage}
              styles={styles}
              colors={colors}
              placeholder="e.g. 500mg"
            />

            <Field
              label="Batch Number"
              value={batchNumber}
              onChangeText={setBatchNumber}
              styles={styles}
              colors={colors}
            />

            <Field
              label="Category"
              value={category}
              onChangeText={setCategory}
              styles={styles}
              colors={colors}
              placeholder="e.g. Painkiller, Antibiotic"
            />

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                Expiry Date
              </Text>

              {!geminiFoundExpiry && (
                <Text style={styles.expiryWarning}>
                  We couldn't find an expiry date on the
                  packaging — please set it manually.
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.input,
                  styles.expiryPickerButton,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: !geminiFoundExpiry
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={() => setPickerVisible(true)}
              >
                <Text
                  style={{
                    color:
                      expiryMonth !== null && expiryYear !== null
                        ? colors.text
                        : colors.textMuted,
                  }}
                >
                  {expiryMonth !== null && expiryYear !== null
                    ? `${MONTH_LABELS[expiryMonth]} ${expiryYear}`
                    : 'Select month and year'}
                </Text>
              </TouchableOpacity>
            </View>

            <Modal
              visible={pickerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setPickerVisible(false)}
            >
              <TouchableOpacity
                style={styles.pickerOverlay}
                activeOpacity={1}
                onPress={() => setPickerVisible(false)}
              >
                <View
                  style={[
                    styles.pickerCard,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerTitle,
                      { color: colors.text },
                    ]}
                  >
                    Select Expiry Month & Year
                  </Text>

                  <View style={styles.pickerColumns}>
                    <ScrollView
                      style={styles.pickerColumn}
                      canCancelContentTouches={true}
                      delaysContentTouches={false}
                    >
                      {MONTH_LABELS.map((label, index) => (
                        <TouchableOpacity
                          key={label}
                          style={[
                            styles.pickerOption,
                            expiryMonth === index && {
                              backgroundColor: colors.primary,
                            },
                          ]}
                          onPress={() => setExpiryMonth(index)}
                        >
                          <Text
                            style={{
                              color:
                                expiryMonth === index
                                  ? '#fff'
                                  : colors.text,
                            }}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <ScrollView
                      style={styles.pickerColumn}
                      canCancelContentTouches={true}
                      delaysContentTouches={false}
                    >
                      {Array.from({ length: 21 }, (_, i) => {
                        const year = new Date().getFullYear() - 5 + i;
                        return (
                          <TouchableOpacity
                            key={year}
                            style={[
                              styles.pickerOption,
                              expiryYear === year && {
                                backgroundColor: colors.primary,
                              },
                            ]}
                            onPress={() => setExpiryYear(year)}
                          >
                            <Text
                              style={{
                                color:
                                  expiryYear === year
                                    ? '#fff'
                                    : colors.text,
                              }}
                            >
                              {year}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.pickerDoneBtn,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setPickerVisible(false)}
                  >
                    <Text style={styles.pickerDoneText}>
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.saveBtnText,
                  { color: colors.white },
                ]}
              >
                {isSaving
                  ? 'Saving...'
                  : 'Save to Cabinet'}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  styles,
  colors,
  placeholder,
  required,
}: any) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? ' *' : ''}
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
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 38,
      height: 38,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    content: {
      padding: 20,
      paddingBottom: 60,
    },
    helperText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 20,
      lineHeight: 19,
    },
    fieldBlock: {
      marginBottom: 18,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    expiryWarning: {
      fontSize: 12,
      color: colors.primaryLight,
      marginBottom: 8,
      lineHeight: 17,
    },
    expiryPickerButton: {
      justifyContent: 'center',
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 25,
    },
    pickerCard: {
      width: '100%',
      maxWidth: 380,
      borderRadius: 20,
      padding: 20,
    },
    pickerTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 14,
      textAlign: 'center',
    },
    pickerColumns: {
      flexDirection: 'row',
      height: 260,
      gap: 10,
    },
    pickerColumn: {
      flex: 1,
    },
    pickerOption: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 4,
    },
    pickerDoneBtn: {
      marginTop: 16,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    pickerDoneText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
    },
    saveBtn: {
      marginTop: 10,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
    },
    saveBtnText: {
      fontSize: 15,
      fontWeight: '800',
    },
  });
