import Constants from 'expo-constants';
import { Platform } from 'react-native';

declare const process: {
  env?: Record<string, string | undefined>;
};

const API_PORT = '5000';

const getExpoHost = () => {
  const constants = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };

  const hostUri =
    constants.expoConfig?.hostUri ||
    constants.manifest2?.extra?.expoClient?.hostUri;

  return hostUri?.split(':')[0];
};

const getLocalApiUrl = () => {
  const expoHost = getExpoHost();

  if (expoHost) {
    return `http://${expoHost}:${API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
};

export const API_URL = process.env?.EXPO_PUBLIC_API_URL || getLocalApiUrl();
export const GOOGLE_AUTH_URL = `${API_URL}/auth/google`;