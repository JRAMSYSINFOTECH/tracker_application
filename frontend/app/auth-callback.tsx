import { useLocalSearchParams, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { setAuthToken } from '../services/api';

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function AuthCallbackScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const params = useLocalSearchParams<{
    token?: string | string[];
  }>();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const token = firstParam(params.token);

    // ⛑️ CRITICAL: defer navigation
    const timeout = setTimeout(() => {
      if (token) {
        setAuthToken(token);
        router.replace('/(tabs)');
      } else {
        router.replace('/login?googleError=Google%20login%20failed');
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [params.token, rootNavigationState?.key, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#111" />
      <Text style={styles.text}>Completing Google login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },

  text: {
    marginTop: 14,
    color: '#111',
    fontSize: 15,
  },
});
