import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

export async function setupNotifications() {
  try {
    if (Platform.OS === 'android' && isExpoGo) {
      console.log('Notifications setup skipped in Expo Go on Android');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.log('setupNotifications error:', error);
    return false;
  }
}

export async function scheduleTaskNotification(taskTitle: string) {
  try {
    if (Platform.OS === 'android' && isExpoGo) {
      console.log('Notification scheduling skipped in Expo Go on Android');
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: `Time to work on "${taskTitle}"`,
        sound: true,
      },
      trigger: null,
    });

    return true;
  } catch (error) {
    console.log('scheduleTaskNotification error:', error);
    return false;
  }
}