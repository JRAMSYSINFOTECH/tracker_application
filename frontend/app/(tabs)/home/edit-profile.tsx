import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AppButton from '../../../constants/src/components/AppButton';
import AppInput from '../../../constants/src/components/AppInput';
import { useAuth } from '../../../constants/src/context/AuthContext';
import { useTheme } from '../../../constants/src/context/ThemeContext';
import { commonStyles } from '../../../constants/src/theme/commonStyles';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { theme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState<'F' | 'M' | 'O'>(user?.gender || 'M');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_pic || null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      if (error) setError('');
    }
  };

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSave = async () => {
    if (submitting) return;

    setError('');
    setSuccess('');

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      setError('Name and Email are required');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email');
      return;
    }

    try {
      setSubmitting(true);

      const result = await updateProfile(
        normalizedName,
        normalizedEmail,
        gender,
        profileImage
      );

      if (!result.success) {
        setError(result.message || 'Update failed');
        return;
      }

      setSuccess('Profile updated successfully');
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.editProfileBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { backgroundColor: theme.editProfileHeaderBg, borderBottomColor: theme.editProfileHeaderBorder }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.editProfileBackBg }]} 
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Ionicons name="arrow-back" size={24} color={theme.editProfileHeaderTitle} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.editProfileHeaderTitle }]}>Edit Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={pickImage}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarPlaceholderText}>
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          <View style={[styles.cameraIconBadge, { backgroundColor: theme.drawerHeaderBg }]}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.photoActionsRow}>
          <TouchableOpacity onPress={pickImage} disabled={submitting}>
            <Text style={[styles.changePhotoText, { color: theme.primary }]}>Change Photo</Text>
          </TouchableOpacity>
          {profileImage ? (
            <TouchableOpacity onPress={() => setProfileImage(null)} disabled={submitting}>
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.genderContainer}>
          <Text style={[styles.genderTitle, { color: theme.editProfileGenderTitle }]}>Gender</Text>
          <View style={styles.genderRow}>
            {['F', 'M', 'O'].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g as 'F' | 'M' | 'O')}
                style={[
                  styles.genderCircle,
                  { backgroundColor: theme.editProfileGenderCircleBg },
                  gender === g && { borderColor: theme.primary, backgroundColor: theme.primaryLight },
                ]}
                disabled={submitting}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.genderText,
                    { color: theme.editProfileGenderText },
                    gender === g && { color: theme.primary },
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <AppInput
          placeholder="Full Name"
          value={name}
          onChangeText={(text: string) => {
            setName(text);
            if (error) setError('');
          }}
          editable={!submitting}
          style={styles.input}
        />

        <AppInput
          placeholder="Email"
          value={email}
          onChangeText={(text: string) => {
            setEmail(text);
            if (error) setError('');
          }}
          editable={!submitting}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {error ? (
          <Text style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        {success ? (
          <Text style={styles.successText}>
            {success}
          </Text>
        ) : null}

        <AppButton
          title={submitting ? 'Saving Changes...' : 'Save Changes'}
          onPress={handleSave}
          disabled={submitting}
          style={[
            styles.saveButton,
            { opacity: submitting ? 0.7 : 1 }
          ]}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  content: {
    padding: 24,
    alignItems: 'stretch',
  },
  avatarContainer: {
    alignSelf: 'center',
    width: 110,
    height: 110,
    borderRadius: 55,
    position: 'relative',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 44,
    fontWeight: '700',
    color: '#fff',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 25,
  },
  changePhotoText: {
    fontWeight: '600',
    fontSize: 14,
  },
  removePhotoText: {
    color: '#ff4b4b',
    fontWeight: '600',
    fontSize: 14,
  },
  genderContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  genderTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 16,
  },
  genderCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 15,
  },
  errorText: {
    color: '#ff4b4b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  successText: {
    color: '#00af3c',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
});
