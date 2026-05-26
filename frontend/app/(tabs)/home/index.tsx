import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../constants/src/context/AuthContext';
import { useTaskContext } from '../../../constants/src/context/TaskContext';

import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PROFILE_IMAGE = '';

type TaskStatus = 'pending' | 'completed';

type DashboardTask = {
  id: number;
  title: string;
  time: string;
  status: TaskStatus;
  dateKey: string;
};


export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { tasks: contextTasks } = useTaskContext();

  const [selectedFilter, setSelectedFilter] = useState<'all' | TaskStatus>('all');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  const USER_NAME = user?.name || 'User';

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const formattedTasks: DashboardTask[] = contextTasks.map(
    (task) => {

      const taskDate = new Date(task.time);

      // Map backend statuses to dashboard display statuses
      const mappedStatus: TaskStatus =
        task.status === 'completed' ? 'completed' : 'pending';

      return {
        id: task.id,

        title: task.title,

        time: taskDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),

        status: mappedStatus,

        dateKey: formatDateKey(taskDate),
      };
    }
  );

  const navigateWithClose = (path: string) => {
    setDrawerVisible(false);
    setQuickActionsVisible(false);
    setMonthModalVisible(false);
    router.push(path as any);
  };

  const initials = useMemo(() => {
    return USER_NAME.trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [USER_NAME]);

  const selectedDateKey = formatDateKey(selectedDate);
  const todayKey = formatDateKey(today);

  const calendarDays = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);

      return {
        day: dayNames[date.getDay()],
        date: String(date.getDate()).padStart(2, '0'),
        fullDate: new Date(date),
        active: formatDateKey(date) === selectedDateKey,
      };
    });
  }, [today, selectedDateKey]);

  const pendingCount = formattedTasks.filter((task) => task.status === 'pending').length;
  const completedCount = formattedTasks.filter((task) => task.status === 'completed').length;
  const totalCount = formattedTasks.length;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const filteredTasks = useMemo(() => {
    // Show ALL tasks, filtered only by status (not by date)
    if (selectedFilter === 'all') return formattedTasks;
    return formattedTasks.filter((task) => task.status === selectedFilter);
  }, [selectedFilter, formattedTasks]);

  const selectedDateTasks = useMemo(() => {
    return formattedTasks.filter((task) => task.dateKey === selectedDateKey);
  }, [selectedDateKey, formattedTasks]);

  const monthGrid = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      date: Date;
      label: number;
      currentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasTasks: boolean;
    }[] = [];

    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push({
        date: d,
        label: d.getDate(),
        currentMonth: false,
        isToday: formatDateKey(d) === todayKey,
        isSelected: formatDateKey(d) === selectedDateKey,
        hasTasks: formattedTasks.some((task) => task.dateKey === formatDateKey(d)),
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      cells.push({
        date: d,
        label: day,
        currentMonth: true,
        isToday: formatDateKey(d) === todayKey,
        isSelected: formatDateKey(d) === selectedDateKey,
        hasTasks: formattedTasks.some((task) => task.dateKey === formatDateKey(d)),
      });
    }

    while (cells.length < 42) {
      const nextDay = cells.length - (startDay + daysInMonth) + 1;
      const d = new Date(year, month + 1, nextDay);
      cells.push({
        date: d,
        label: d.getDate(),
        currentMonth: false,
        isToday: formatDateKey(d) === todayKey,
        isSelected: formatDateKey(d) === selectedDateKey,
        hasTasks: formattedTasks.some((task) => task.dateKey === formatDateKey(d)),
      });
    }

    return cells;
  }, [selectedDate, selectedDateKey, todayKey, formattedTasks]);

  const formattedSelectedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(selectedDate);
  }, [selectedDate]);

  const displaySelectedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(selectedDate);
  }, [selectedDate]);

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
      onPress: () => navigateWithClose('/(tabs)/home/ai-Scheduler'),
    },
    {
      title: 'Settings',
      icon: 'settings-outline',
      active: false,
      onPress: () => navigateWithClose('/(tabs)/home/settings'),
    },
    {
      title: 'Logout',
      icon: 'log-out-outline',
      active: false,
      onPress: async () => {
        setDrawerVisible(false);
        await logout();
        router.replace('/login');
      },
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
            onPress={() => {
              setDrawerVisible(true);
              setQuickActionsVisible(false);
            }}
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

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>Today's Progress</Text>
              <Text style={styles.progressSubText}>
                {completedCount} of {totalCount} tasks completed
              </Text>
            </View>

            <View style={styles.progressPercentBadge}>
              <Text style={styles.progressPercentText}>{progressPercent}%</Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Calendar</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMonthModalVisible(true)}
            >
              <Text style={styles.calendarLink}>Month view</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarRow}
          >
            {calendarDays.map((item, index) => (
              <TouchableOpacity
                key={`${item.date}-${index}`}
                style={[styles.dateChip, item.active && styles.dateChipActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedDate(item.fullDate)}
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
              <Text style={styles.cardDate}>{displaySelectedDate}</Text>
            </View>

            <View style={styles.actionPillsRow}>
              <TouchableOpacity
                style={styles.aiTaskPill}
                activeOpacity={0.85}
                onPress={() => navigateWithClose('/(tabs)/home/today-plan')}
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
                style={[styles.filterText, selectedFilter === 'pending' && styles.filterTextActive]}
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

          {filteredTasks.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No tasks for selected date</Text>
              <Text style={styles.emptyText}>
                This day has no tasks in the selected filter.
              </Text>
            </View>
          )}
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

      <Modal
        visible={monthModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMonthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setMonthModalVisible(false)}
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  const prevMonth = new Date(selectedDate);
                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                  setSelectedDate(prevMonth);
                }}
              >
                <Ionicons name="chevron-back" size={22} color="#111" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                {new Intl.DateTimeFormat('en-GB', {
                  month: 'long',
                  year: 'numeric',
                }).format(selectedDate)}
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  const nextMonth = new Date(selectedDate);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setSelectedDate(nextMonth);
                }}
              >
                <Ionicons name="chevron-forward" size={22} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.weekHeaderText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.monthGrid}>
              {monthGrid.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dayCell}
                  activeOpacity={0.85}
                  onPress={() => setSelectedDate(item.date)}
                >
                  <View
                    style={[
                      styles.dayNumberWrap,
                      item.isSelected && styles.selectedDayWrap,
                      item.isToday && !item.isSelected && styles.todayDayWrap,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        !item.currentMonth && styles.otherMonthText,
                        item.isSelected && styles.selectedDayText,
                        item.isToday && !item.isSelected && styles.todayDayText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {item.hasTasks && <View style={styles.dot} />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#b144db' }]} />
                <Text style={styles.legendText}>Has tasks</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#d8a9f2' }]} />
                <Text style={styles.legendText}>Selected date</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#d8eef7' }]} />
                <Text style={styles.legendText}>Today</Text>
              </View>
            </View>

            <View style={styles.selectedTasksCard}>
              <View style={styles.selectedTasksHeader}>
                <Text style={styles.selectedTasksTitle}>Selected Day</Text>
                <Text style={styles.selectedTasksDate}>{formattedSelectedDate}</Text>
                <View style={styles.selectedTasksCount}>
                  <Text style={styles.selectedTasksCountText}>
                    {selectedDateTasks.length} Tasks
                  </Text>
                </View>
              </View>

              {selectedDateTasks.length > 0 ? (
                selectedDateTasks.map((task) => (
                  <View key={task.id} style={styles.modalTaskRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalTaskTitle}>{task.title}</Text>
                      <Text style={styles.modalTaskTime}>{task.time}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        task.status === 'pending'
                          ? styles.pendingBadge
                          : styles.completedBadge,
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
                ))
              ) : (
                <View style={styles.emptyModalTasks}>
                  <Text style={styles.emptyTitle}>No tasks</Text>
                  <Text style={styles.emptyText}>
                    No tasks available on this selected date.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.goToDateBtn}
                activeOpacity={0.85}
                onPress={() => setMonthModalVisible(false)}
              >
                <Text style={styles.goToDateBtnText}>Go to Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

      {quickActionsVisible && (
        <Pressable
          style={styles.quickActionOverlay}
          onPress={() => setQuickActionsVisible(false)}
        >
          <View style={styles.quickActionsMenu}>
            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.85}
              onPress={() => navigateWithClose('/(tabs)/home/add-task')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="add-circle-outline" size={18} color="#a14ccf" />
              </View>
              <Text style={styles.quickActionText}>Add Task</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.85}
              onPress={() => navigateWithClose('/(tabs)/home/today-plan')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="calendar-outline" size={18} color="#a14ccf" />
              </View>
              <Text style={styles.quickActionText}>Today's Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.85}
              onPress={() => navigateWithClose('/(tabs)/tasks')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="list-outline" size={18} color="#a14ccf" />
              </View>
              <Text style={styles.quickActionText}>Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.85}
              onPress={() => navigateWithClose('/(tabs)/home/today-plan')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="sparkles-outline" size={18} color="#a14ccf" />
              </View>
              <Text style={styles.quickActionText}>AI Scheduler</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => {
          setQuickActionsVisible((prev) => !prev);
          setDrawerVisible(false);
        }}
      >
        <Ionicons
          name={quickActionsVisible ? 'close' : 'sparkles-outline'}
          size={24}
          color="#fff"
        />
      </TouchableOpacity>

      <View style={styles.fabLabelWrap}>
        <Text style={styles.fabLabel}>AI Plan</Text>
      </View>
    </View>
  );
}

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateWithOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
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
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#ececec',
    padding: 14,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111',
    marginBottom: 3,
  },
  progressSubText: {
    fontSize: 13,
    color: '#666',
  },
  progressPercentBadge: {
    minWidth: 58,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3e1fb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  progressPercentText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9f3dd1',
  },
  progressBarTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#f1e5f7',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#b144db',
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
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#ececec',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
    minHeight: '78%',
  },
  modalHandle: {
    width: 58,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d5ccd9',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  weekHeaderText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 14,
  },
  dayNumberWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayWrap: {
    backgroundColor: '#b144db',
  },
  todayDayWrap: {
    backgroundColor: '#dff3ff',
  },
  dayNumber: {
    fontSize: 16,
    color: '#111',
    fontWeight: '700',
  },
  otherMonthText: {
    color: '#bbb',
  },
  selectedDayText: {
    color: '#fff',
  },
  todayDayText: {
    color: '#111',
  },
  dot: {
    marginTop: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#b144db',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  selectedTasksCard: {
    backgroundColor: '#faf7fb',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f0e4f5',
  },
  selectedTasksHeader: {
    marginBottom: 10,
  },
  selectedTasksTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginBottom: 2,
  },
  selectedTasksDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  selectedTasksCount: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3e1fb',
  },
  selectedTasksCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9f3dd1',
  },
  modalTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTaskTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    marginBottom: 3,
  },
  modalTaskTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyModalTasks: {
    paddingVertical: 10,
  },
  goToDateBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b144db',
  },
  goToDateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
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
  quickActionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 18,
  },
  quickActionsMenu: {
    position: 'absolute',
    right: 24,
    bottom: 110,
    width: 190,
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
    borderWidth: 1,
    borderColor: '#f0e6f5',
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  quickActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f8f1fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
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