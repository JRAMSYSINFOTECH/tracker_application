import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  theme: typeof lightTheme;
};

export const lightTheme = {
  isDark: false,
  bg: '#fafafa',
  cardBg: '#fff',
  text: '#111',
  subText: '#555',
  border: '#eee',
  inputBg: '#f5f5f5',
  headerBg: '#fff',
  sectionTitle: '#888',
  itemBg: '#fff',
  iconColor: '#444',
  switchTrackOff: '#ddd',
  switchTrackOn: '#c68be9',
  statCardTotal: '#1a1a2e',
  statCardCompleted: '#1a472a',
  statCardPending: '#5a2d00',
  statCardMissed: '#5a0a0a',
};

export const darkTheme = {
  isDark: true,
  bg: '#0f0f1a',
  cardBg: '#1e1e2e',
  text: '#f0f0f0',
  subText: '#aaa',
  border: '#333',
  inputBg: '#2a2a3a',
  headerBg: '#1a1a2a',
  sectionTitle: '#999',
  itemBg: '#1e1e2e',
  iconColor: '#bbb',
  switchTrackOff: '#444',
  switchTrackOn: '#c68be9',
  statCardTotal: '#2a2a4a',
  statCardCompleted: '#1a3a28',
  statCardPending: '#3a2000',
  statCardMissed: '#3a0a0a',
};

const DARK_MODE_KEY = 'dark_mode_enabled';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load saved preference
    AsyncStorage.getItem(DARK_MODE_KEY).then((val) => {
      if (val === 'true') setIsDarkMode(true);
    });
  }, []);

  const toggleDarkMode = async () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    await AsyncStorage.setItem(DARK_MODE_KEY, String(newVal));
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
