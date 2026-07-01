import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppButton from '../constants/src/components/AppButton';
import AppInput from '../constants/src/components/AppInput';
import OrDivider from '../constants/src/components/OrDivider';
import TopCurve from '../constants/src/components/TopCurve';
import { useAuth } from '../constants/src/context/AuthContext';
import { colors } from '../constants/src/theme/colors';
import { commonStyles } from '../constants/src/theme/commonStyles';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const {
    login,
    googleLogin,
    loading,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '446093814127-g4cik9l3bnt2mo88mbdiijpr37etr414.apps.googleusercontent.com',
    webClientId: '446093814127-g4cik9l3bnt2mo88mbdiijpr37etr414.apps.googleusercontent.com',
    androidClientId: '446093814127-g4cik9l3bnt2mo88mbdiijpr37etr414.apps.googleusercontent.com',
    redirectUri: 'https://auth.expo.io/@jramsys/Intern',
  }, {
    projectNameForProxy: '@jramsys/Intern'
  } as any);

  useEffect(() => {
    if (request) {
      console.log('Google Auth Request Redirect URI:', request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    const signInWithGoogle = async () => {
      if (response?.type === 'success') {
        try {
          const accessToken = response.authentication?.accessToken;
          const userInfoResponse = await fetch(
            'https://www.googleapis.com/userinfo/v2/me',
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const userInfo = await userInfoResponse.json();
          const result = await googleLogin(
            userInfo.email,
            userInfo.name,
            userInfo.id,
            userInfo.picture
          );

          if (result.success) {
            router.replace('/(tabs)/home');
          } else {
            setError(result.message || 'Google login failed');
          }
        } catch (error) {
          console.log(error);
          setError('Google login failed');
        }
      }
    };
    signInWithGoogle();
  }, [response, googleLogin, router]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const handleLogin = async () => {
    if (submitting) return;

    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError('Please fill all fields');
      return;
    }

    try {
      setSubmitting(true);

      const result = await login(normalizedEmail, normalizedPassword);

      if (!result.success) {
        setError(result.message || 'Login failed');
        return;
      }

      setEmail('');
      setPassword('');
      router.replace('/(tabs)/home');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.replace('/');
  };

  return (
    <View style={commonStyles.screen}>
      <TopCurve />

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          disabled={submitting}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Login</Text>

        <View style={styles.accountRow}>
          <Text style={styles.accountText}>{"Don't have an account? "}</Text>
          <TouchableOpacity
            onPress={() => router.replace('/signup')}
            disabled={submitting}
          >
            <Text style={styles.link}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <AppInput
            placeholder="Email"
            value={email}
            onChangeText={(text: string) => {
              setEmail(text);
              if (error) setError('');
            }}
            editable={!submitting}
            style={{ marginBottom: 20 }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordWrapper}>
            <AppInput
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text: string) => {
                setPassword(text);
                if (error) setError('');
              }}
              editable={!submitting}
              style={styles.passwordInput}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={submitting}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity disabled={submitting}>
            <Text style={styles.forgot}>Forgot Password ?</Text>
          </TouchableOpacity>

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

          <AppButton
            title={submitting ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            style={{
              marginTop: 20,
              marginBottom: 25,
              opacity: submitting ? 0.7 : 1,
            }}
            disabled={submitting}
          />

          <OrDivider />

          <TouchableOpacity style={styles.googleButton} disabled={!request || submitting} onPress={() => promptAsync()}>
            <Image
              source={require('../assets/images/google-logo.png')}
              style={styles.googleLogo}
            />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 100,
  },
  backButton: {
    width: 32,
    height: 32,
    borderWidth: 1.5,
    borderColor: '#111',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 22,
    color: '#111',
    lineHeight: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
  },
  accountRow: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  accountText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  link: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '500',
  },
  form: {},
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 10,
  },
  passwordInput: {
    paddingRight: 50,
    marginBottom: 0,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -11 }],
    zIndex: 10,
  },
  forgot: {
    color: colors.accent,
    marginBottom: 10,
    marginLeft: 5,
    fontSize: 15,
  },
  googleButton: {
    marginTop: 25,
    height: 55,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    width: 22,
    height: 22,
    marginRight: 10,
    resizeMode: 'contain',
  },
  googleText: {
    fontSize: 16,
    color: '#111',
  },
});
