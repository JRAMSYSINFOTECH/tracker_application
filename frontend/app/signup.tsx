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

export default function SignupScreen() {
  const router = useRouter();

  const [gender, setGender] = useState<'F' | 'M' | 'O'>('M');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const isStrongPassword = (value: string) =>
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(value);

  const handleSignup = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      setError('All fields are required');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Enter valid email');
      return;
    }

    if (!isStrongPassword(password)) {
      setError('Password must be 8+ chars with number & special symbol');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    router.replace('/(tabs)');
  };

  return (
    <View style={commonStyles.screen}>
      <TopCurve />

      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Sign Up</Text>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.link}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={34} color="#666" />
        </View>

        <View style={styles.genderRow}>
          {['F', 'M', 'O'].map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g as 'F' | 'M' | 'O')}
              style={[
                styles.genderCircle,
                gender === g && styles.activeGender,
              ]}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === g && styles.activeGenderText,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.genderLabel}>Gender</Text>

        <AppInput
          placeholder="Full Name"
          value={name}
          onChangeText={(text: string) => {
            setName(text);
            if (error) setError('');
          }}
          style={{ marginBottom: 15 }}
        />

        <AppInput
          placeholder="Email / Phone number"
          value={email}
          onChangeText={(text: string) => {
            setEmail(text);
            if (error) setError('');
          }}
          style={{ marginBottom: 15 }}
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

        <View style={styles.passwordWrapper}>
          <AppInput
            placeholder="Confirm Password"
            secureTextEntry={!showConfirmPassword}
            value={confirm}
            onChangeText={(text: string) => {
              setConfirm(text);
              if (error) setError('');
            }}
            style={styles.passwordInput}
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <Text style={[commonStyles.errorText, { marginBottom: 10 }]}>
            {error}
          </Text>
        ) : null}

        <AppButton
          title="Sign Up"
          onPress={handleSignup}
          style={{ marginTop: 15, marginBottom: 25 }}
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
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 90,
  },

  backButton: {
    width: 32,
    height: 32,
    borderWidth: 1.5,
    borderColor: '#111',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
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

  loginRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },

  loginText: {
    color: colors.textPrimary,
    fontSize: 15,
  },

  link: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '500',
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ececec',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  genderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 10,
  },

  genderCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e1e1e1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeGender: {
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: '#f7d7ff',
  },

  genderText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },

  activeGenderText: {
    color: colors.accent,
  },

  genderLabel: {
    textAlign: 'center',
    marginBottom: 18,
    color: '#333',
    fontSize: 14,
  },

  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 15,
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

  googleButton: {
    marginTop: 25,
    height: 55,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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