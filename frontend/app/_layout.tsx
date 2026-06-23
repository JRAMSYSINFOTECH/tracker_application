import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../constants/src/context/AuthContext';
import { TaskProvider } from '../constants/src/context/TaskContext';
import { ThemeProvider } from '../constants/src/context/ThemeContext';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../services/notificationService';

function RootNavigator() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#d14df0" />
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

export default function RootLayout() {

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <RootNavigator />
          <StatusBar hidden />
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}