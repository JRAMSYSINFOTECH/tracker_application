import { Linking, Platform } from 'react-native';

import { GOOGLE_AUTH_URL } from '../constants/api';



const getGoogleAuthUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set('returnUrl', window.location.origin);
    return url.toString();
  }

  return GOOGLE_AUTH_URL;
};

export const startGoogleAuth = async () => {
  const authUrl = getGoogleAuthUrl();

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = authUrl;
    return;
  }

  await Linking.openURL(authUrl);
};
