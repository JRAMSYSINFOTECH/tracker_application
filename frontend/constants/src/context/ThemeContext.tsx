import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  isDark: false,

  bg: '#F9FAFB',
  cardBg: '#FFFFFF',
  text: '#1F2937',
  subText: '#6B7280',
  border: '#E5E7EB',
  inputBg: '#F8FAFC',
  headerBg: '#FFFFFF',
  sectionTitle: '#6B7280',
  itemBg: '#FFFFFF',
  iconColor: '#6B7280',
  mutedBg: '#F8FAFC',
  softPrimary: '#F1F5FF',
  softAccent: '#EFF6FF',
  topSurface: '#F8FAFC',
  activeBg: '#EEF2FF',
  activeText: '#3730A3',

  primary: '#6366F1',
  secondary: '#60A5FA',
  accent: '#93C5FD',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',

  switchTrackOff: '#D1D5DB',
  switchTrackOn: '#6366F1',

  statCardTotal: '#6366F1',
  statCardCompleted: '#60A5FA',
  statCardPending: '#FBBF24',
  statCardMissed: '#F87171',
  statCardProgress: '#22C55E',
};

export const darkTheme = {
  isDark: true,

  bg: '#0F172A',
  cardBg: '#1E293B',
  text: '#F8FAFC',
  subText: '#CBD5E1',
  border: '#334155',
  inputBg: '#111827',
  headerBg: '#1E293B',
  sectionTitle: '#CBD5E1',
  itemBg: '#1E293B',
  iconColor: '#E2E8F0',
  mutedBg: '#111827',
  softPrimary: '#1F2A5C',
  softAccent: '#102443',
  topSurface: '#0B1223',
  activeBg: '#E0E7FF',
  activeText: '#111827',

  primary: '#6366F1',
  secondary: '#3B82F6',
  accent: '#3B82F6',
  success: '#22C55E',
  warning: '#FBBF24',
  error: '#F87171',

  switchTrackOff: '#475569',
  switchTrackOn: '#6366F1',

  statCardTotal: '#6366F1',
  statCardCompleted: '#3B82F6',
  statCardPending: '#FBBF24',
  statCardMissed: '#F87171',
  statCardProgress: '#22C55E',
};

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  theme: typeof lightTheme;
};

const DARK_MODE_KEY = 'dark_mode_enabled';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const value = await AsyncStorage.getItem(DARK_MODE_KEY);
        if (value === 'true') {
          setIsDarkMode(true);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };

    loadTheme();
  }, []);

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem(DARK_MODE_KEY, String(newValue));
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
