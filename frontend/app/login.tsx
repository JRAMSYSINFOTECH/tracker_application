// app/login.tsx

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

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    setError('');
    alert('Login Success (Demo)');
  };

  return (
    <View style={commonStyles.screen}>
      <TopCurve />

      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Login</Text>

        {/* Signup */}
        <View style={styles.accountRow}>
          <Text style={styles.accountText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.link}>SignUp</Text>
          </TouchableOpacity>
        </View>

        {/* Inputs */}
        <View style={styles.form}>
          <AppInput
            placeholder="Email / Phone number"
            value={email}
            onChangeText={setEmail}
            style={{ marginBottom: 20 }}
          />

          <AppInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{ marginBottom: 10 }}
          />

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
    paddingTop: 100, // 🔥 main alignment control
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

  form: {
    // 🔥 keeps everything grouped nicely
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
  },

  googleText: {
    fontSize: 16,
    color: '#111',
  },
});