import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
import { colors } from '../constants/src/theme/colors';
import { commonStyles } from '../constants/src/theme/commonStyles';
import { authApi, getApiErrorMessage, setAuthToken } from '../services/api';
import { startGoogleAuth } from '../services/googleAuth';

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    googleError?: string | string[];
  }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const googleError = firstParam(params.googleError);

    if (googleError) {
      setError(googleError);
    }
  }, [params.googleError]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill all fields');
      return;
    }

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await authApi.login({
        email: email.trim(),
        password,
      });

      setAuthToken(response.token);
      router.replace('/(tabs)');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleSubmitting(true);

    try {
      await startGoogleAuth();
    } catch {
      setError('Could not open Google login. Please try again.');
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <View style={commonStyles.screen}>
      <TopCurve />

      <View style={styles.content}>
        {/* Back Button - optional, first screen aithe remove cheyyachu */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Login</Text>

        <View style={styles.accountRow}>
          <Text style={styles.accountText}>{"Don't have an account? "}</Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.link}>SignUp</Text>
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
            style={{ marginBottom: 20 }}
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
              style={styles.passwordInput}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity>
            <Text style={styles.forgot}>Forgot Password ?</Text>
          </TouchableOpacity>

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

          <AppButton
            title={isSubmitting ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            disabled={isSubmitting}
            style={{ marginTop: 20, marginBottom: 25 }}
          />

          <OrDivider />

          <TouchableOpacity
            style={[styles.googleButton, isGoogleSubmitting && styles.disabledButton]}
            onPress={handleGoogleLogin}
            disabled={isGoogleSubmitting}
          >
            <Image
              source={require('../assets/images/google-logo.png')}
              style={styles.googleLogo}
            />
            <Text style={styles.googleText}>
              {isGoogleSubmitting ? 'Opening Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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

  disabledButton: {
    opacity: 0.65,
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
