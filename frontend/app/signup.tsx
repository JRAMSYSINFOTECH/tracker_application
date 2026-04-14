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
import { commonStyles } from '../constants/src/theme/commonStyles';

export default function SignupScreen() {
  const router = useRouter();

  const [gender, setGender] = useState<'F' | 'M' | 'O'>('M');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  // ✅ Email validation
  const isValidEmail = (email: string) =>
    /\S+@\S+\.\S+/.test(email);

  // ✅ Strong password (8+ chars, number, special char)
  const isStrongPassword = (password: string) =>
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(password);

  const handleSignup = () => {
    if (!name || !email || !password || !confirm) {
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
    alert('Signup Success (Demo)');
  };

  return (
    <View style={commonStyles.screen}>
      <TopCurve />

      <View style={[commonStyles.content, { marginTop: 120 }]}>

        {/* BACK BUTTON */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        {/* TITLE */}
        <Text style={commonStyles.title}>SIGN UP</Text>

        {/* LOGIN LINK */}
        <View style={styles.loginRow}>
          <Text>Already have an account? </Text>
          <Text style={commonStyles.linkText} onPress={() => router.push('/login')}>
            Login
          </Text>
        </View>

        {/* AVATAR */}
        <View style={styles.avatar}>
          <Text style={{ fontSize: 40 }}>?</Text>
        </View>

        {/* GENDER */}
        <View style={styles.genderRow}>
          {['F', 'M', 'O'].map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g as any)}
              style={[
                styles.genderCircle,
                gender === g && styles.activeGender,
              ]}
            >
              <Text style={{ color: gender === g ? '#C400FF' : '#000' }}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ textAlign: 'center', marginBottom: 15 }}>Gender</Text>

        {/* INPUTS */}
        <AppInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          style={{ marginBottom: 15 }}
        />

        <AppInput
          placeholder="Email / Phone number"
          value={email}
          onChangeText={setEmail}
          style={{ marginBottom: 15 }}
        />

        <AppInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ marginBottom: 15 }}
        />

        <AppInput
          placeholder="Confirm Password"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          style={{ marginBottom: 10 }}
        />

        {/* ERROR */}
        {error ? (
          <Text style={[commonStyles.errorText, { marginBottom: 10 }]}>
            {error}
          </Text>
        ) : null}

        {/* BUTTON */}
        <AppButton title="signin" onPress={handleSignup} />

        {/* OR */}
        <View style={{ marginVertical: 25 }}>
          <OrDivider />
        </View>

        {/* GOOGLE */}
        <TouchableOpacity style={styles.googleButton}>
          <Image
            source={require('../assets/images/google-logo.png')}
            style={{ width: 22, height: 22, marginRight: 10 }}
          />
          <Text>Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  backText: {
    fontSize: 22,
  },
  loginRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  genderCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGender: {
    borderWidth: 2,
    borderColor: '#C400FF',
    backgroundColor: '#F7CCFF',
  },
  googleButton: {
    height: 55,
    borderWidth: 2,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});