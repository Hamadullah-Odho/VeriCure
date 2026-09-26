import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

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
  email: string;
  isGuest?: boolean;
  onBackPress: () => void;
  onScanComplete: (result: any) => void;
  onGalleryUpload?: () => void;

  /*
   * 'verify' (default): the normal full flow — runs the
   * counterfeit-check model AND Gemini extraction, saves to
   * history.
   * 'cabinet': used by the Medicine Cabinet's "Add Medicine"
   * flow — runs ONLY Gemini extraction (no authenticity
   * check, nothing saved here), then hands the extracted
   * fields to onExtractComplete so the user can review/edit
   * them (especially expiry date, which Gemini may not
   * always find) before actually saving to the cabinet.
   */
  mode?: 'verify' | 'cabinet';
  onExtractComplete?: (details: any) => void;
}

type ScanStep = 'FRONT' | 'BACK';

// Converts a local Expo image URI into a Blob that React Native's
// FormData implementation can upload reliably.
const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(
      `Unable to read selected image (${response.status})`,
    );
  }

  return await response.blob();
};

export default function ScanScreen({
  email,
  isGuest = false,
  onBackPress,
  onScanComplete,
  onGalleryUpload,
  mode = 'verify',
  onExtractComplete,
}: Props) {
  /* ============================================================
     THEME
  ============================================================ */

  const { colors } = useTheme();
  const styles = createStyles(colors);

  /* ============================================================
     STATE
  ============================================================ */

  const [permission, requestPermission] =
    useCameraPermissions();

  const [currentStep, setCurrentStep] =
    useState<ScanStep>('FRONT');

  const [frontImageUri, setFrontImageUri] =
    useState<string | null>(null);

  const [backImageUri, setBackImageUri] =
    useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const cameraRef = useRef<any>(null);

  const scanAnim = useRef(
    new Animated.Value(0),
  ).current;

  /* ============================================================
     SCANNER ANIMATION
  ============================================================ */

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),

        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [scanAnim]);

  /* ============================================================
     CAMERA PERMISSION
  ============================================================ */

  if (!permission) {
    return (
      <View style={styles.container} />
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        style={styles.permissionContainer}
      >
        <View style={styles.permissionIcon}>
          <Ionicons
            name="camera-outline"
            size={38}
            color={colors.primary}
          />
        </View>

        <Text style={styles.permissionTitle}>
          Camera Permission Required
        </Text>

        <Text style={styles.permissionSub}>
          VeriCure needs access to your camera to
          scan the medicine packaging.
        </Text>

        <TouchableOpacity
          style={styles.permBtn}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Ionicons
            name="camera"
            size={19}
            color={colors.white}
          />

          <Text style={styles.permBtnText}>
            Grant Camera Permission
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={onBackPress}
        >
          <Ionicons
            name="arrow-back"
            size={17}
            color={colors.textSecondary}
          />

          <Text style={styles.backLinkText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /* ============================================================
     CAMERA CAPTURE
  ============================================================ */

  const handleCapture = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      const photo =
        await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });

      if (photo?.uri) {
        handleImageCaptured(photo.uri);
      }
    } catch (error) {
      Alert.alert(
        'Capture Error',
        'Failed to capture image. Please try again.',
      );
    }
  };

  /* ============================================================
     GALLERY
  ============================================================ */

  const handlePickFromGallery = async () => {
    if (onGalleryUpload) {
      onGalleryUpload();
    }

    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {
        handleImageCaptured(
          result.assets[0].uri,
        );
      }
    } catch (error) {
      Alert.alert(
        'Gallery Error',
        'Failed to select an image from your gallery.',
      );
    }
  };

  /* ============================================================
     HANDLE IMAGE
  ============================================================ */

  const handleImageCaptured = (
    uri: string,
  ) => {
    if (currentStep === 'FRONT') {
      setFrontImageUri(uri);
      setCurrentStep('BACK');
    } else {
      setBackImageUri(uri);
      setIsModalVisible(true);
    }
  };

  /* ============================================================
     FINAL SUBMIT
  ============================================================ */

  const handleFinalSubmit = async () => {
    if (!frontImageUri || !backImageUri) {
      Alert.alert(
        'Missing Images',
        'Both front and back images are required.',
      );
      return;
    }

    /*
     * Cabinet mode: skip the counterfeit-check pipeline
     * entirely (no email/location needed either — this is
     * purely "read the packaging" enrichment, not a scan
     * that gets saved to verification history).
     */
    if (mode === 'cabinet') {

      if (isSubmitting) {
        return;
      }

      try {
        setIsSubmitting(true);

        const formData = new FormData();

        const frontBlob = await uriToBlob(frontImageUri);
        const backBlob = await uriToBlob(backImageUri);

        formData.append('front', frontBlob, 'front.jpg');
        formData.append('back', backBlob, 'back.jpg');

        const response = await fetch(
          API_BASE_URL + '/api/verification/extract-details',
          {
            method: 'POST',
            // Do not set Content-Type manually. fetch adds the correct
            // multipart boundary automatically.
            body: formData,
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          Alert.alert(
            'Extraction Failed',
            data.message ||
              'Unable to read details from these images. You can still add the medicine manually.',
          );
          onExtractComplete?.({});
          return;
        }

        onExtractComplete?.(data.details || {});

      } catch (error) {
        console.log('Extract details error:', error);

        Alert.alert(
          'Connection Error',
          'Unable to connect to the VeriCure server. You can still add the medicine manually.',
        );

        onExtractComplete?.({});

      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    /*
     * Guests skip the account check entirely — the
     * /scan-guest endpoint doesn't require (or accept)
     * an email, so there's no session to validate.
     */

    const normalizedEmail =
      typeof email === 'string'
        ? email.trim().toLowerCase()
        : '';

    if (!isGuest && !normalizedEmail) {
      Alert.alert(
        'Session Error',
        'We could not find your logged-in account. Please log out and log back in.',
      );
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();

      if (!isGuest) {
        formData.append(
          'email',
          normalizedEmail,
        );

        /*
         * Location is best-effort enrichment for the future
         * admin counterfeit-tracking dashboard — never blocks
         * or fails the scan itself. Denied permission, GPS
         * off, indoor signal loss, or a timeout all just mean
         * this scan is saved with no location, same as any
         * scan taken before this feature existed. Guests are
         * skipped entirely since their scans are never
         * persisted, so there'd be nothing to attach it to.
         */
        try {
          const { status } =
            await Location.requestForegroundPermissionsAsync();

          if (status === 'granted') {
            const position =
              await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });

            formData.append(
              'latitude',
              String(position.coords.latitude),
            );

            formData.append(
              'longitude',
              String(position.coords.longitude),
            );
          }
        } catch (locationError) {
          console.log(
            'Location unavailable for this scan (continuing without it):',
            locationError,
          );
        }
      }

      const frontBlob = await uriToBlob(frontImageUri);
      const backBlob = await uriToBlob(backImageUri);

      formData.append('front', frontBlob, 'front.jpg');
      formData.append('back', backBlob, 'back.jpg');

      console.log(
        isGuest
          ? 'Uploading guest scan for verification...'
          : 'Uploading scan for verification...',
      );

      const response =
        await fetch(
          API_BASE_URL +
            (isGuest
              ? '/api/verification/scan-guest'
              : '/api/verification/scan'),
          {
            method: 'POST',
            // Do not set Content-Type manually. fetch adds the multipart
            // boundary required by the server.
            body: formData,
          },
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
        'Verification response:',
        data,
      );

      if (!response.ok || !data || !data.success) {

        const message =
          data &&
          typeof data.message === 'string'
            ? data.message
            : 'Unable to verify this medicine. Please try again.';

        Alert.alert(
          'Verification Failed',
          message,
        );

        return;
      }

      setIsModalVisible(false);

      /*
       * Map backend response into the shape the
       * result / detail screens expect.
       */

      onScanComplete({
        name: data.medicineName || 'Unknown Medicine',
        frontImage: frontImageUri,
        backImage: backImageUri,

        verdict: data.verdict,
        isAuthentic: data.verdict === 'Genuine',

        // Set only when the backend's is-medicine gate rejected
        // the image before running the model/Gemini extraction
        // pipeline on it. The result screen uses this to show a
        // distinct "please scan again" message instead of the
        // generic low-confidence "Unknown" copy.
        notMedicine: data.notMedicine === true,
        message: data.message,

        front: data.front,
        back: data.back,

        // Gemini-extracted packaging details (may have
        // null fields if extraction couldn't read them)
        manufacturer: data.details?.manufacturer,
        dosage: data.details?.dosage,
        batchNumber: data.details?.batchNumber,
        expiryDate: data.details?.expiryDate,
        category: data.details?.category,
        description: data.details?.description,

        scanId: data.scanId,
      });

    } catch (error) {

      console.log(
        'Verification error:',
        error,
      );

      Alert.alert(
        'Error',
        'Unable to connect to the server. Please check your connection and try again.',
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  /* ============================================================
     SCAN LINE
  ============================================================ */

  const translateY =
    scanAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 170],
    });

  const isFront =
    currentStep === 'FRONT';

  /* ============================================================
     UI
  ============================================================ */

  return (
    <SafeAreaView style={styles.container}>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <View style={styles.header}>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onBackPress}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={colors.primary}
          />

          <Text style={styles.backText}>
            Back
          </Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>

          <Text style={styles.headerTitle}>
            {mode === 'cabinet'
              ? 'Add Medicine'
              : 'Verify Medicine'}
          </Text>

          <Text style={styles.headerStep}>
            {isFront
              ? 'Step 1 of 2 • Front Side'
              : 'Step 2 of 2 • Back Side'}
          </Text>

        </View>

        <View style={styles.headerSpacer} />

      </View>

      {/* ======================================================
          CAMERA
      ====================================================== */}

      <View style={styles.cameraWrapper}>

        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
        />

        <View style={styles.overlayContainer}>

          {/* TOP OVERLAY */}

          <View style={styles.overlayTop} />

          {/* SCANNER ROW */}

          <View style={styles.overlayMiddleRow}>

            <View style={styles.overlaySide} />

            <View style={styles.scannerFrame}>

              <View
                style={[
                  styles.corner,
                  styles.topLeft,
                ]}
              />

              <View
                style={[
                  styles.corner,
                  styles.topRight,
                ]}
              />

              <View
                style={[
                  styles.corner,
                  styles.bottomLeft,
                ]}
              />

              <View
                style={[
                  styles.corner,
                  styles.bottomRight,
                ]}
              />

              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY,
                      },
                    ],
                  },
                ]}
              />

            </View>

            <View style={styles.overlaySide} />

          </View>

          {/* ==================================================
              BOTTOM CONTENT
          ================================================== */}

          <View style={styles.overlayBottom}>

            <Text style={styles.instructionTitle}>
              {isFront
                ? 'Align the front of the medicine box'
                : 'Align the back of the medicine box'}
            </Text>

            <Text style={styles.instructionSub}>
              Keep the entire package inside the frame
            </Text>

            {/* CAPTURE TIP */}

            <View style={styles.tipContainer}>

              <View style={styles.tipIcon}>

                <Ionicons
                  name="bulb-outline"
                  size={18}
                  color={colors.primary}
                />

              </View>

              <View style={styles.tipTextContainer}>

                <Text style={styles.tipTitle}>
                  Capture Tip
                </Text>

                <Text style={styles.tipText}>
                  Hold your phone steady, use good
                  lighting, and make sure the text
                  and medicine packaging are clearly
                  visible.
                </Text>

              </View>

            </View>

            {/* STEP INDICATOR */}

            <View style={styles.progressContainer}>

              <View
                style={[
                  styles.progressDot,
                  styles.progressActive,
                ]}
              />

              <View
                style={[
                  styles.progressLine,
                  !isFront &&
                    styles.progressLineActive,
                ]}
              />

              <View
                style={[
                  styles.progressDot,
                  !isFront &&
                    styles.progressActive,
                ]}
              />

            </View>

            <Text style={styles.stepText}>
              {isFront
                ? 'Front side'
                : 'Back side'}
            </Text>

            {/* BUTTONS */}

            <View style={styles.buttonRow}>

              {/* CAPTURE */}

              <TouchableOpacity
                style={styles.captureBtn}
                onPress={handleCapture}
                activeOpacity={0.8}
              >

                <Ionicons
                  name="camera"
                  size={20}
                  color={colors.white}
                />

                <Text style={styles.captureBtnText}>
                  {isFront
                    ? 'Capture Front'
                    : 'Capture Back'}
                </Text>

              </TouchableOpacity>

              {/* GALLERY */}

              <TouchableOpacity
                style={styles.galleryBtn}
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
              >

                <Ionicons
                  name="images-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text style={styles.galleryBtnText}>
                  Gallery
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </View>

      {/* ======================================================
          MEDICINE NAME MODAL
      ====================================================== */}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setIsModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modalContent}>

            <View style={styles.modalIconContainer}>

              <Ionicons
                name="medical-outline"
                size={28}
                color={colors.primary}
              />

            </View>

            <Text style={styles.modalTitle}>
              {mode === 'cabinet'
                ? 'Ready to Add'
                : 'Ready to Verify'}
            </Text>

            <Text style={styles.modalSub}>
              {mode === 'cabinet'
                ? "We'll read the medicine's details from both images — you can edit anything afterward."
                : "We'll check both images and identify the medicine automatically."}
            </Text>

            <TouchableOpacity
              style={[
                styles.verifyModalBtn,
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleFinalSubmit}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >

              {isSubmitting ? (
                <ActivityIndicator
                  size="small"
                  color={colors.white}
                />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={19}
                  color={colors.white}
                />
              )}

              <Text style={styles.verifyModalBtnText}>
                {isSubmitting
                  ? (mode === 'cabinet' ? 'Reading...' : 'Verifying...')
                  : (mode === 'cabinet' ? 'Add Medicine' : 'Verify Medicine')}
              </Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() =>
                setIsModalVisible(false)
              }
              disabled={isSubmitting}
            >

              <Text style={styles.cancelBtnText}>
                Cancel
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </SafeAreaView>
  );
}


