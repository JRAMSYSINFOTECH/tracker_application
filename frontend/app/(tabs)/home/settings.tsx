import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Switch,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../constants/src/context/AuthContext';
import { useTheme } from '../../../constants/src/context/ThemeContext';

const NOTIFICATIONS_KEY = 'push_notifications_enabled';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode, theme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATIONS_KEY).then((val) => {
      if (val === 'false') setNotifications(false);
    });
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    setNotifications(value);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, String(value));
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        await logout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.inputBg }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* PROFILE SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>Account</Text>
          <View style={[styles.profileCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.profileAvatar, { backgroundColor: theme.primary }]}>
              {user?.profile_pic ? (
                <Image source={{ uri: user.profile_pic }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>{user?.name || 'User'}</Text>
              <Text style={[styles.profileEmail, { color: theme.subText }]}>{user?.email || 'email@example.com'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editProfileBtn} 
              onPress={() => router.push('/(tabs)/home/edit-profile')}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={22} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* PREFERENCES SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>Preferences</Text>
          <View style={[styles.item, { backgroundColor: theme.itemBg, borderColor: theme.border }]}>
            <Ionicons name="notifications-outline" size={22} color={theme.iconColor} />
            <Text style={[styles.itemText, { color: theme.text }]}>Push Notifications</Text>
            <Switch 
              value={notifications} 
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
              thumbColor={notifications ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={[styles.item, { backgroundColor: theme.itemBg, borderColor: theme.border }]}>
            <Ionicons name="moon-outline" size={22} color={theme.iconColor} />
            <Text style={[styles.itemText, { color: theme.text }]}>Dark Mode</Text>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleDarkMode}
              trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
              thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* ABOUT SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.sectionTitle }]}>About</Text>
          <View style={[styles.item, { backgroundColor: theme.itemBg, borderColor: theme.border }]}>
            <Ionicons name="information-circle-outline" size={22} color={theme.iconColor} />
            <Text style={[styles.itemText, { color: theme.text }]}>App Version</Text>
            <Text style={[styles.itemValue, { color: theme.subText }]}>1.0.0</Text>
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
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
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  editProfileBtn: {
    padding: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  itemValue: {
    fontSize: 14,
    marginRight: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4b4b',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
});
