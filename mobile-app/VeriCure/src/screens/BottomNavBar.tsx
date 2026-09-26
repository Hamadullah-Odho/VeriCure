import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'home' | 'insights' | 'profile';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: {
  key: Tab;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: 'home',
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  {
    key: 'insights',
    label: 'Insights',
    activeIcon: 'stats-chart',
    inactiveIcon: 'stats-chart-outline',
  },
  {
    key: 'profile',
    label: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
];

export default function BottomNavBar({
  activeTab,
  onTabChange,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const activeIndex = TABS.findIndex(
    (tab) => tab.key === activeTab
  );

  /*
   * The floating pill's inner width isn't known until it's
   * actually laid out on screen, so the sliding indicator
   * waits for onLayout before it can compute each tab's slot
   * width and position itself correctly.
   */

  const [barWidth, setBarWidth] =
    useState(0);

  const indicatorAnim =
    useRef(
      new Animated.Value(
        activeIndex >= 0 ? activeIndex : 0
      )
    ).current;

  useEffect(() => {

    if (activeIndex < 0) {
      return;
    }

    Animated.timing(
      indicatorAnim,
      {
        toValue: activeIndex,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }
    ).start();

  }, [activeIndex]);

  const handleLayout = (
    event: LayoutChangeEvent
  ) => {
    setBarWidth(
      event.nativeEvent.layout.width
    );
  };

  const tabWidth =
    barWidth > 0
      ? barWidth / TABS.length
      : 0;

  const indicatorTranslateX =
    indicatorAnim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [
        0,
        tabWidth,
        tabWidth * 2,
      ],
    });

  return (
    <View
      style={[
        styles.floatingWrapper,
        {
          bottom: insets.bottom + 12,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.shadowWrapper,
          {
            shadowColor: colors.black,
          },
        ]}
      >
        <View
          onLayout={handleLayout}
          style={[
            styles.navBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >

          {/* =================================================
              SLIDING ACTIVE-TAB INDICATOR
          ================================================= */}

          {tabWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                {
                  width: tabWidth,
                  backgroundColor: colors.primary,
                  transform: [
                    {
                      translateX:
                        indicatorTranslateX,
                    },
                  ],
                },
              ]}
            />
          )}

          {/* =================================================
              TABS
          ================================================= */}

          {TABS.map((tab) => {
            const isActive =
              tab.key === activeTab;

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.navItem}
                onPress={() =>
                  onTabChange(tab.key)
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name={
                    isActive
                      ? tab.activeIcon
                      : tab.inactiveIcon
                  }
                  size={20}
                  color={
                    isActive
                      ? colors.background
                      : colors.textSecondary
                  }
                />

                <Text
                  style={[
                    styles.navText,
                    {
                      color: isActive
                        ? colors.background
                        : colors.textSecondary,
                    },
                    isActive && styles.activeText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /*
   * Floats above the screen content instead of docking to
   * the bottom edge — matches a rounded, "island" style nav
   * bar rather than a full-width bottom bar.
   */
  floatingWrapper: {
    position: 'absolute',

    left: 0,
    right: 0,
    bottom: 12,

    alignItems: 'center',

    zIndex: 999,
  },

  /*
   * Shadow lives on its own wrapper, separate from the view
   * that clips its content with overflow: 'hidden' — putting
   * both on the same view suppresses the shadow on iOS.
   */
  shadowWrapper: {
    width: '88%',
    maxWidth: 520,
    borderRadius: 32,

    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.22,
    shadowRadius: 16,

    elevation: 10,
  },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',

    height: 64,

    borderRadius: 32,
    borderWidth: 1,

    overflow: 'hidden',
  },

  indicator: {
    position: 'absolute',

    top: 6,
    bottom: 6,

    borderRadius: 26,
  },

  navItem: {
    flex: 1,
    height: '100%',

    alignItems: 'center',
    justifyContent: 'center',
  },

  navText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },

  activeText: {
    fontWeight: '800',
  },
});
