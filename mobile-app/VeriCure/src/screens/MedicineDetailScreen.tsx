import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

interface MedicineData {
  name?: string;
  drug_name?: string;
  category?: string;
  drug_type?: string;
  quantity?: string | number;
  qty?: string | number;
  strength?: string;
  dosage?: string;
  expiryDate?: string;
  expiry_date?: string;
  due_date?: string;
  status?: string;
  type?: string;
  info?: string;
  description?: string;
  batchNo?: string | number;
  batchNumber?: string | number;
  precautions?: string;
  warnings?: string;
  isAuthentic?: boolean;
}

interface Props {
  medicine?: MedicineData;
  onBackPress?: () => void;
  onReportMedicinePress?: () => void;
  onOpenChatPress?: () => void;
}

export default function MedicineDetailScreen({
  medicine,
  onBackPress,
  onReportMedicinePress,
  onOpenChatPress,
}: Props) {
  const { colors } = useTheme();

  const [dosageModalVisible, setDosageModalVisible] =
    useState(false);

  /*
   * No mock medicine data.
   * Everything comes from the medicine object passed from
   * VerificationResultScreen.
   */

  const medicineName =
    medicine?.name ||
    medicine?.drug_name ||
    'Medicine information unavailable';

  const category =
    medicine?.category ||
    medicine?.drug_type ||
    'Category unavailable';

  const quantity =
    medicine?.quantity ||
    medicine?.qty ||
    'Not available';

  const strength =
    medicine?.strength ||
    medicine?.dosage ||
    'Not available';

  const expiryDate =
    medicine?.expiryDate ||
    medicine?.expiry_date ||
    medicine?.due_date ||
    'Not available';

  const status =
    medicine?.status ||
    (medicine?.type === 'positive'
      ? 'Verification Positive'
      : medicine?.type === 'anomaly'
      ? 'Anomaly Detected'
      : 'Verification Result');

  const info =
    medicine?.info ||
    medicine?.description ||
    'No additional medicine information is available.';

  const manufacturer =
    medicine?.manufacturer;

  const isAnomaly =
    medicine?.type === 'anomaly' ||
    medicine?.status === 'Anomaly Detected' ||
    medicine?.isAuthentic === false;

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
            backgroundColor: colors.card,
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
              color: colors.text,
            },
          ]}
        >
          Medicine Details
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
        style={[
          styles.scrollArea,
          {
            backgroundColor: colors.background,
          },
        ]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ===================================================
            VERIFICATION STATUS
        =================================================== */}

        <View
          style={[
            styles.statusCard,
            isAnomaly
              ? {
                  backgroundColor: '#2A171B',
                  borderColor: '#991B1B',
                }
              : {
                  backgroundColor: colors.iconBackground,
                  borderColor: colors.primary,
                },
          ]}
        >
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isAnomaly
                  ? '#EF4444'
                  : colors.primary,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: isAnomaly
                  ? '#FCA5A5'
                  : colors.primary,
              },
            ]}
          >
            {isAnomaly
              ? 'ANOMALY DETECTED'
              : 'VERIFIED AUTHENTIC'}
          </Text>
        </View>

        {/* ===================================================
            MEDICINE INFORMATION CARD
        =================================================== */}

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.drugLabel,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Medicine Name
          </Text>

          <Text
            style={[
              styles.drugName,
              {
                color: colors.text,
              },
            ]}
          >
            {medicineName}
          </Text>

          <Text
            style={[
              styles.drugCategory,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {category}
          </Text>

          {/* Quantity + Strength */}

          <View style={styles.rowSpecs}>
            <View style={styles.specBox}>
              <Text
                style={[
                  styles.specLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Quantity
              </Text>

              <Text
                style={[
                  styles.specValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {quantity}
              </Text>
            </View>

            <View style={styles.specBox}>
              <Text
                style={[
                  styles.specLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Strength
              </Text>

              <Text
                style={[
                  styles.specValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {strength}
              </Text>
            </View>
          </View>

          {/* Expiry */}

          <View
            style={[
              styles.expirySection,
              {
                borderTopColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.specLabel,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Expiry Date
            </Text>

            <Text
              style={[
                styles.specValue,
                {
                  color: colors.text,
                },
              ]}
            >
              {expiryDate}
            </Text>
          </View>

          {/* Batch Number */}

          {medicine?.batchNo || medicine?.batchNumber ? (
            <View
              style={[
                styles.batchSection,
                {
                  borderTopColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.specLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Batch Number
              </Text>

              <Text
                style={[
                  styles.specValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {medicine?.batchNo ||
                  medicine?.batchNumber}
              </Text>
            </View>
          ) : null}

          {/* Manufacturer */}

          {manufacturer ? (
            <View
              style={[
                styles.batchSection,
                {
                  borderTopColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.specLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Manufacturer
              </Text>

              <Text
                style={[
                  styles.specValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {manufacturer}
              </Text>
            </View>
          ) : null}

          {/* Information */}

          <View
            style={[
              styles.infoSection,
              {
                borderTopColor: colors.border,
              },
            ]}
          >
            <View style={styles.infoTitleRow}>
              <View
                style={[
                  styles.infoDot,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              />

              <Text
                style={[
                  styles.infoTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Information
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
              {info}
            </Text>
          </View>
        </View>

        {/* ===================================================
            DOSAGE GUIDE
        =================================================== */}

        <TouchableOpacity
          style={[
            styles.guideCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.7}
          onPress={() =>
            setDosageModalVisible(true)
          }
        >
          <View style={styles.guideLeft}>
            <View
              style={[
                styles.guideIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.guideIconText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                i
              </Text>
            </View>

            <View>
              <Text
                style={[
                  styles.guideTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Dosage & Precautions
              </Text>

              <Text
                style={[
                  styles.guideSubtitle,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                View usage guidance and safety
                information
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.guideArrow,
              {
                color: colors.primary,
              },
            ]}
          >
            ›
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* =====================================================
          BOTTOM ACTIONS
      ===================================================== */}

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.callButton,
            {
              backgroundColor: colors.primary,
            },
          ]}
          onPress={onReportMedicinePress}
          activeOpacity={0.8}
        >
          <View style={styles.callIcon}>
            <Text style={styles.callIconText}>
              +
            </Text>
          </View>

          <Text style={styles.callButtonText}>
            Report This Medicine
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={onOpenChatPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chatButtonText,
              {
                color: colors.primary,
              },
            ]}
          >
            Open Chat
          </Text>
        </TouchableOpacity>
      </View>

      {/* =====================================================
          DOSAGE MODAL
      ===================================================== */}

      <Modal
        visible={dosageModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setDosageModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
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
                  {
                    color: colors.text,
                  },
                ]}
              >
                Dosage & Precautions
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setDosageModalVisible(false)
                }
                style={[
                  styles.modalClose,
                  {
                    backgroundColor:
                      colors.cardSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalCloseText,
                    {
                      color: colors.textMuted,
                    },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[
                  styles.sectionHeader,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Recommended Dosage
              </Text>

              <Text
                style={[
                  styles.modalText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {medicine?.dosage ||
                  'Follow the dosage instructions provided by your doctor or pharmacist.'}
              </Text>

              <Text
                style={[
                  styles.sectionHeader,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Precautions
              </Text>

              <Text
                style={[
                  styles.modalText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {medicine?.precautions ||
                  'Use this medicine only according to the instructions provided by a qualified healthcare professional.'}
              </Text>

              {medicine?.warnings ? (
                <>
                  <Text
                    style={[
                      styles.sectionHeader,
                      {
                        color: colors.primary,
                      },
                    ]}
                  >
                    Warnings
                  </Text>

                  <Text
                    style={[
                      styles.modalText,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {medicine.warnings}
                  </Text>
                </>
              ) : null}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.closeModalBtn,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() =>
                setDosageModalVisible(false)
              }
            >
              <Text style={styles.closeModalText}>
                Close
              </Text>
            </TouchableOpacity>
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

  /* Scroll */

  scrollArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  /* Status */

  statusCard: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
  },

  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },

  statusText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  /* Main Card */

  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },

  drugLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  drugName: {
    fontSize: 23,
    fontWeight: '800',
    marginTop: 4,
  },

  drugCategory: {
    fontSize: 13,
    marginTop: 3,
    marginBottom: 18,
  },

  rowSpecs: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  specBox: {
    flex: 1,
  },

  specLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  specValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },

  expirySection: {
    paddingTop: 12,
    borderTopWidth: 1,
  },

  batchSection: {
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
  },

  /* Information */

  infoSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
  },

  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },

  /* Guide */

  guideCard: {
    borderRadius: 15,
    padding: 15,
    marginTop: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  guideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  guideIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  guideIconText: {
    fontSize: 18,
    fontWeight: '800',
  },

  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  guideSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },

  guideArrow: {
    fontSize: 27,
    fontWeight: '300',
  },

  /* Bottom Bar */

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },

  callButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 10,
  },

  callIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  callIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 15,
  },

  callButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  chatButton: {
    paddingVertical: 13,
    paddingHorizontal: 10,
  },

  chatButtonText: {
    fontWeight: '800',
    fontSize: 14,
  },

  /* Modal */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCloseText: {
    fontSize: 23,
    lineHeight: 25,
  },

  modalScroll: {
    marginVertical: 12,
  },

  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },

  modalText: {
    fontSize: 13,
    lineHeight: 20,
  },

  closeModalBtn: {
    paddingVertical: 13,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 8,
  },

  closeModalText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});