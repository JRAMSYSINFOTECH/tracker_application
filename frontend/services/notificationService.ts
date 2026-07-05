import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

export async function registerForPushNotificationsAsync() {
  if (isExpoGo) {
    console.log('Push notifications not available in Expo Go. Use a development build.');
    return;
  }

  try {
    const Notifications = require('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted.');
        return;
      }
    }
  } catch (error) {
    console.log('Error registering notifications:', error);
  }
}

/** Original one-shot scheduler — kept for backward compatibility */
export async function scheduleTaskNotification(
  title: string,
  body: string,
  taskDate: Date
) {
  if (isExpoGo) {
    console.log('Scheduling skipped: not supported in Expo Go');
    return;
  }

  try {
    const Notifications = require('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: taskDate,
      },
    });
  } catch (error) {
    console.log('Could not schedule notification:', error);
  }
}

/**
 * Schedule a notification based on the task's repeat_frequency.
 *
 * - once:   schedules a single DATE trigger at taskDate
 * - daily:  schedules a repeating DAILY calendar trigger at the task's hour/minute
 * - weekly: schedules a repeating WEEKLY calendar trigger on the task's weekday + time
 * - custom: schedules individual DATE triggers for each matching day in the next 30 days
 *
 * Each call returns immediately; all notifications are scheduled independently so
 * multiple simultaneous reminders are never skipped.
 */
export async function scheduleRecurringNotification(
  title: string,
  body: string,
  taskDate: Date,
  repeat_frequency: 'once' | 'daily' | 'weekly' | 'custom',
  repeat_days?: string // comma-separated day indices "0,1,...,6"
) {
  if (isExpoGo) {
    console.log('Scheduling skipped: not supported in Expo Go');
    return;
  }

  try {
    const Notifications = require('expo-notifications');
    const content = { title, body, sound: true };

    if (repeat_frequency === 'once') {
      // One-shot: fire exactly at the date
      if (taskDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: taskDate,
          },
        });
      }
      return;
    }

    if (repeat_frequency === 'daily') {
      // Repeating daily at the same hour & minute
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          hour: taskDate.getHours(),
          minute: taskDate.getMinutes(),
        },
      });
      return;
    }

    if (repeat_frequency === 'weekly') {
      // Repeating weekly on the same weekday + time
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          weekday: taskDate.getDay() + 1, // expo uses 1-7 (Sun=1)
          hour: taskDate.getHours(),
          minute: taskDate.getMinutes(),
        },
      });
      return;
    }

    if (repeat_frequency === 'custom' && repeat_days) {
      const days = repeat_days
        .split(',')
        .map((d) => parseInt(d.trim()))
        .filter((d) => !isNaN(d) && d >= 0 && d <= 6);

      const now = new Date();
      const DAYS_AHEAD = 30; // schedule next 30 days of occurrences

      for (let i = 0; i < DAYS_AHEAD; i++) {
        const candidate = new Date(now);
        candidate.setDate(now.getDate() + i);
        candidate.setHours(taskDate.getHours(), taskDate.getMinutes(), 0, 0);

        // Check if this candidate date's day-of-week is in the repeat_days list
        if (days.includes(candidate.getDay()) && candidate > now) {
          await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: candidate,
            },
          });
        }
      }
      return;
    }

    // Fallback: one-shot
    if (taskDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: taskDate,
        },
      });
    }
  } catch (error) {
    console.log('Could not schedule recurring notification:', error);
  }
}