
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

import * as Speech from 'expo-speech';

import {
  createAudioPlayer,
  AudioPlayer,
} from 'expo-audio';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../theme/ThemeContext';
import { API_BASE_URL } from '../config/api';

/*
 * ------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------
 */

/**
 * Convert an ArrayBuffer containing binary audio data into
 * a base64 string.
 *
 * This is used for the Urdu WAV audio returned by the
 * Spring Boot -> FastAPI -> Piper TTS pipeline.
 */
function arrayBufferToBase64(
  buffer: ArrayBuffer,
): string {
  const bytes = new Uint8Array(buffer);

  let binary = '';

  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {
    binary += String.fromCharCode(
      bytes[i],
    );
  }

  return btoa(binary);
}

/*
 * ------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------
 */

interface Props {
  email: string;
  medicine?: any;
  onBackPress: () => void;
  onViewDetailsPress?: () => void;
  onScanAnotherPress?: () => void;
  onSavedSuccessfully?: () => void;
}

/*
 * ------------------------------------------------------------
 * CABINET STORAGE
 * ------------------------------------------------------------
 */

const CABINET_STORAGE_PREFIX =
  '@vericure_cabinet_medicines_';

function getCabinetStorageKey(
  email: string,
): string {
  const normalizedEmail =
    typeof email === 'string'
      ? email.trim().toLowerCase()
      : '';

  return (
    CABINET_STORAGE_PREFIX +
    (normalizedEmail ||
      'unknown_user')
  );
}

/*
 * ------------------------------------------------------------
 * SCREEN
 * ------------------------------------------------------------
 */

