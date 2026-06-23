import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AppButton from '../constants/src/components/AppButton';
import AppInput from '../constants/src/components/AppInput';
import OrDivider from '../constants/src/components/OrDivider';
import TopCurve from '../constants/src/components/TopCurve';
import { useAuth } from '../constants/src/context/AuthContext';
import { colors } from '../constants/src/theme/colors';
import { commonStyles } from '../constants/src/theme/commonStyles';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const { signup, googleLogin, isAuthenticated, loading } = useAuth();

  const [gender, setGender] = useState<'F' | 'M' | 'O'>('M');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

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
      console.log('Google Auth Request Redirect URI (Signup):', request.redirectUri);
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
            setError(result.message || 'Google signup failed');
          }
        } catch (error) {
          console.log(error);
          setError('Google signup failed');
        }
      }
    };
    signInWithGoogle();
  }, [response, googleLogin, router]);
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const isStrongPassword = (value: string) =>
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(value);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setGender('M');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSignup = async () => {
    if (submitting) return;

    setError('');
    setSuccess('');

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedConfirm = confirm.trim();

    if (
      !normalizedName ||
      !normalizedEmail ||
      !normalizedPassword ||
      !normalizedConfirm
    ) {
      setError('All fields are required');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email');
      return;
    }

    if (!isStrongPassword(normalizedPassword)) {
      setError('Password must be 8+ chars with number & special symbol');
      return;
    }

    if (normalizedPassword !== normalizedConfirm) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);

      const result = await signup(
        normalizedName,
        normalizedEmail,
        normalizedPassword,
        gender,
        profileImage
      );

      if (!result.success) {
        setError(result.message || 'Signup failed');
        return;
      }

      setSuccess(result.message || 'Signup successful');
      resetForm();
      router.replace('/(tabs)/home');
    } catch (e) {
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

        <Text style={styles.title}>Sign Up</Text>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => router.replace('/login')}
            disabled={submitting}
          >
            <Text style={styles.link}>Login</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.avatar}
          onPress={pickImage}
          disabled={submitting}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
              }}
            />
          ) : (
            <Ionicons name="camera-outline" size={34} color="#666" />
          )}
        </TouchableOpacity>

        <View style={styles.genderRow}>
          {['F', 'M', 'O'].map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g as 'F' | 'M' | 'O')}
              style={[
                styles.genderCircle,
                gender === g && styles.activeGender,
              ]}
              disabled={submitting}
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
            if (success) setSuccess('');
          }}
          editable={!submitting}
          style={{ marginBottom: 15 }}
        />

        <AppInput
          placeholder="Email"
          value={email}
          onChangeText={(text: string) => {
            setEmail(text);
            if (error) setError('');
            if (success) setSuccess('');
          }}
          editable={!submitting}
          style={{ marginBottom: 15 }}
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
              if (success) setSuccess('');
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

        <View style={styles.passwordWrapper}>
          <AppInput
            placeholder="Confirm Password"
            secureTextEntry={!showConfirmPassword}
            value={confirm}
            onChangeText={(text: string) => {
              setConfirm(text);
              if (error) setError('');
              if (success) setSuccess('');
            }}
            editable={!submitting}
            style={styles.passwordInput}
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={submitting}
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

        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <AppButton
          title={submitting ? 'Signing Up...' : 'Sign Up'}
          onPress={handleSignup}
          style={{
            marginTop: 15,
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
  successText: {
    color: 'green',
    fontSize: 14,
    marginBottom: 10,
  },
});