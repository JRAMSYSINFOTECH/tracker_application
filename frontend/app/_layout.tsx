import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../constants/src/context/AuthContext';
import { TaskProvider } from '../constants/src/context/TaskContext';
import { ThemeProvider, useTheme } from '../constants/src/context/ThemeContext';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../services/notificationService';

function RootNavigator() {
  const { loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" />
    </Stack>
  );
}

function ThemedStatusBar() {
  const { isDarkMode } = useTheme();
  return <StatusBar style={isDarkMode ? 'light' : 'dark'} />;
}

export default function RootLayout() {

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <RootNavigator />
          <ThemedStatusBar />
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