/* ================================================================
   THEME-AWARE STYLES

   IMPORTANT:
   Only uses properties that ALREADY EXIST in your colors.ts.
================================================================ */

const createStyles = (colors: any) =>
  StyleSheet.create({

    /* ============================================================
       CONTAINER
    ============================================================ */

    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    /* ============================================================
       HEADER
    ============================================================ */

    header: {
      height: 64,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',

      paddingHorizontal: 16,

      backgroundColor: colors.background,

      borderBottomWidth: 1,
      borderBottomColor: colors.border,

      zIndex: 10,
    },

    headerBtn: {
      flexDirection: 'row',
      alignItems: 'center',

      paddingVertical: 8,
      paddingRight: 10,
    },

    backText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
      marginLeft: 5,
    },

    headerCenter: {
      alignItems: 'center',
    },

    headerTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },

    headerStep: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 2,
    },

    headerSpacer: {
      width: 55,
    },

    /* ============================================================
       CAMERA
    ============================================================ */

    cameraWrapper: {
      flex: 1,
      position: 'relative',
      backgroundColor: colors.black,
    },

    overlayContainer: {
      flex: 1,
    },

    /*
      Your colors.ts doesn't have cameraOverlay,
      so we use the existing overlay color.
    */

    overlayTop: {
      flex: 1,
      backgroundColor: colors.overlay,
    },

    overlayMiddleRow: {
      flexDirection: 'row',
      height: 190,
    },

    overlaySide: {
      flex: 1,
      backgroundColor: colors.overlay,
    },

    scannerFrame: {
      width: 310,
      height: 190,

      backgroundColor: 'transparent',

      position: 'relative',
      overflow: 'hidden',
    },

    /* ============================================================
       SCANNER CORNERS
    ============================================================ */

    corner: {
      position: 'absolute',

      width: 25,
      height: 25,

      borderColor: colors.primary,
    },

    topLeft: {
      top: 0,
      left: 0,

      borderTopWidth: 4,
      borderLeftWidth: 4,

      borderTopLeftRadius: 10,
    },

    topRight: {
      top: 0,
      right: 0,

      borderTopWidth: 4,
      borderRightWidth: 4,

      borderTopRightRadius: 10,
    },

    bottomLeft: {
      bottom: 0,
      left: 0,

      borderBottomWidth: 4,
      borderLeftWidth: 4,

      borderBottomLeftRadius: 10,
    },

    bottomRight: {
      bottom: 0,
      right: 0,

      borderBottomWidth: 4,
      borderRightWidth: 4,

      borderBottomRightRadius: 10,
    },

    scanLine: {
      width: '100%',
      height: 3,

      backgroundColor: colors.primary,

      shadowColor: colors.primary,

      shadowOffset: {
        width: 0,
        height: 0,
      },

      shadowOpacity: 0.9,
      shadowRadius: 8,

      elevation: 6,
    },

    /* ============================================================
       BOTTOM
    ============================================================ */

    /*
      Your colors.ts doesn't have cameraBottomOverlay.
      We use the existing cardSecondary color here.
    */

    overlayBottom: {
      flex: 1.3,

      backgroundColor: colors.cardSecondary,

      alignItems: 'center',

      paddingTop: 16,
      paddingHorizontal: 18,
    },

    instructionTitle: {
      color: colors.text,

      fontSize: 14,
      fontWeight: '800',

      textAlign: 'center',
    },

    instructionSub: {
      color: colors.textSecondary,

      fontSize: 11,

      textAlign: 'center',

      marginTop: 4,
    },

    /* ============================================================
       CAPTURE TIP
    ============================================================ */

    tipContainer: {
      width: '100%',

      flexDirection: 'row',
      alignItems: 'center',

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 14,

      padding: 10,

      marginTop: 12,
    },

    tipIcon: {
      width: 34,
      height: 34,

      borderRadius: 10,

      backgroundColor: colors.iconBackground,

      justifyContent: 'center',
      alignItems: 'center',

      marginRight: 9,
    },

    tipTextContainer: {
      flex: 1,
    },

    tipTitle: {
      color: colors.primary,

      fontSize: 11,
      fontWeight: '800',

      marginBottom: 2,
    },

    tipText: {
      color: colors.textSecondary,

      fontSize: 10,

      lineHeight: 14,
    },

    /* ============================================================
       PROGRESS
    ============================================================ */

    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',

      marginTop: 13,
    },

    progressDot: {
      width: 9,
      height: 9,

      borderRadius: 5,

      backgroundColor: colors.textMuted,
    },

    progressActive: {
      backgroundColor: colors.primary,
    },

    progressLine: {
      width: 45,
      height: 2,

      backgroundColor: colors.textMuted,

      marginHorizontal: 5,
    },

    progressLineActive: {
      backgroundColor: colors.primary,
    },

    stepText: {
      color: colors.textMuted,

      fontSize: 9,

      marginTop: 3,

      fontWeight: '600',
    },

    /* ============================================================
       BUTTONS
    ============================================================ */

    buttonRow: {
      flexDirection: 'row',

      marginTop: 12,

      gap: 10,
    },

    captureBtn: {
      backgroundColor: colors.primary,

      paddingVertical: 12,
      paddingHorizontal: 20,

      borderRadius: 12,

      alignItems: 'center',
      justifyContent: 'center',

      flexDirection: 'row',
    },

    captureBtnText: {
      color: colors.white,

      fontWeight: '800',
      fontSize: 13,

      marginLeft: 7,
    },

    galleryBtn: {
      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.primary,

      paddingVertical: 12,
      paddingHorizontal: 18,

      borderRadius: 12,

      alignItems: 'center',
      justifyContent: 'center',

      flexDirection: 'row',
    },

    galleryBtnText: {
      color: colors.primary,

      fontWeight: '800',
      fontSize: 13,

      marginLeft: 7,
    },

    /* ============================================================
       PERMISSION
    ============================================================ */

    permissionContainer: {
      flex: 1,

      backgroundColor: colors.background,

      justifyContent: 'center',
      alignItems: 'center',

      padding: 24,
    },

    permissionIcon: {
      width: 72,
      height: 72,

      borderRadius: 22,

      backgroundColor: colors.iconBackground,

      justifyContent: 'center',
      alignItems: 'center',

      marginBottom: 18,
    },

    permissionTitle: {
      fontSize: 20,
      fontWeight: '800',

      color: colors.text,

      marginBottom: 10,

      textAlign: 'center',
    },

    permissionSub: {
      fontSize: 14,

      color: colors.textSecondary,

      textAlign: 'center',

      lineHeight: 20,

      marginBottom: 24,
    },

    permBtn: {
      backgroundColor: colors.primary,

      paddingHorizontal: 24,
      paddingVertical: 13,

      borderRadius: 12,

      flexDirection: 'row',
      alignItems: 'center',
    },

    permBtnText: {
      color: colors.white,

      fontWeight: '700',
      fontSize: 14,

      marginLeft: 8,
    },

    backLink: {
      marginTop: 18,

      flexDirection: 'row',
      alignItems: 'center',
    },

    backLinkText: {
      color: colors.textSecondary,

      fontSize: 14,

      marginLeft: 5,
    },

    /* ============================================================
       MODAL
    ============================================================ */

    modalOverlay: {
      flex: 1,

      /*
        Existing colors.ts has overlay.
        No new color property required.
      */
      backgroundColor: colors.overlay,

      justifyContent: 'center',
      alignItems: 'center',

      padding: 20,
    },

    modalContent: {
      width: '90%',

      backgroundColor: colors.card,

      borderRadius: 22,

      padding: 24,

      borderWidth: 1,
      borderColor: colors.border,
    },

    modalIconContainer: {
      width: 54,
      height: 54,

      borderRadius: 16,

      backgroundColor: colors.iconBackground,

      justifyContent: 'center',
      alignItems: 'center',

      marginBottom: 14,
    },

    modalTitle: {
      fontSize: 20,
      fontWeight: '800',

      color: colors.text,

      marginBottom: 6,
    },

    modalSub: {
      fontSize: 13,

      color: colors.textSecondary,

      lineHeight: 18,

      marginBottom: 17,
    },

    textInput: {
      backgroundColor: colors.inputBackground,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 12,

      paddingHorizontal: 14,
      paddingVertical: 12,

      color: colors.text,

      fontSize: 15,

      marginBottom: 16,
    },

    verifyModalBtn: {
      backgroundColor: colors.primary,

      paddingVertical: 13,

      borderRadius: 12,

      alignItems: 'center',
      justifyContent: 'center',

      flexDirection: 'row',
    },

    verifyModalBtnText: {
      color: colors.white,

      fontWeight: '800',
      fontSize: 14,

      marginLeft: 7,
    },

    cancelBtn: {
      alignItems: 'center',

      paddingVertical: 12,

      marginTop: 4,
    },

    cancelBtnText: {
      color: colors.textSecondary,

      fontSize: 13,

      fontWeight: '600',
    },

  });