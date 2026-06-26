import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useTaskContext } from '../../../constants/src/context/TaskContext';
import { useTheme } from '../../../constants/src/context/ThemeContext';

type FilterType = 'All' | 'ToDo' | 'InProgress' | 'Completed';

type PlanItem = {
  date: string;
  time: string;
  title: string;
  note: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: Exclude<FilterType, 'All'>;
};

export default function TodayPlanScreen() {
  const router = useRouter();
  const { tasks } = useTaskContext();
  const { theme } = useTheme();

  const today = new Date();
  const todayIso = formatDateToISO(today);

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [showPicker, setShowPicker] = useState(false);

  const plans: PlanItem[] = tasks.map((task) => {

    const taskDate = new Date(task.time);

    return {
      date: formatDateToISO(taskDate),

      time: taskDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),

      title: task.title,

      note: 'Task from planner',

      icon:
        task.status === 'completed'
          ? 'checkmark-circle-outline'
          : 'clipboard-outline',

      status:
        task.status === 'completed'
          ? 'Completed'
          : 'ToDo',
    };
  });

  const filters: FilterType[] = ['All', 'ToDo', 'InProgress', 'Completed'];

  const selectedDateLabel = useMemo(() => {
    return formatDateForDisplay(new Date(selectedDate));
  }, [selectedDate]);

  const filteredPlans = useMemo(() => {
    const datePlans = plans.filter((item) => item.date === selectedDate);
    if (selectedFilter === 'All') return datePlans;
    return datePlans.filter((item) => item.status === selectedFilter);
  }, [selectedDate, selectedFilter]);

  const completionPercent = useMemo(() => {
    const datePlans = plans.filter((item) => item.date === selectedDate);
    if (datePlans.length === 0) return 0;
    const completedCount = datePlans.filter(
      (item) => item.status === 'Completed'
    ).length;
    return Math.round((completedCount / datePlans.length) * 100);
  }, [selectedDate]);

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    plans.forEach((item) => {
      marked[item.date] = {
        ...(marked[item.date] || {}),
        marked: true,
        dotColor: theme.calendarDot,
      };
    });

    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: theme.calendarSelectedBg,
      marked: true,
      dotColor: theme.text,
    };

    return marked;
  }, [plans, selectedDate]);

  const FilterChip = ({
    label,
    active,
    onPress,
  }: {
    label: FilterType;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.filterChip, { backgroundColor: theme.filterBg, borderColor: theme.filterBorder }, active && { backgroundColor: theme.activeFilterBg }]}
    >
      <Text style={[styles.filterText, { color: theme.text }, active && styles.activeFilterText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getStatusStyle = (status: PlanItem['status']) => {
    switch (status) {
      case 'ToDo':
        return styles.todoBadge;
      case 'InProgress':
        return styles.progressBadge;
      case 'Completed':
        return styles.completedBadge;
      default:
        return styles.todoBadge;
    }
  };

  const getStatusTextStyle = (status: PlanItem['status']) => {
    switch (status) {
      case 'ToDo':
        return styles.todoText;
      case 'InProgress':
        return styles.progressText;
      case 'Completed':
        return styles.completedText;
      default:
        return styles.todoText;
    }
  };

  const openPicker = () => {
    setShowPicker(true);
  };

  const onChangeDate = (_event: any, date?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }
    if (date) {
      setSelectedDate(formatDateToISO(date));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.planContainerBg }]} edges={['top', 'left', 'right']}>
      <View style={[styles.topShape, { backgroundColor: theme.planTopShapeBg }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.planTitle} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.planTitle }]}>Today Plan</Text>
        <Text style={[styles.subtitle, { color: theme.planSubtitle }]}>
          Visualize your day like a calendar and stay on track.
        </Text>

        <View style={[styles.dateCard, { backgroundColor: theme.dateCardBg, borderColor: theme.dateCardBorder }]}>
          <View style={[styles.dateIconWrap, { backgroundColor: theme.dateIconWrapBg }]}>
            <Ionicons name="calendar-outline" size={20} color={theme.planTitle} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.dateLabel, { color: theme.dateLabel }]}>Selected Date</Text>
            <Text style={[styles.dateValue, { color: theme.dateValue }]}>{selectedDateLabel}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openPicker}
            style={[styles.changeDateBtn, { backgroundColor: theme.changeDateBtnBg }]}
          >
            <Text style={[styles.changeDateBtnText, { color: theme.changeDateBtnText }]}>Change Date</Text>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={new Date(selectedDate)}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}

        <View style={[styles.highlightCard, { backgroundColor: theme.highlightCardBg }]}>
          <View style={styles.highlightTopRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={[styles.highlightTitle, { color: theme.highlightTitle }]}>Focus for Today</Text>
              <Text style={[styles.highlightText, { color: theme.highlightText }]}>
                Complete important tasks first, then continue practice and revision.
              </Text>
            </View>

            <View style={[styles.percentBadge, { backgroundColor: theme.percentBg }]}>
              <Text style={[styles.percentValue, { color: theme.percentValue }]}>{completionPercent}%</Text>
              <Text style={[styles.percentLabel, { color: theme.percentLabel }]}>done</Text>
            </View>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: theme.progressTrack }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(completionPercent, 6)}%`, backgroundColor: theme.progressFill },
              ]}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.planTitle }]}>Month Calendar</Text>

        <View style={[styles.calendarCard, { backgroundColor: theme.dateCardBg, borderColor: theme.dateCardBorder }]}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            enableSwipeMonths
            theme={{
              backgroundColor: theme.calendarBg,
              calendarBackground: theme.calendarBg,
              textSectionTitleColor: theme.calendarHeaderText,
              selectedDayBackgroundColor: theme.calendarSelectedBg,
              selectedDayTextColor: theme.isDark ? '#fff' : '#111111',
              todayTextColor: theme.calendarTodayText,
              dayTextColor: theme.text,
              textDisabledColor: theme.calendarDisabledText,
              dotColor: theme.calendarDot,
              selectedDotColor: theme.text,
              arrowColor: theme.primary,
              monthTextColor: theme.text,
              indicatorColor: theme.primary,
              textDayFontWeight: '600',
              textMonthFontWeight: '800',
              textDayHeaderFontWeight: '700',
              textDayFontSize: 14,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
            style={styles.calendar}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.planTitle }]}>Task Status</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((item) => (
            <FilterChip
              key={item}
              label={item}
              active={selectedFilter === item}
              onPress={() => setSelectedFilter(item)}
            />
          ))}
        </ScrollView>

        <View style={styles.scheduleHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.planTitle }]}>Day Schedule</Text>
          <Text style={[styles.scheduleDateText, { color: theme.planScheduleDate }]}>{selectedDateLabel}</Text>
        </View>

        {filteredPlans.map((item, index) => (
          <View key={`${item.title}-${index}`} style={styles.timelineRow}>
            <View style={styles.timelineTimeWrap}>
              <Text style={[styles.timelineTime, { color: theme.timelineTime }]}>{item.time}</Text>
            </View>

            <View style={styles.timelineTrackWrap}>
              <View style={[styles.timelineDot, { backgroundColor: theme.timelineDot }]} />
              {index !== filteredPlans.length - 1 && (
                <View style={[styles.timelineLine, { backgroundColor: theme.timelineLine }]} />
              )}
            </View>

            <View style={[styles.timelineCard, { backgroundColor: theme.timelineCardBg, borderColor: theme.timelineCardBorder }]}>
              <View style={styles.cardTopRow}>
                <View style={[styles.iconBox, { backgroundColor: theme.iconBoxBg }]}>
                  <Ionicons name={item.icon} size={18} color={theme.planTitle} />
                </View>

                <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      getStatusTextStyle(item.status),
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={[styles.planTitle, { color: theme.planTitleText }]}>{item.title}</Text>
              <Text style={[styles.planNote, { color: theme.planNoteText }]}>{item.note}</Text>
            </View>
          </View>
        ))}

        {filteredPlans.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.emptyCardBg, borderColor: theme.emptyCardBorder }]}>
            <Text style={[styles.emptyTitle, { color: theme.emptyTitle }]}>No tasks found</Text>
            <Text style={[styles.emptyText, { color: theme.emptyText }]}>
              There are no tasks available for this date or status right now.
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.primaryBtn, { backgroundColor: theme.primaryBtnBg, borderColor: theme.primaryBtnBorder }]}
          onPress={() => router.push('/(tabs)/home/add-task')}
        >
          <Text style={[styles.primaryBtnText, { color: theme.planPrimaryBtnText }]}>Add New Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDateToISO(date: Date) {
  return date.toISOString().split('T')[0];
}

function getDateWithOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateToISO(date);
}

function formatDateForDisplay(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topShape: {
    position: 'absolute',
    top: -35,
    alignSelf: 'center',
    width: 190,
    height: 150,
    borderBottomLeftRadius: 95,
    borderBottomRightRadius: 95,
    zIndex: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  backBtn: {
    marginTop: 10,
    marginBottom: 20,
    width: 30,
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
    marginBottom: 6,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  dateCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateLabel: {
    fontSize: 13,
    color: '#777',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    color: '#111',
    fontWeight: '700',
  },
  changeDateBtn: {
    backgroundColor: '#F9EDB8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  changeDateBtnText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '700',
  },
  highlightCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  highlightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  percentBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  percentLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  progressTrack: {
    height: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 22,
    color: '#111',
    marginBottom: 12,
    fontWeight: '700',
  },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 10,
    marginBottom: 20,
  },
  calendar: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  filterRow: {
    paddingBottom: 14,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  activeFilterChip: {
    borderColor: '#111',
  },
  filterText: {
    fontSize: 14,
    color: '#111',
    fontWeight: '500',
  },
  activeFilterText: {
    fontWeight: '700',
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  scheduleDateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timelineTimeWrap: {
    width: 78,
    paddingTop: 10,
  },
  timelineTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  timelineTrackWrap: {
    width: 26,
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 14,
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: 28,
    width: 2,
    height: '100%',
  },
  timelineCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginLeft: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  todoBadge: {
    backgroundColor: '#FCE7F3',
  },
  todoText: {
    color: '#C0266D',
  },
  progressBadge: {
    backgroundColor: '#FEF3C7',
  },
  progressText: {
    color: '#B45309',
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
  },
  completedText: {
    color: '#15803D',
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  planNote: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  primaryBtn: {
    height: 48,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});