import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill all fields');
      return;
    }

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    router.replace('/(tabs)');
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
          <Text style={styles.accountText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.link}>SignUp</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <AppInput
            placeholder="Email / Phone number"
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
            title="Login"
            onPress={handleLogin}
            style={{ marginTop: 20, marginBottom: 25 }}
          />

          <OrDivider />

          <TouchableOpacity style={styles.googleButton}>
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