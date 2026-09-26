import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

interface Props {
  onBackPress?: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'How do I scan a medicine?',
    answer:
      'Open the Scan Medicine option from the navigation bar. Allow camera permission if requested. First capture the front side of the medicine package, then capture the back side. Make sure the package is clearly visible and properly aligned inside the scanning frame.',
  },
  {
    id: '2',
    question: 'How should I capture the medicine?',
    answer:
      'Place the medicine package on a flat surface with good lighting. Keep the camera steady and make sure the complete package is visible inside the frame. Avoid glare, shadows, blurry images, or covering important information such as the batch number and expiry date.',
  },
  {
    id: '3',
    question: 'What does the verification result mean?',
    answer:
      'If the medicine is successfully verified, VeriCure will show an Authentic result. If the system detects unusual or inconsistent information, it will show Anomaly Detected. An anomaly does not automatically prove that a medicine is counterfeit; it means the medicine requires further checking.',
  },
  {
    id: '4',
    question: 'How do I save a medicine to My Cabinet?',
    answer:
      'After completing a medicine verification, open the verification result and select Save to My Cabinet. The medicine information will then be available in your Home Medicine Cabinet for future reference.',
  },
  {
    id: '5',
    question: 'How do I view my saved medicines?',
    answer:
      'Open Home Medicine Cabinet from the navigation bar. Your previously saved medicines will appear there. You can review their available information or remove a medicine from the cabinet when it is no longer needed.',
  },
  {
    id: '6',
    question: 'What should I do if an anomaly is detected?',
    answer:
      'Do not immediately assume that the medicine is counterfeit. Check the packaging, batch number, expiry date, and other available information carefully. You can scan the medicine again using clear images or report it to VeriCure using Report a Medicine for further review.',
  },
];

export default function ChatScreen({ onBackPress }: Props) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(
    null
  );

  const { colors } = useTheme();

  const selectedFAQ = FAQS.find(
    (item) => item.id === selectedQuestion
  );

  const handleQuestionSelect = (faq: FAQItem) => {
    setSelectedQuestion(faq.id);
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
      {/* ================= HEADER ================= */}

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

        <View style={styles.headerTitleContainer}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            VeriCure Assistant
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />

            <Text
              style={[
                styles.headerStatus,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Help & Support
            </Text>
          </View>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* ================= MAIN CONTENT ================= */}

      <ScrollView
          canCancelContentTouches={true}
          delaysContentTouches={false}
        style={styles.chatArea}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= INTRODUCTION ================= */}

        <View
          style={[
            styles.introCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.introIconContainer,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text style={styles.introIcon}>AI</Text>
          </View>

          <View style={styles.introContent}>
            <Text
              style={[
                styles.introTitle,
                {
                  color: colors.textPrimary,
                },
              ]}
            >
              How can we help?
            </Text>

            <Text
              style={[
                styles.introText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Select a question below to learn how to use
              VeriCure.
            </Text>
          </View>
        </View>

        {/* ================= SELECTED ANSWER ================= */}

        {selectedFAQ && (
          <View
            style={[
              styles.answerCard,
              {
                backgroundColor: colors.cardSecondary,
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={styles.answerHeader}>
              <View
                style={[
                  styles.answerIconContainer,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text style={styles.answerIcon}>?</Text>
              </View>

              <Text
                style={[
                  styles.answerQuestion,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                {selectedFAQ.question}
              </Text>
            </View>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: colors.border,
                },
              ]}
            />

            <Text
              style={[
                styles.answerText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {selectedFAQ.answer}
            </Text>

            <TouchableOpacity
              style={[
                styles.clearAnswerBtn,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedQuestion(null)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.clearAnswerText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                View All Questions
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= QUESTIONS ================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.textPrimary,
            },
          ]}
        >
          Frequently Asked Questions
        </Text>

        {FAQS.map((faq, index) => {
          const isSelected = selectedQuestion === faq.id;

          return (
            <TouchableOpacity
              key={faq.id}
              style={[
                styles.questionCard,
                {
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.border,
                },
                isSelected && {
                  backgroundColor: colors.card,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => handleQuestionSelect(faq)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.questionNumber,
                  {
                    backgroundColor: colors.background,
                  },
                  isSelected && {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.questionNumberText,
                    {
                      color: colors.textSecondary,
                    },
                    isSelected && {
                      color: colors.white,
                    },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>

              <Text
                style={[
                  styles.questionText,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                {faq.question}
              </Text>

              <Text
                style={[
                  styles.questionArrow,
                  {
                    color: colors.textMuted,
                  },
                  isSelected && {
                    color: colors.primary,
                  },
                ]}
              >
                ›
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* ================= SUPPORT NOTE ================= */}

        <View
          style={[
            styles.supportNote,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.noteIconContainer,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text style={styles.noteIcon}>i</Text>
          </View>

          <Text
            style={[
              styles.noteText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            If your question is not listed here, you can use
            Report a Medicine from Help & Support to reach the
            VeriCure support team.
          </Text>
        </View>
      </ScrollView>
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

  /* ================= HEADER ================= */

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

  headerTitleContainer: {
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 5,
  },

  headerStatus: {
    fontSize: 11,
    fontWeight: '600',
  },

  headerSpacer: {
    width: 40,
  },

  /* ================= MAIN ================= */

  chatArea: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  /* ================= INTRODUCTION ================= */

  introCard: {
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },

  introIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  introIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  introContent: {
    flex: 1,
  },

  introTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  introText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  /* ================= ANSWER ================= */

  answerCard: {
    borderRadius: 18,
    padding: 17,
    marginBottom: 22,
    borderWidth: 1,
  },

  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  answerIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  answerIcon: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  answerQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },

  divider: {
    height: 1,
    marginVertical: 14,
  },

  answerText: {
    fontSize: 13,
    lineHeight: 20,
  },

  clearAnswerBtn: {
    alignSelf: 'flex-start',
    marginTop: 15,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },

  clearAnswerText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* ================= QUESTIONS ================= */

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 11,
  },

  questionCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },

  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  questionNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },

  questionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  questionArrow: {
    fontSize: 25,
    fontWeight: '300',
    marginLeft: 8,
  },

  /* ================= SUPPORT NOTE ================= */

  supportNote: {
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
  },

  noteIconContainer: {
    width: 25,
    height: 25,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  noteIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  noteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
  },
});