export default function VerificationResultScreen({
  email,
  medicine,
  onBackPress,
  onViewDetailsPress,
  onScanAnotherPress,
  onSavedSuccessfully,
}: Props) {
  const { colors } = useTheme();

  /*
   * ----------------------------------------------------------
   * VOICE STATE
   * ----------------------------------------------------------
   */

  const [selectedLang, setSelectedLang] =
    useState<'en' | 'ur'>('ur');

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  /*
   * IMPORTANT:
   *
   * Do not keep the AudioPlayer in React state.
   *
   * A ref gives us one stable reference to the currently
   * active Urdu player and prevents stale closures from
   * creating overlapping players.
   */
  const urduPlayerRef =
    useRef<AudioPlayer | null>(null);

  /*
   * Used to cancel an Urdu HTTP request that is still
   * downloading audio.
   */
  const urduAbortControllerRef =
    useRef<AbortController | null>(null);

  /*
   * Every speech operation gets a unique ID.
   *
   * If the user changes language while an old request is
   * still running, the old request becomes invalid and
   * cannot start playback later.
   */
  const speechRequestIdRef =
    useRef(0);

  /*
   * ----------------------------------------------------------
   * RESULT
   * ----------------------------------------------------------
   */

  /*
   * Three possible verification states:
   *
   * GENUINE
   * COUNTERFEIT
   * UNKNOWN
   */

  const rawVerdict =
    typeof medicine?.verdict ===
    'string'
      ? medicine.verdict.toUpperCase()
      : medicine?.type === 'positive' ||
          medicine?.isAuthentic === true
        ? 'GENUINE'
        : 'COUNTERFEIT';

  const isAuthentic =
    rawVerdict === 'GENUINE';

  const isCounterfeit =
    rawVerdict === 'COUNTERFEIT';

  const isUncertain =
    rawVerdict === 'UNKNOWN';

  /*
   * Backend may explicitly tell us that the image was not
   * medicine packaging.
   */
  const isNotMedicine =
    isUncertain &&
    medicine?.notMedicine === true;

  /*
   * ----------------------------------------------------------
   * COLORS
   * ----------------------------------------------------------
   */

  const statusColor = isAuthentic
    ? colors.success
    : isUncertain
      ? colors.warning
      : colors.danger;

  const statusBackgroundColor =
    isAuthentic
      ? colors.successBackground
      : isUncertain
        ? colors.warningBackground
        : colors.dangerBackground;

  /*
   * ----------------------------------------------------------
   * MEDICINE DATA
   * ----------------------------------------------------------
   */

  const medicineName =
    medicine?.name ||
    medicine?.medicineName ||
    'Unknown';

  const batchNumber =
    medicine?.batchNo ||
    medicine?.batchNumber ||
    'Not available';

  const manufacturer =
    medicine?.manufacturer;

  const dosage =
    medicine?.dosage;

  const expiryDate =
    medicine?.expiryDate;

  const category =
    medicine?.category;

  /*
   * ----------------------------------------------------------
   * RESULT TEXT
   * ----------------------------------------------------------
   */

  const resultTitle = {
    en: isAuthentic
      ? 'VERIFIED AUTHENTIC'
      : isNotMedicine
        ? 'UNKNOWN — SCAN AGAIN'
        : isUncertain
          ? 'RESULT UNCERTAIN'
          : 'ANOMOLY DETECTED',

    ur: isAuthentic
      ? 'تصدیق شدہ اصلی'
      : isNotMedicine
        ? 'نامعلوم — دوبارہ اسکین کریں'
        : isUncertain
          ? 'نتیجہ غیر یقینی'
          : 'جعلی دوا کا پتہ چلا',
  };

  const resultMessage = {
    en: isAuthentic
      ? 'The scanned medicine appears authentic based on the verification result.'
      : isNotMedicine
        ? "This doesn't look like medicine packaging. Please scan again with clear photos of an actual medicine box, bottle, blister pack, or strip."
        : isUncertain
          ? "We couldn't confidently verify this medicine from these images. This is NOT a confirmation that it's counterfeit — please try scanning again with clearer, well-lit photos of both sides."
          : 'This medicine shows signs of being counterfeit. Please do not use it, and consider reporting it using the Request Call option in Support.',

    ur: isAuthentic
      ? 'اس اسکین کے مطابق دوا اصلی معلوم ہوتی ہے۔'
      : isNotMedicine
        ? 'یہ دوا کی پیکنگ نہیں لگتی۔ براہ کرم دوا کے ڈبے، بوتل، یا پتے کی واضح تصویر کے ساتھ دوبارہ اسکین کریں۔'
        : isUncertain
          ? 'ہم ان تصاویر سے اس دوا کی حتمی تصدیق نہیں کر سکے۔ یہ اس بات کی تصدیق نہیں کہ یہ جعلی ہے۔ براہ کرم واضح روشنی میں دوبارہ اسکین کریں۔'
          : 'اس دوا میں جعلی ہونے کے آثار ہیں۔ براہ کرم اسے استعمال نہ کریں۔',
  };

  /*
   * ----------------------------------------------------------
   * RELEASE URDU PLAYER
   * ----------------------------------------------------------
   */

  const releaseUrduPlayer =
    () => {
      const player =
        urduPlayerRef.current;

      if (!player) {
        return;
      }

      /*
       * Stop playback first.
       */
      try {
        player.pause();
      } catch {}

      /*
       * Completely release the native audio player.
       */
      try {
        player.remove();
      } catch (error) {
        console.log(
          'Error releasing Urdu audio player:',
          error,
        );
      }

      urduPlayerRef.current =
        null;
    };

  /*
   * ----------------------------------------------------------
   * CANCEL URDU REQUEST
   * ----------------------------------------------------------
   */

  const cancelUrduRequest =
    () => {
      const controller =
        urduAbortControllerRef.current;

      if (!controller) {
        return;
      }

      try {
        controller.abort();
      } catch {}

      urduAbortControllerRef.current =
        null;
    };

  /*
   * ----------------------------------------------------------
   * STOP ALL SPEECH
   * ----------------------------------------------------------
   */

  const stopSpeech = async () => {
    /*
     * Invalidate ALL previous speech operations.
     *
     * This is the most important part of the fix.
     *
     * If an old Urdu fetch finishes later, its request ID
     * will no longer match and it will not be allowed to
     * create/play audio.
     */
    speechRequestIdRef.current += 1;

    /*
     * Cancel an Urdu HTTP request that is still downloading.
     */
    cancelUrduRequest();

    /*
     * Stop Expo Speech.
     */
    try {
      Speech.stop();
    } catch (error) {
      console.log(
        'Speech stop error:',
        error,
      );
    }

    /*
     * Stop and completely remove the Urdu player.
     */
    releaseUrduPlayer();

    setIsSpeaking(false);
  };

  /*
   * ----------------------------------------------------------
   * ENGLISH SPEECH
   * ----------------------------------------------------------
   */

  const speakEnglish = () => {
    /*
     * Every speech operation gets its own request ID.
     */
    const requestId =
      ++speechRequestIdRef.current;

    /*
     * English should never overlap with Urdu.
     */
    cancelUrduRequest();
    releaseUrduPlayer();

    try {
      Speech.stop();
    } catch {}

    setIsSpeaking(true);

    Speech.speak(
      resultMessage.en,
      {
        language: 'en-US',

        pitch: 1.0,

        rate: 0.85,

        onDone: () => {
          /*
           * Ignore callbacks belonging to an old speech
           * operation.
           */
          if (
            requestId !==
            speechRequestIdRef.current
          ) {
            return;
          }

          setIsSpeaking(false);
        },

        onStopped: () => {
          if (
            requestId !==
            speechRequestIdRef.current
          ) {
            return;
          }

          setIsSpeaking(false);
        },

        onError: () => {
          if (
            requestId !==
            speechRequestIdRef.current
          ) {
            return;
          }

          setIsSpeaking(false);

          Alert.alert(
            'Speech Error',
            'Voice audio is not supported for this language.',
          );
        },
      },
    );
  };

  /*
   * ----------------------------------------------------------
   * URDU BACKEND TTS
   * ----------------------------------------------------------
   */

  const speakUrdu = async () => {
    /*
     * Give this request a unique ID.
     */
    const requestId =
      ++speechRequestIdRef.current;

    /*
     * Cancel any previous Urdu HTTP request.
     */
    cancelUrduRequest();

    /*
     * Remove any previous Urdu player.
     */
    releaseUrduPlayer();

    /*
     * Create a new AbortController for this request.
     */
    const controller =
      new AbortController();

    urduAbortControllerRef.current =
      controller;

    setIsSpeaking(true);

    try {
      console.log(
        'Urdu TTS request:',
        API_BASE_URL +
          '/api/tts/urdu',
      );

      const response =
        await fetch(
          API_BASE_URL +
            '/api/tts/urdu',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              text: resultMessage.ur,
            }),

            /*
             * Allows the request to be cancelled
             * when the language changes.
             */
            signal:
              controller.signal,
          },
        );

      /*
       * The user may have switched languages while the
       * request was running.
       *
       * Never allow an old request to continue.
       */
      if (
        requestId !==
        speechRequestIdRef.current
      ) {
        console.log(
          'Ignoring old Urdu TTS request.',
        );

        return;
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        console.log(
          'Urdu TTS HTTP status:',
          response.status,
        );

        console.log(
          'Urdu TTS backend response:',
          errorText,
        );

        throw new Error(
          `Urdu TTS failed (${response.status}): ${
            errorText ||
            'Unknown backend error'
          }`,
        );
      }

      /*
       * Backend returns WAV audio.
       */
      const arrayBuffer =
        await response.arrayBuffer();

      /*
       * Check AGAIN after downloading.
       *
       * The user may have switched from Urdu to English
       * while the WAV was downloading.
       */
      if (
        requestId !==
        speechRequestIdRef.current
      ) {
        console.log(
          'Ignoring old Urdu TTS audio.',
        );

        return;
      }

      console.log(
        'Urdu TTS audio received:',
        arrayBuffer.byteLength,
        'bytes',
      );

      const base64Audio =
        arrayBufferToBase64(
          arrayBuffer,
        );

      /*
       * IMPORTANT:
       *
       * FastAPI/Piper returns WAV.
       *
       * Therefore this MUST be audio/wav,
       * not audio/mpeg.
       */
      const dataUri =
        `data:audio/wav;base64,${base64Audio}`;

      /*
       * Final race-condition check before creating
       * the native player.
       */
      if (
        requestId !==
        speechRequestIdRef.current
      ) {
        return;
      }

      /*
       * Create exactly one Urdu audio player.
       */
      const player =
        createAudioPlayer(dataUri);

      /*
       * Language may have changed during player creation.
       */
      if (
        requestId !==
        speechRequestIdRef.current
      ) {
        try {
          player.remove();
        } catch {}

        return;
      }

      /*
       * Store this as the ONLY active Urdu player.
       */
      urduPlayerRef.current =
        player;

      /*
       * Listen for playback completion.
       */
      const subscription =
        player.addListener(
          'playbackStatusUpdate',
          (status) => {
            /*
             * Ignore events from an old player.
             */
            if (
              requestId !==
              speechRequestIdRef.current
            ) {
              return;
            }

            if (
              status.isLoaded &&
              status.didJustFinish
            ) {
              setIsSpeaking(false);

              /*
               * Release the player after playback.
               */
              if (
                urduPlayerRef.current ===
                player
              ) {
                urduPlayerRef.current =
                  null;

                try {
                  subscription.remove();
                } catch {}

                try {
                  player.remove();
                } catch {}
              }
            }
          },
        );

      /*
       * One final check before starting playback.
       */
      if (
        requestId !==
        speechRequestIdRef.current
      ) {
        try {
          subscription.remove();
        } catch {}

        try {
          player.remove();
        } catch {}

        if (
          urduPlayerRef.current ===
          player
        ) {
          urduPlayerRef.current =
            null;
        }

        return;
      }

      /*
       * Start Urdu playback.
       */
      player.play();

    } catch (error: any) {
      /*
       * Abort is expected when the user switches languages.
       *
       * Do NOT show an error alert in that case.
       */
      if (
        error?.name ===
        'AbortError'
      ) {
        console.log(
          'Urdu TTS request cancelled.',
        );

        return;
      }

      /*
       * Ignore errors belonging to old requests.
       */
      if (
        requestId !==
        speechRequestIdRef.current
      ) {
        return;
      }

      console.log(
        'Urdu speech error:',
        error,
      );

      setIsSpeaking(false);

      Alert.alert(
        'Speech Error',
        "Couldn't play Urdu voice audio. Please check your connection and try again.",
      );

    } finally {
      /*
       * Only clear the controller if this is still
       * the currently active request.
       */
      if (
        requestId ===
        speechRequestIdRef.current
      ) {
        urduAbortControllerRef.current =
          null;
      }
    }
  };

  /*
   * ----------------------------------------------------------
   * SPEAK RESULT
   * ----------------------------------------------------------
   */

  const speakResult = async (
    lang: 'en' | 'ur',
  ) => {
    /*
     * Stop EVERYTHING before starting another language.
     */
    await stopSpeech();

    /*
     * Give native audio a short moment to stop completely.
     */
    await new Promise(
      (resolve) =>
        setTimeout(resolve, 100),
    );

    if (lang === 'en') {
      speakEnglish();
    } else {
      await speakUrdu();
    }
  };

  /*
   * ----------------------------------------------------------
   * HANDLE SPEECH BUTTON
   * ----------------------------------------------------------
   */

  const handleSpeech = async (
    langKey = selectedLang,
  ) => {
    let nativeSpeaking =
      false;

    try {
      nativeSpeaking =
        await Speech.isSpeakingAsync();
    } catch {
      nativeSpeaking = false;
    }

    /*
     * If anything is already speaking, pressing the button
     * acts as STOP.
     */
    if (
      isSpeaking ||
      nativeSpeaking ||
      urduPlayerRef.current
    ) {
      await stopSpeech();
      return;
    }

    await speakResult(langKey);
  };

  /*
   * ----------------------------------------------------------
   * LANGUAGE SELECT
   * ----------------------------------------------------------
   */

  const handleLanguageSelect =
    async (
      lang: 'en' | 'ur',
    ) => {
      /*
       * STOP current language FIRST.
       *
       * This also cancels any pending Urdu HTTP request.
       */
      await stopSpeech();

      /*
       * Update the visible language.
       */
      setSelectedLang(lang);

      /*
       * Give the old audio a moment to fully stop.
       */
      await new Promise(
        (resolve) =>
          setTimeout(resolve, 100),
      );

      /*
       * Start ONLY the newly selected language.
       */
      if (lang === 'en') {
        speakEnglish();
      } else {
        await speakUrdu();
      }
    };

  /*
   * ----------------------------------------------------------
   * REPEAT
   * ----------------------------------------------------------
   */

  const handleRepeat = async () => {
    /*
     * Stop any currently playing audio first.
     */
    await stopSpeech();

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 150),
    );

    /*
     * Start only the currently selected language.
     */
    if (selectedLang === 'en') {
      speakEnglish();
    } else {
      await speakUrdu();
    }
  };

  /*
   * ----------------------------------------------------------
   * INITIAL LANGUAGE PROMPT + CLEANUP
   * ----------------------------------------------------------
   */

  useEffect(() => {
    const playInitialPrompt =
      async () => {
        try {
          Speech.stop();

          Speech.speak(
            'Please select your language.',
            {
              language: 'en-US',
              pitch: 1.0,
              rate: 0.9,
            },
          );
        } catch (error) {
          console.log(
            'Initial speech error:',
            error,
          );
        }
      };

    playInitialPrompt();

    /*
     * Cleanup when leaving the screen.
     */
    return () => {
      /*
       * Invalidate all existing speech requests.
       */
      speechRequestIdRef.current += 1;

      /*
       * Cancel any pending Urdu request.
       */
      cancelUrduRequest();

      /*
       * Stop English/native speech.
       */
      try {
        Speech.stop();
      } catch {}

      /*
       * Stop and remove Urdu player.
       */
      releaseUrduPlayer();
    };
  }, []);

  /*
   * ----------------------------------------------------------
   * SAVE TO CABINET
   * ----------------------------------------------------------
   */

  const handleSaveToCabinet =
    async () => {
      if (!medicine) {
        Alert.alert(
          'No Verification Result',
          'There is no medicine verification result to save.',
        );

        return;
      }

      try {
        const newItem = {
          id: Date.now().toString(),

          name:
            medicine.name ||
            medicine.medicineName ||
            'Unknown',

          dosage:
            medicine.dosage ||
            'Not available',

          expiryDate:
            medicine.expiryDate ||
            'Not available',

          isExpired:
            medicine.isExpired === true,

          category:
            medicine.category ||
            'Not available',

          batchNo:
            medicine.batchNo ||
            medicine.batchNumber ||
            'Not available',

          notes: {
            en: isAuthentic
              ? `${medicineName} has been verified as authentic.`
              : isUncertain
                ? `${medicineName} could not be confidently verified. Result was uncertain.`
                : `${medicineName} was flagged as counterfeit during verification.`,

            ur: isAuthentic
              ? `${medicineName} asli tasdeeq shuda hai.`
              : isUncertain
                ? `${medicineName} ki tasdeeq yaqeeni tor par nahi ho saki.`
                : `${medicineName} jaali qarar diya gaya.`,
          },
        };

        const storageKey =
          getCabinetStorageKey(
            email,
          );

        const existingData =
          await AsyncStorage.getItem(
            storageKey,
          );

        const medicines =
          existingData
            ? JSON.parse(existingData)
            : [];

        const updatedList = [
          newItem,
          ...medicines,
        ];

        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify(
            updatedList,
          ),
        );

        Alert.alert(
          'Saved',
          'Medicine has been saved to your Home Cabinet.',
        );

        if (
          onSavedSuccessfully
        ) {
          onSavedSuccessfully();
        }

      } catch (error) {
        console.error(
          'Error saving to cabinet:',
          error,
        );

        Alert.alert(
          'Error',
          'Could not save medicine to cabinet.',
        );
      }
    };

  /*
   * ----------------------------------------------------------
   * UI
   * ----------------------------------------------------------
   */

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
      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.background,

            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.headerBackBtn}
        >
          <Text
            style={[
              styles.backIcon,
              {
                color:
                  colors.primaryLight,
              },
            ]}
          >
            ‹
          </Text>

          <Text
            style={[
              styles.backText,
              {
                color:
                  colors.primaryLight,
              },
            ]}
          >
            Back
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
          Verification Result
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* RESULT CARD */}

        <View
          style={[
            styles.statusCard,
            {
              backgroundColor:
                statusBackgroundColor,

              borderColor:
                statusColor,
            },
          ]}
        >
          <View
            style={[
              styles.statusIconContainer,
              {
                backgroundColor:
                  colors.card,
              },
            ]}
          >
            <Text
              style={[
                styles.statusIcon,
                {
                  color:
                    statusColor,
                },
              ]}
            >
              {isAuthentic
                ? '✓'
                : isUncertain
                  ? '?'
                  : '✕'}
            </Text>
          </View>

          <Text
            style={[
              styles.statusTitle,
              {
                color:
                  statusColor,
              },
            ]}
          >
            {
              resultTitle[
                selectedLang
              ]
            }
          </Text>

          <Text
            style={[
              styles.statusSub,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {
              resultMessage[
                selectedLang
              ]
            }
          </Text>
        </View>

        {/* VOICE ASSISTANT */}

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionIconText,
                  {
                    color:
                      colors.primaryLight,
                  },
                ]}
              >
                ♪
              </Text>
            </View>

            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Voice Result Assistant
              </Text>

              <Text
                style={[
                  styles.sectionSubtitle,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Listen to your verification result
              </Text>
            </View>
          </View>

          {/* LANGUAGE */}

          <View
            style={
              styles.langToggleRow
            }
          >
            {(
              ['en', 'ur'] as const
            ).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langBtn,
                  {
                    backgroundColor:
                      colors.cardSecondary,

                    borderColor:
                      colors.border,
                  },

                  selectedLang ===
                    lang && {
                    backgroundColor:
                      colors.primary,

                    borderColor:
                      colors.primaryLight,
                  },
                ]}
                onPress={() =>
                  handleLanguageSelect(
                    lang,
                  )
                }
              >
                <Text
                  style={[
                    styles.langBtnText,
                    {
                      color:
                        colors.textSecondary,
                    },

                    selectedLang ===
                      lang && {
                      color:
                        colors.white,
                    },
                  ]}
                >
                  {lang === 'en'
                    ? 'English'
                    : 'اردو'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SPEECH */}

          <View
            style={
              styles.speechActionRow
            }
          >
            <TouchableOpacity
              style={[
                styles.playVoiceBtn,
                {
                  backgroundColor:
                    isSpeaking
                      ? colors.border
                      : colors.primary,
                },
              ]}
              onPress={() =>
                handleSpeech(
                  selectedLang,
                )
              }
            >
              <Text
                style={styles.playIcon}
              >
                {isSpeaking
                  ? '■'
                  : '▶'}
              </Text>

              <Text
                style={[
                  styles.playVoiceBtnText,
                  {
                    color:
                      colors.white,
                  },
                ]}
              >
                {isSpeaking
                  ? 'Stop Speech'
                  : 'Play Voice Output'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.repeatIconBtn,
                {
                  backgroundColor:
                    colors.cardSecondary,

                  borderColor:
                    colors.border,
                },
              ]}
              onPress={
                handleRepeat
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.repeatIconText,
                  {
                    color:
                      colors.primaryLight,
                  },
                ]}
              >
                ↻
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MEDICINE SUMMARY */}

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.detailsHeading,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Medicine Summary
          </Text>

          <View
            style={styles.detailRow}
          >
            <Text
              style={[
                styles.detailLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Medicine Name
            </Text>

            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {medicineName}
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor:
                  colors.border,
              },
            ]}
          />

          <View
            style={styles.detailRow}
          >
            <Text
              style={[
                styles.detailLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Batch Number
            </Text>

            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {batchNumber}
            </Text>
          </View>

          {manufacturer && (
            <>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor:
                      colors.border,
                  },
                ]}
              />

              <View
                style={styles.detailRow}
              >
                <Text
                  style={[
                    styles.detailLabel,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Manufacturer
                </Text>

                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  {manufacturer}
                </Text>
              </View>
            </>
          )}

          {dosage && (
            <>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor:
                      colors.border,
                  },
                ]}
              />

              <View
                style={styles.detailRow}
              >
                <Text
                  style={[
                    styles.detailLabel,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Dosage / Strength
                </Text>

                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  {dosage}
                </Text>
              </View>
            </>
          )}

          {expiryDate && (
            <>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor:
                      colors.border,
                  },
                ]}
              />

              <View
                style={styles.detailRow}
              >
                <Text
                  style={[
                    styles.detailLabel,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Expiry Date
                </Text>

                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  {expiryDate}
                </Text>
              </View>
            </>
          )}

          {category && (
            <>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor:
                      colors.border,
                  },
                ]}
              />

              <View
                style={styles.detailRow}
              >
                <Text
                  style={[
                    styles.detailLabel,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Category
                </Text>

                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  {category}
                </Text>
              </View>
            </>
          )}

          <View
            style={[
              styles.divider,
              {
                backgroundColor:
                  colors.border,
              },
            ]}
          />

          <View
            style={styles.detailRow}
          >
            <Text
              style={[
                styles.detailLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Verification Status
            </Text>

            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    statusColor,
                },
              ]}
            >
              {isAuthentic
                ? 'Authentic'
                : isUncertain
                  ? 'Uncertain — Rescan Recommended'
                  : 'Anomoly Detected'}
            </Text>
          </View>
        </View>

        {/* SAVE */}

        <TouchableOpacity
          style={[
            styles.saveCabinetBtn,
            {
              backgroundColor:
                colors.primary,
            },
          ]}
          onPress={
            handleSaveToCabinet
          }
        >
          <Text
            style={styles.saveIcon}
          >
            +
          </Text>

          <Text
            style={[
              styles.saveCabinetBtnText,
              {
                color:
                  colors.white,
              },
            ]}
          >
            Save to My Cabinet
          </Text>
        </TouchableOpacity>

        {/* FULL DETAILS */}

        {onViewDetailsPress && (
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor:
                  colors.cardSecondary,

                borderColor:
                  colors.primaryLight,
              },
            ]}
            onPress={
              onViewDetailsPress
            }
          >
            <Text
              style={[
                styles.primaryBtnText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              View Full Details & Report
            </Text>

            <Text
              style={[
                styles.buttonArrow,
                {
                  color:
                    colors.primaryLight,
                },
              ]}
            >
              →
            </Text>
          </TouchableOpacity>
        )}

        {/* SCAN AGAIN */}

        {onScanAnotherPress && (
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                backgroundColor:
                  colors.card,

                borderColor:
                  colors.border,
              },
            ]}
            onPress={
              onScanAnotherPress
            }
          >
            <Text
              style={[
                styles.secondaryBtnText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Scan Another Medicine
            </Text>

            <Text
              style={[
                styles.secondaryArrow,
                {
                  color:
                    colors.primaryLight,
                },
              ]}
            >
              →
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * ------------------------------------------------------------
 * STATIC STYLES
 * ------------------------------------------------------------
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 64,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    paddingHorizontal: 18,

    borderBottomWidth: 1,
  },

  headerBackBtn: {
    flexDirection: 'row',

    alignItems: 'center',

    minWidth: 70,
  },

  backIcon: {
    fontSize: 32,

    lineHeight: 30,

    marginRight: 3,
  },

  backText: {
    fontSize: 14,

    fontWeight: '700',
  },

  headerTitle: {
    fontSize: 17,

    fontWeight: '800',
  },

  headerSpacer: {
    width: 70,
  },

  content: {
    padding: 18,

    paddingBottom: 40,
  },

  statusCard: {
    borderRadius: 20,

    padding: 24,

    alignItems: 'center',

    marginBottom: 18,

    borderWidth: 1,
  },

  statusIconContainer: {
    width: 64,

    height: 64,

    borderRadius: 32,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 14,
  },

  statusIcon: {
    fontSize: 34,

    fontWeight: '900',
  },

  statusTitle: {
    fontSize: 18,

    fontWeight: '900',

    letterSpacing: 0.5,

    textAlign: 'center',
  },

  statusSub: {
    fontSize: 12,

    textAlign: 'center',

    marginTop: 9,

    lineHeight: 18,
  },

  sectionCard: {
    borderRadius: 16,

    padding: 16,

    marginBottom: 18,

    borderWidth: 1,
  },

  sectionHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 15,
  },

  sectionIcon: {
    width: 38,

    height: 38,

    borderRadius: 11,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 11,
  },

  sectionIconText: {
    fontSize: 20,

    fontWeight: '800',
  },

  sectionTitle: {
    fontSize: 15,

    fontWeight: '800',
  },

  sectionSubtitle: {
    fontSize: 11,

    marginTop: 2,
  },

  langToggleRow: {
    flexDirection: 'row',

    marginBottom: 12,
  },

  langBtn: {
    flex: 1,

    paddingVertical: 10,

    borderRadius: 9,

    alignItems: 'center',

    marginHorizontal: 3,

    borderWidth: 1,
  },

  langBtnText: {
    fontSize: 12,

    fontWeight: '700',
  },

  speechActionRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  playVoiceBtn: {
    flex: 1,

    flexDirection: 'row',

    paddingVertical: 13,

    borderRadius: 11,

    alignItems: 'center',

    justifyContent: 'center',
  },

  playIcon: {
    color: '#FFFFFF',

    fontSize: 13,

    marginRight: 8,

    fontWeight: '900',
  },

  playVoiceBtnText: {
    fontSize: 14,

    fontWeight: '800',
  },

  repeatIconBtn: {
    width: 48,

    height: 48,

    borderRadius: 11,

    marginLeft: 8,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,
  },

  repeatIconText: {
    fontSize: 25,

    fontWeight: '700',
  },

  detailsHeading: {
    fontSize: 15,

    fontWeight: '800',

    marginBottom: 12,
  },

  detailRow: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    paddingVertical: 8,
  },

  detailLabel: {
    fontSize: 12,
  },

  detailValue: {
    fontSize: 12,

    fontWeight: '700',

    maxWidth: '55%',

    textAlign: 'right',
  },

  divider: {
    height: 1,
  },

  saveCabinetBtn: {
    paddingVertical: 13,

    borderRadius: 11,

    alignItems: 'center',

    justifyContent: 'center',

    flexDirection: 'row',

    marginBottom: 10,
  },

  saveIcon: {
    color: '#FFFFFF',

    fontSize: 22,

    fontWeight: '500',

    marginRight: 8,
  },

  saveCabinetBtnText: {
    fontWeight: '800',

    fontSize: 14,
  },

  primaryBtn: {
    borderWidth: 1,

    paddingVertical: 13,

    borderRadius: 11,

    alignItems: 'center',

    justifyContent: 'center',

    flexDirection: 'row',

    marginBottom: 10,
  },

  primaryBtnText: {
    fontWeight: '700',

    fontSize: 14,
  },

  buttonArrow: {
    fontSize: 18,

    marginLeft: 8,

    fontWeight: '700',
  },

  secondaryBtn: {
    paddingVertical: 13,

    borderRadius: 11,

    alignItems: 'center',

    justifyContent: 'center',

    flexDirection: 'row',

    borderWidth: 1,
  },

  secondaryBtnText: {
    fontWeight: '700',

    fontSize: 14,
  },

  secondaryArrow: {
    fontSize: 18,

    marginLeft: 8,

    fontWeight: '700',
  },
});
