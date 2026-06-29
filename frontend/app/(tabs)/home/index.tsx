import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../constants/src/context/AuthContext';
import { useTaskContext } from '../../../constants/src/context/TaskContext';
import { useTheme } from '../../../constants/src/context/ThemeContext';
import { dashboardApi } from '../../../services/api';

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
  const { theme } = useTheme();

  const [selectedFilter, setSelectedFilter] = useState<'all' | TaskStatus>('all');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [missedCount, setMissedCount] = useState(0);

  useEffect(() => {
    dashboardApi.overview().then((data) => {
      setMissedCount(data.missed);
    }).catch(() => {
      // silently ignore if API fails
    });
  }, []);

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
      onPress: () => navigateWithClose('/(tabs)/home/AISchedulerScreen'),
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
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <View style={[styles.topBg, { backgroundColor: theme.topSurface }]} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => {
              setDrawerVisible(true);
              setQuickActionsVisible(false);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="menu-outline" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.hello, { color: theme.text }]}>Hi, {USER_NAME} 👋</Text>
            <Text style={[styles.subText, { color: theme.subText }]}>{"Let's plan your day smartly"}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.avatar, { backgroundColor: theme.softPrimary, borderColor: theme.border }]} 
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/home/settings')}
          >
            {user?.profile_pic ? (
              <Image source={{ uri: user.profile_pic }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.primary }]}>{initials.charAt(0)}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.statCardTotal, borderColor: theme.border }]}
            onPress={() => setSelectedFilter('all')}
            activeOpacity={0.85}
          >
            <Text style={[styles.statNumber, { color: '#fff' }]}>{totalCount}</Text>
            <Text style={[styles.statLabel, { color: '#fff' }]}>Total Tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.statCardCompleted, borderColor: theme.border }]}
            onPress={() => setSelectedFilter('completed')}
            activeOpacity={0.85}
          >
            <Text style={[styles.statNumber, { color: '#fff' }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { color: '#fff' }]}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.statCardPending, borderColor: theme.border }]}
            onPress={() => setSelectedFilter('pending')}
            activeOpacity={0.85}
          >
            <Text style={[styles.statNumber, { color: '#fff' }]}>{pendingCount}</Text>
            <Text style={[styles.statLabel, { color: '#fff' }]}>Pending</Text>
          </TouchableOpacity>

          <View style={[styles.statCard, { backgroundColor: theme.statCardMissed, borderColor: theme.border }]}>
            <Text style={[styles.statNumber, { color: '#fff' }]}>{missedCount}</Text>
            <Text style={[styles.statLabel, { color: '#fff' }]}>Missed</Text>
          </View>
        </View>

        <View style={[styles.progressCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressTitle, { color: theme.text }]}>{"Today's Progress"}</Text>
              <Text style={[styles.progressSubText, { color: theme.subText }]}>
                {completedCount} of {totalCount} tasks completed
              </Text>
            </View>

            <View style={[styles.progressPercentBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.progressPercentText, { color: '#fff' }]}>{progressPercent}%</Text>
            </View>
          </View>

          <View style={[styles.progressBarTrack, { backgroundColor: theme.isDark ? theme.border : theme.softPrimary }]}>
            <View style={[styles.progressBarFill, { backgroundColor: theme.primary, width: `${progressPercent}%` }]} />
          </View>
        </View>

        <View style={[styles.calendarCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.calendarHeader}>
            <Text style={[styles.calendarTitle, { color: theme.text }]}>Calendar</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMonthModalVisible(true)}
            >
              <Text style={[styles.calendarLink, { color: theme.primary }]}>Month view</Text>
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
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: item.active ? theme.primary : theme.inputBg,
                    borderColor: item.active ? theme.primary : theme.border,
                  }
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedDate(item.fullDate)}
              >
                <Text style={[styles.dayText, { color: item.active ? '#fff' : theme.subText }]}>
                  {item.day}
                </Text>
                <Text style={[styles.dateText, { color: item.active ? '#fff' : theme.text }]}>
                  {item.date}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[
          styles.mainCard,
          { 
            backgroundColor: theme.primary,
            borderWidth: theme.isDark ? 1 : 0,
            borderColor: theme.border
          }
        ]}>
          <View style={styles.mainCardHeader}>
            <View style={styles.mainTitleWrap}>
              <Text style={[styles.cardTitle, { color: '#fff' }]}>{"Today's Plan"}</Text>
              <Text style={[styles.cardDate, { color: '#e0e0ff' }]}>{displaySelectedDate}</Text>
            </View>

            <View style={styles.actionPillsRow}>
              <TouchableOpacity
                style={[styles.aiTaskPill, { backgroundColor: theme.secondary }]}
                activeOpacity={0.85}
                onPress={() => navigateWithClose('/(tabs)/home/AISchedulerScreen')}
              >
                <Ionicons name="sparkles-outline" size={14} color="#fff" />
                <Text style={[styles.aiTaskPillText, { color: '#fff' }]}>Generate Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addTaskPill, { backgroundColor: theme.cardBg }]}
                activeOpacity={0.85}
                onPress={() => navigateWithClose('/(tabs)/home/add-task')}
              >
                <Text style={[styles.addTaskPillText, { color: theme.text }]}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedFilter === 'all' ? '#fff' : 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.1)'
                }
              ]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[
                styles.filterText,
                { color: selectedFilter === 'all' ? theme.primary : '#fff' }
              ]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedFilter === 'pending' ? '#fff' : 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.1)'
                }
              ]}
              onPress={() => setSelectedFilter('pending')}
            >
              <Text style={[
                styles.filterText,
                { color: selectedFilter === 'pending' ? theme.primary : '#fff' }
              ]}>
                Pending
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedFilter === 'completed' ? '#fff' : 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.1)'
                }
              ]}
              onPress={() => setSelectedFilter('completed')}
            >
              <Text style={[
                styles.filterText,
                { color: selectedFilter === 'completed' ? theme.primary : '#fff' }
              ]}>
                Completed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.taskList}>
          {filteredTasks.map((task) => (
            <View key={task.id} style={[styles.taskCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
                <Text style={[styles.taskTime, { color: theme.subText }]}>{task.time}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  task.status === 'pending'
                    ? { backgroundColor: theme.isDark ? 'rgba(59,130,246,0.16)' : theme.softAccent }
                    : { backgroundColor: theme.isDark ? 'rgba(34,197,94,0.16)' : '#ECFDF5' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    task.status === 'pending'
                      ? { color: theme.secondary }
                      : { color: theme.success },
                  ]}
                >
                  {task.status === 'pending' ? 'Pending' : 'Completed'}
                </Text>
              </View>
            </View>
          ))}

          {filteredTasks.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No tasks for selected date</Text>
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                This day has no tasks in the selected filter.
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.tipCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={18} color={theme.primary} />
            <Text style={[styles.tipTitle, { color: theme.text }]}>Productivity Tip</Text>
          </View>
          <Text style={[styles.tipText, { color: theme.subText }]}>
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
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setMonthModalVisible(false)}
          />

          <View style={[styles.modalSheet, { backgroundColor: theme.cardBg }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            <View style={styles.modalHeader}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  const prevMonth = new Date(selectedDate);
                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                  setSelectedDate(prevMonth);
                }}
              >
                <Ionicons name="chevron-back" size={22} color={theme.text} />
              </TouchableOpacity>

              <Text style={[styles.modalTitle, { color: theme.text }]}>
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
                <Ionicons name="chevron-forward" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={[styles.weekHeaderText, { color: theme.subText }]}>
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
                      item.isSelected && { backgroundColor: theme.primary },
                      item.isToday && !item.isSelected && { backgroundColor: theme.softPrimary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: theme.text },
                        !item.currentMonth && { color: theme.isDark ? '#4b5563' : '#bbb' },
                        item.isSelected && { color: '#fff' },
                        item.isToday && !item.isSelected && { color: theme.primary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {item.hasTasks && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.legendText, { color: theme.subText }]}>Has tasks</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.primary, opacity: 0.6 }]} />
                <Text style={[styles.legendText, { color: theme.subText }]}>Selected date</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.softPrimary }]} />
                <Text style={[styles.legendText, { color: theme.subText }]}>Today</Text>
              </View>
            </View>

            <View style={[styles.selectedTasksCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <View style={styles.selectedTasksHeader}>
                <Text style={[styles.selectedTasksTitle, { color: theme.text }]}>Selected Day</Text>
                <Text style={[styles.selectedTasksDate, { color: theme.subText }]}>{formattedSelectedDate}</Text>
                <View style={[styles.selectedTasksCount, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.selectedTasksCountText, { color: '#fff' }]}>
                    {selectedDateTasks.length} Tasks
                  </Text>
                </View>
              </View>

              {selectedDateTasks.length > 0 ? (
                selectedDateTasks.map((task) => (
                  <View key={task.id} style={[styles.modalTaskRow, { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalTaskTitle, { color: theme.text }]}>{task.title}</Text>
                      <Text style={[styles.modalTaskTime, { color: theme.subText }]}>{task.time}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        task.status === 'pending'
                          ? { backgroundColor: theme.isDark ? 'rgba(59,130,246,0.16)' : theme.softAccent }
                          : { backgroundColor: theme.isDark ? 'rgba(34,197,94,0.16)' : '#ECFDF5' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          task.status === 'pending'
                            ? { color: theme.secondary }
                            : { color: theme.success },
                        ]}
                      >
                        {task.status === 'pending' ? 'Pending' : 'Completed'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyModalTasks}>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>No tasks</Text>
                  <Text style={[styles.emptyText, { color: theme.subText }]}>
                    No tasks available on this selected date.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.goToDateBtn, { backgroundColor: theme.primary }]}
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
            <View style={[styles.drawer, { backgroundColor: theme.cardBg }]}>
              <View style={[styles.drawerTop, { backgroundColor: theme.primary }]}>
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
                    {user?.profile_pic ? (
                      <Image source={{ uri: user.profile_pic }} style={styles.profileImage} />
                    ) : (
                      <Text style={styles.profileLetter}>{initials.charAt(0)}</Text>
                    )}
                  </View>

                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {USER_NAME}
                    </Text>
                    <Text style={styles.profileSub} numberOfLines={1}>
                      {"Let's plan your day smartly"}
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
                    style={[
                      styles.menuItem,
                      item.active && { backgroundColor: theme.activeBg }
                    ]}
                    activeOpacity={0.85}
                    onPress={item.onPress}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: theme.inputBg }]}>
                      <Ionicons
                        name={item.icon as any}
                        size={19}
                        color={item.active ? theme.activeText : theme.subText}
                      />
                    </View>
                    <Text style={[
                      styles.menuText,
                      { color: theme.text },
                      item.active && { color: theme.activeText, fontWeight: '800' }
                    ]}>
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
          <View style={[styles.quickActionsMenu, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.85}
              onPress={() => navigateWithClose('/(tabs)/home/add-task')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.inputBg }]}>
                <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.quickActionText, { color: theme.text }]}>Add Task</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.85}
              onPress={() => navigateWithClose('/(tabs)/home/today-plan')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.inputBg }]}>
                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.quickActionText, { color: theme.text }]}>{"Today's Plan"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.85}
              onPress={() => navigateWithClose('/(tabs)/tasks')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.inputBg }]}>
                <Ionicons name="list-outline" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.quickActionText, { color: theme.text }]}>Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.85}
              onPress={() => navigateWithClose('/(tabs)/home/AISchedulerScreen')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.inputBg }]}>
                <Ionicons name="sparkles-outline" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.quickActionText, { color: theme.text }]}>AI Scheduler</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
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

      <View style={[styles.fabLabelWrap, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={[styles.fabLabel, { color: theme.primary }]}>AI Plan</Text>
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
  },
  topBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
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
    borderWidth: 1,
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  hello: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  subText: {
    fontSize: 13,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
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
  },
  totalCard: {},
  completedCard: {},
  pendingCard: {},
  missedCard: {},
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressCard: {
    borderRadius: 20,
    borderWidth: 1.2,
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
    marginBottom: 3,
  },
  progressSubText: {
    fontSize: 13,
  },
  progressPercentBadge: {
    minWidth: 58,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  progressPercentText: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  calendarCard: {
    borderRadius: 20,
    borderWidth: 1.2,
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
  },
  calendarLink: {
    fontSize: 13,
    fontWeight: '700',
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
    borderWidth: 1,
  },
  dateChipActive: {},
  dayText: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '800',
  },
  dateChipTextActive: {},
  mainCard: {
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
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
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
  },
  aiTaskPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  addTaskPill: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskPillText: {
    fontSize: 12,
    fontWeight: '800',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterChipActive: {},
  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {},
  taskList: {
    gap: 10,
    marginBottom: 16,
  },
  taskCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  taskTime: {
    fontSize: 12.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {},
  completedBadge: {},
  statusText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  pendingBadgeText: {},
  completedBadgeText: {},
  tipCard: {
    borderWidth: 1.2,
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
  },
  tipText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  emptyCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
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
  selectedDayWrap: {},
  todayDayWrap: {},
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  otherMonthText: {},
  selectedDayText: {},
  todayDayText: {},
  dot: {
    marginTop: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
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
  },
  selectedTasksCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  selectedTasksHeader: {
    marginBottom: 10,
  },
  selectedTasksTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  selectedTasksDate: {
    fontSize: 13,
    marginBottom: 8,
  },
  selectedTasksCount: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedTasksCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  modalTaskTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  modalTaskTime: {
    fontSize: 12,
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
  },
  goToDateBtnText: {
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
  menuItemActive: {},
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  menuTextActive: {},
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
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 120,
    width: 58,
    height: 58,
    borderRadius: 29,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 19,
  },
  fabLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
});
