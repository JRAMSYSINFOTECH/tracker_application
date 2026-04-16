import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import TopCurve from '../../constants/src/components/TopCurve';
import { commonStyles } from '../../constants/src/theme/commonStyles';

export default function DashboardScreen() {
  const router = useRouter();

  const quickActions = [
    {
      title: 'Add Task',
      icon: 'add-circle-outline',
      onPress: () => router.push('/add-task'),
    },
    {
      title: 'Today Plan',
      icon: 'calendar-outline',
      onPress: () => router.push('/today-plan'),
    },
    {
      title: 'Tasks',
      icon: 'list-outline',
      onPress: () => router.push('/(tabs)/tasks'),
    },
    {
      title: 'Explore',
      icon: 'compass-outline',
      onPress: () => router.push('/(tabs)/explore'),
    },
  ];

  return (
    <View style={commonStyles.screen}>
      <TopCurve />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>Hi, Vyshnavi 👋</Text>
            <Text style={styles.subText}>Let’s plan your day smartly</Text>
          </View>

          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={24} color="#111" />
          </View>
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.cardTitle}>Today’s Focus</Text>
          <Text style={styles.cardText}>
            Stay consistent with your tasks, manage time better, and generate your AI study plan.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/today-plan')}
          >
            <Text style={styles.primaryButtonText}>Generate AI Plan</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.grid}>
          {quickActions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.gridCard}
              activeOpacity={0.8}
              onPress={item.onPress}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon as any} size={26} color="#d14df0" />
              </View>
              <Text style={styles.gridText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>08</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>05</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Productivity Tip</Text>
          <Text style={styles.tipText}>
            Finish your highest-priority task first before switching to smaller tasks.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 95,
    paddingBottom: 120,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },

  hello: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },

  subText: {
    fontSize: 15,
    color: '#555',
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e4',
  },

  mainCard: {
    backgroundColor: '#f7d0fb',
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
  },

  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 18,
  },

  primaryButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 14,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  gridCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#ececec',
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 14,
  },

  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fdeaff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  gridText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ececec',
    paddingVertical: 24,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
  },

  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },

  tipCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ececec',
    borderRadius: 20,
    padding: 20,
  },

  tipTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
  },

  tipText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#555',
  },
});