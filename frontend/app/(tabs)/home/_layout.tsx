import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const USER_NAME = 'Vyshnavi';
const PROFILE_IMAGE = '';

function CustomDrawerContent(props: any) {
  const initials = USER_NAME.trim()
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.drawerOuter}>
      <View style={styles.drawerRoot}>
        <View style={styles.drawerHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            activeOpacity={0.8}
            onPress={() => props.navigation.closeDrawer()}
          >
            <Ionicons name="close-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.profileRow}>
            {PROFILE_IMAGE ? (
              <Image source={{ uri: PROFILE_IMAGE }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileFallback}>
                <Text style={styles.profileFallbackText}>{initials.charAt(0)}</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{USER_NAME}</Text>
              <Text style={styles.profileSubText}>Let's plan your day smartly</Text>
            </View>
          </View>
        </View>

        <DrawerContentScrollView
          {...props}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.drawerScrollContent}
        >
          <DrawerItemList {...props} />

          <DrawerItem
            label="Quick Actions"
            onPress={() => props.navigation.closeDrawer()}
            icon={({ color, size }) => (
              <Ionicons name="flash-outline" size={size} color={color} />
            )}
            labelStyle={styles.extraItemLabel}
            style={styles.extraItem}
            inactiveTintColor="#111"
          />

          <DrawerItem
            label="Settings"
            onPress={() => props.navigation.closeDrawer()}
            icon={({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            )}
            labelStyle={styles.extraItemLabel}
            style={styles.extraItem}
            inactiveTintColor="#111"
          />
        </DrawerContentScrollView>
      </View>
    </View>
  );
}

export default function HomeLayout() {
  return (
    <Drawer
      detachInactiveScreens={false}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.14)',
        sceneStyle: {
          backgroundColor: 'transparent',
        },
        drawerStyle: {
          width: '80%',
          maxWidth: 330,
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        drawerActiveTintColor: '#ab69d8',
        drawerInactiveTintColor: '#111',
        drawerLabelStyle: {
          marginLeft: -10,
          fontSize: 17,
          fontWeight: '600',
        },
        drawerItemStyle: {
          borderRadius: 16,
          marginHorizontal: 14,
          marginVertical: 6,
          paddingVertical: 8,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="add-task"
        options={{
          title: 'Add Task',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="today-plan"
        options={{
          title: 'Today Plan',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerOuter: {
    flex: 1,
    paddingBottom: 0,
  },
  drawerRoot: {
    flex: 1,
    marginTop: 0,
    backgroundColor: '#fff',
    borderTopRightRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  drawerHeader: {
    backgroundColor: '#c68be9',
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileFallbackText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  profileSubText: {
    fontSize: 13,
    color: '#f8eefe',
  },
  drawerScrollContent: {
    paddingTop: 14,
    paddingBottom: 0,
  },
  extraItem: {
    borderRadius: 16,
    marginHorizontal: 14,
    marginVertical: 6,
    paddingVertical: 8,
  },
  extraItemLabel: {
    marginLeft: -10,
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
});