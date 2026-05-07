import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PROFILE_IMAGE = '';

type TaskStatus = 'pending' | 'completed';

type Task = {
  id: string;
  title: string;
  time: string;
  status: TaskStatus;
};

export default function DashboardScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<'all' | TaskStatus>('all');
  const [drawerVisible, setDrawerVisible] = useState(false);

  const USER_NAME = 'Boddu Vyshnavi';

  const tasks: Task[] = [
    { id: '1', title: 'Lunch Date', time: '06 April, 2026 12:00 PM', status: 'pending' },
    { id: '2', title: 'Interview', time: '06 April, 2026 02:00 PM', status: 'completed' },
    { id: '3', title: 'React Native Practice', time: 'Today 05:00 PM', status: 'pending' },
    { id: '4', title: 'Push to GitHub', time: 'Today 07:00 PM', status: 'completed' },
  ];

  const initials = useMemo(() => {
    return USER_NAME.trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [USER_NAME]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);

      return {
        day: dayNames[date.getDay()],
        date: String(date.getDate()).padStart(2, '0'),
        active: index === 0,
      };
    });
  }, []);

  const formattedToday = useMemo(() => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const pendingCount = tasks.filter((task) => task.status === 'pending').length;
  const completedCount = tasks.filter((task) => task.status === 'completed').length;
  const totalCount = tasks.length;

  const filteredTasks = useMemo(() => {
    if (selectedFilter === 'all') return tasks;
    return tasks.filter((task) => task.status === selectedFilter);
  }, [selectedFilter]);

  const navigateWithClose = (path: string) => {
    setDrawerVisible(false);
    setTimeout(() => router.push(path as any), 120);
  };

  const openAIPlanner = () => {
    setDrawerVisible(false);
    router.push('/(tabs)/home/ai-scheduler' as any);
  };

  const menuItems = [
    {
      title: 'Home',
      icon: 'home-outline',
      active: true,
      onPress: () => navigateWithClose('/(tabs)/home'),
    },
    {
      title: 'Add Task',
      icon: 'add-circle-outline',
      active: false,
      onPress: () => navigateWithClose('/(tabs)/home/add-task'),
    },
    {
      title: 'Today Plan',
      icon: 'calendar-outline',
      active: false,
      onPress: () => navigateWithClose('/(tabs)/home/today-plan'),
    },
    {
      title: 'Tasks',
      icon: 'list-outline',
      active: false,
      onPress: () => navigateWithClose('/(tabs)/tasks'),
    },
    {
      title: 'AI Planner',
      icon: 'sparkles-outline',
      active: false,
      onPress: () => navigateWithClose('/(tabs)/home/ai-scheduler'),
    },
    {
      title: 'Settings',
      icon: 'settings-outline',
      active: false,
      onPress: () => navigateWithClose('/(tabs)/home/settings'),
    },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.topBg} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setDrawerVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="menu-outline" size={24} color="#111" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.hello}>Hi, {USER_NAME} 👋</Text>
            <Text style={styles.subText}>Let's plan your day smartly</Text>
          </View>

          <TouchableOpacity style={styles.avatar} activeOpacity={0.8}>
            {PROFILE_IMAGE ? (
              <Image source={{ uri: PROFILE_IMAGE }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials.charAt(0)}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, styles.totalCard]}
            onPress={() => setSelectedFilter('all')}
            activeOpacity={0.85}
          >
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.completedCard]}
            onPress={() => setSelectedFilter('completed')}
            activeOpacity={0.85}
          >
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.pendingCard]}
            onPress={() => setSelectedFilter('pending')}
            activeOpacity={0.85}
          >
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </TouchableOpacity>

          <View style={[styles.statCard, styles.missedCard]}>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Calendar</Text>
            <TouchableOpacity activeOpacity={0.8}>
              <Text style={styles.calendarLink}>View all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarRow}
          >
            {calendarDays.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dateChip, item.active && styles.dateChipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayText, item.active && styles.dateChipTextActive]}>
                  {item.day}
                </Text>
                <Text style={[styles.dateText, item.active && styles.dateChipTextActive]}>
                  {item.date}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <View style={styles.mainTitleWrap}>
              <Text style={styles.cardTitle}>Today's Plan</Text>
              <Text style={styles.cardDate}>{formattedToday}</Text>
            </View>

            <View style={styles.actionPillsRow}>
              <TouchableOpacity
                style={styles.aiTaskPill}
                activeOpacity={0.85}
                onPress={openAIPlanner}
              >
                <Ionicons name="sparkles-outline" size={14} color="#111" />
                <Text style={styles.aiTaskPillText}>Generate Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addTaskPill}
                activeOpacity={0.85}
                onPress={() => navigateWithClose('/(tabs)/home/add-task')}
              >
                <Text style={styles.addTaskPillText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'pending' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('pending')}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === 'pending' && styles.filterTextActive,
                ]}
              >
                Pending
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === 'completed' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter('completed')}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === 'completed' && styles.filterTextActive,
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.taskList}>
          {filteredTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskTime}>{task.time}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  task.status === 'pending' ? styles.pendingBadge : styles.completedBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    task.status === 'pending'
                      ? styles.pendingBadgeText
                      : styles.completedBadgeText,
                  ]}
                >
                  {task.status === 'pending' ? 'Pending' : 'Completed'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={18} color="#111" />
            <Text style={styles.tipTitle}>Productivity Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Finish your highest-priority task first before switching to smaller tasks.
          </Text>
        </View>
      </ScrollView>

      {drawerVisible && (
        <View style={styles.drawerOverlay} pointerEvents="box-none">
          <Pressable style={styles.overlayBackdrop} onPress={() => setDrawerVisible(false)} />

          <View style={styles.drawerWrap}>
            <View style={styles.drawer}>
              <View style={styles.drawerTop}>
                <View style={styles.drawerHeader}>
                  <View style={{ width: 28, height: 28 }} />
                  <TouchableOpacity
                    onPress={() => setDrawerVisible(false)}
                    activeOpacity={0.8}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.userRow}>
                  <View style={styles.profileCircle}>
                    {PROFILE_IMAGE ? (
                      <Image source={{ uri: PROFILE_IMAGE }} style={styles.profileImage} />
                    ) : (
                      <Text style={styles.profileLetter}>{initials.charAt(0)}</Text>
                    )}
                  </View>

                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {USER_NAME}
                    </Text>
                    <Text style={styles.profileSub} numberOfLines={1}>
                      Let's plan your day smartly
                    </Text>
                  </View>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.menuList}
              >
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.menuItem, item.active && styles.menuItemActive]}
                    activeOpacity={0.85}
                    onPress={item.onPress}
                  >
                    <View style={styles.menuIconWrap}>
                      <Ionicons
                        name={item.icon as any}
                        size={19}
                        color={item.active ? '#a14ccf' : '#a861cf'}
                      />
                    </View>
                    <Text style={[styles.menuText, item.active && styles.menuTextActive]}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={openAIPlanner}>
        <Ionicons name="sparkles-outline" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.fabLabelWrap}>
        <Text style={styles.fabLabel}>AI Plan</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f4f8',
  },
  topBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: '#efc9f6',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 190,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ececec',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  hello: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 2,
  },
  subText: {
    fontSize: 13,
    color: '#555',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eedcf7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e4c9f0',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7e329d',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: '48%',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ececec',
  },
  totalCard: {
    backgroundColor: '#fff',
  },
  completedCard: {
    backgroundColor: '#dff8de',
  },
  pendingCard: {
    backgroundColor: '#dff3ff',
  },
  missedCard: {
    backgroundColor: '#ffd7d7',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#ececec',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111',
  },
  calendarLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c14de7',
  },
  calendarRow: {
    gap: 10,
    paddingRight: 6,
  },
  dateChip: {
    width: 58,
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf7fb',
    borderWidth: 1,
    borderColor: '#f0e4f5',
  },
  dateChipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  dayText: {
    fontSize: 11,
    color: '#777',
    marginBottom: 2,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 16,
    color: '#111',
    fontWeight: '800',
  },
  dateChipTextActive: {
    color: '#fff',
  },
  mainCard: {
    backgroundColor: '#e8c4ef',
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mainTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
    color: '#555',
  },
  actionPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  aiTaskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8eab4',
  },
  aiTaskPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111',
  },
  addTaskPill: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.08)',
  },
  filterChipActive: {
    backgroundColor: '#111',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },
  filterTextActive: {
    color: '#fff',
  },
  taskList: {
    gap: 10,
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#ececec',
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
    marginBottom: 3,
  },
  taskTime: {
    fontSize: 12.5,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    backgroundColor: '#dff3ff',
  },
  completedBadge: {
    backgroundColor: '#dff8de',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  pendingBadgeText: {
    color: '#126a8a',
  },
  completedBadgeText: {
    color: '#1f7a31',
  },
  tipCard: {
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: '#ececec',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
  tipText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#555',
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
    elevation: 15,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  drawerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 50,
    width: '74%',
  },
  drawer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopRightRadius: 26,
    borderBottomRightRadius: 70,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 2 },
    elevation: 12,
  },
  drawerTop: {
    backgroundColor: '#c78ae9',
    paddingBottom: 14,
  },
  drawerHeader: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 1,
  },
  profileSub: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.92)',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  menuList: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  menuItemActive: {
    backgroundColor: '#f3e9fb',
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f8f1fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111',
  },
  menuTextActive: {
    color: '#a14ccf',
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 120,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#b144db',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
    zIndex: 20,
  },
  fabLabelWrap: {
    position: 'absolute',
    right: 18,
    bottom: 82,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eadcf1',
    zIndex: 19,
  },
  fabLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9f3dd1',
  },
});