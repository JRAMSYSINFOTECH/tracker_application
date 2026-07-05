import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import type { TaskItem } from '../../../constants/src/context/TaskContext';
import { useTheme } from '../../../constants/src/context/ThemeContext';
import { occurrenceApi } from '../../../services/api';
import type { OccurrenceStatus } from '../../../services/api';

type FilterType = 'All' | 'ToDo' | 'InProgress' | 'Completed';

type PlanItem = {
  taskId: number;
  date: string;
  time: string;
  title: string;
  note: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: Exclude<FilterType, 'All'>;
  repeat_frequency: TaskItem['repeat_frequency'];
  hasOverlap: boolean;
  estimatedMinutes: number;
  deadlineMs: number; // for overlap computation
};

// ── Recurrence helpers ────────────────────────────────────────────────
function taskAppearsOnDate(task: TaskItem, dateIso: string): boolean {
  const target = new Date(dateIso + 'T00:00:00');
  const taskDate = new Date(task.deadline);
  const taskDateIso = formatDateToISO(taskDate);

  switch (task.repeat_frequency) {
    case 'once':
      // Show only on the task's own deadline date; hide if date has passed
      return taskDateIso === dateIso;

    case 'daily':
      // Show every day on or after the task's start date (unless permanently completed/missed)
      if (task.status === 'missed') return false;
      return taskDate <= new Date(dateIso + 'T23:59:59');

    case 'weekly': {
      // Show once per week on the same day-of-week as the original deadline
      if (task.status === 'missed') return false;
      const taskDayOfWeek = taskDate.getDay();
      const targetDayOfWeek = target.getDay();
      if (taskDayOfWeek !== targetDayOfWeek) return false;
      return taskDate <= new Date(dateIso + 'T23:59:59');
    }

    case 'custom': {
      // Show only on days matching repeat_days (e.g. "1,3,5")
      if (task.status === 'missed') return false;
      if (!task.repeat_days) return false;
      const repeatDayNumbers = task.repeat_days
        .split(',')
        .map((d) => parseInt(d.trim()))
        .filter((d) => !isNaN(d));
      const targetDOW = target.getDay();
      if (!repeatDayNumbers.includes(targetDOW)) return false;
      return taskDate <= new Date(dateIso + 'T23:59:59');
    }

    default:
      return false;
  }
}

function detectOverlaps(items: PlanItem[]): Set<number> {
  const overlappingIds = new Set<number>();
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      const aEnd = a.deadlineMs + a.estimatedMinutes * 60_000;
      const bEnd = b.deadlineMs + b.estimatedMinutes * 60_000;
      // Strict overlap: touching endpoints are NOT overlapping
      if (a.deadlineMs < bEnd && aEnd > b.deadlineMs) {
        overlappingIds.add(a.taskId);
        overlappingIds.add(b.taskId);
      }
    }
  }
  return overlappingIds;
}

export default function TodayPlanScreen() {
  const router = useRouter();
  const { tasks, loadTasks } = useTaskContext();
  const { theme } = useTheme();

  const today = new Date();
  const todayIso = formatDateToISO(today);

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [showPicker, setShowPicker] = useState(false);

  // Per-day occurrence map: taskId → OccurrenceStatus for selectedDate
  const [occurrenceMap, setOccurrenceMap] = useState<Record<number, OccurrenceStatus>>({});
  const [occurrenceLoading, setOccurrenceLoading] = useState(false);

  const loadOccurrences = useCallback(async (date: string) => {
    setOccurrenceLoading(true);
    try {
      const data = await occurrenceApi.getForDate(date);
      const map: Record<number, OccurrenceStatus> = {};
      data.forEach((o) => { map[o.task_id] = o.status; });
      setOccurrenceMap(map);
    } catch {
      // silently ignore — occurrence data is best-effort
    } finally {
      setOccurrenceLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOccurrences(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // Build plan items for the selected date applying recurrence rules
  const allPlansForDate = useMemo<PlanItem[]>(() => {
    const applicable = tasks.filter((t) => taskAppearsOnDate(t, selectedDate));

    const items: PlanItem[] = applicable.map((task) => {
      const taskDate = new Date(task.deadline);
      const occStatus = occurrenceMap[task.id];

      // Effective status: use occurrence record if available (recurring tasks),
      // otherwise fall back to task.status for once tasks
      let effectiveStatus: PlanItem['status'];
      if (occStatus === 'completed') {
        effectiveStatus = 'Completed';
      } else if (task.status === 'completed' && task.repeat_frequency === 'once') {
        effectiveStatus = 'Completed';
      } else {
        effectiveStatus = 'ToDo';
      }

      return {
        taskId: task.id,
        date: formatDateToISO(taskDate),
        time: taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: task.title,
        note: task.description || (task.repeat_frequency !== 'once'
          ? `Repeats ${task.repeat_frequency}`
          : 'Task from planner'),
        icon: effectiveStatus === 'Completed' ? 'checkmark-circle-outline' : 'clipboard-outline',
        status: effectiveStatus,
        repeat_frequency: task.repeat_frequency,
        hasOverlap: false, // computed below
        estimatedMinutes: task.estimated_minutes ?? 60,
        deadlineMs: taskDate.getTime(),
      };
    });

    // Sort by time ascending
    items.sort((a, b) => a.deadlineMs - b.deadlineMs);

    // Detect overlaps
    const overlappingIds = detectOverlaps(items);
    return items.map((item) => ({
      ...item,
      hasOverlap: overlappingIds.has(item.taskId),
    }));
  }, [tasks, selectedDate, occurrenceMap]);

  const filters: FilterType[] = ['All', 'ToDo', 'InProgress', 'Completed'];

  const selectedDateLabel = useMemo(() => {
    return formatDateForDisplay(new Date(selectedDate + 'T12:00:00'));
  }, [selectedDate]);

  const filteredPlans = useMemo(() => {
    if (selectedFilter === 'All') return allPlansForDate;
    return allPlansForDate.filter((item) => item.status === selectedFilter);
  }, [allPlansForDate, selectedFilter]);

  const completionPercent = useMemo(() => {
    if (allPlansForDate.length === 0) return 0;
    const completedCount = allPlansForDate.filter((item) => item.status === 'Completed').length;
    return Math.round((completedCount / allPlansForDate.length) * 100);
  }, [allPlansForDate]);

  // Build marked dates — mark every date that has at least one applicable task
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    tasks.forEach((task) => {
      // For recurring tasks, mark each day-of-week pattern differently
      // For simplicity, always mark the exact task deadline date
      const taskDateIso = formatDateToISO(new Date(task.deadline));
      marked[taskDateIso] = {
        ...(marked[taskDateIso] || {}),
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
  }, [tasks, selectedDate, theme]);

  const handleMarkDone = async (item: PlanItem) => {
    const newStatus: OccurrenceStatus =
      occurrenceMap[item.taskId] === 'completed' ? 'pending' : 'completed';
    try {
      await occurrenceApi.mark({
        task_id: item.taskId,
        occurrence_date: selectedDate,
        status: newStatus,
      });
      setOccurrenceMap((prev) => ({ ...prev, [item.taskId]: newStatus }));
    } catch {
      // silently ignore
    }
  };

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
      case 'ToDo': return styles.todoBadge;
      case 'InProgress': return styles.progressBadge;
      case 'Completed': return styles.completedBadge;
      default: return styles.todoBadge;
    }
  };

  const getStatusTextStyle = (status: PlanItem['status']) => {
    switch (status) {
      case 'ToDo': return styles.todoText;
      case 'InProgress': return styles.progressText;
      case 'Completed': return styles.completedText;
      default: return styles.todoText;
    }
  };

  const getRepeatBadge = (freq: TaskItem['repeat_frequency']) => {
    switch (freq) {
      case 'daily': return { label: '🔄 Daily', color: '#6366F1' };
      case 'weekly': return { label: '📅 Weekly', color: '#0EA5E9' };
      case 'custom': return { label: '⚙️ Custom', color: '#8B5CF6' };
      default: return null;
    }
  };

  const openPicker = () => setShowPicker(true);

  const onChangeDate = (_event: any, date?: Date) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (date) handleDateChange(formatDateToISO(date));
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
            value={new Date(selectedDate + 'T12:00:00')}
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
                {allPlansForDate.length === 0
                  ? 'No tasks scheduled for this date. Enjoy your free time!'
                  : `${allPlansForDate.length} task${allPlansForDate.length > 1 ? 's' : ''} scheduled. Stay focused!`}
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
                { width: `${Math.max(completionPercent, 6)}%` as any, backgroundColor: theme.progressFill },
              ]}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.planTitle }]}>Month Calendar</Text>

        <View style={[styles.calendarCard, { backgroundColor: theme.dateCardBg, borderColor: theme.dateCardBorder }]}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => handleDateChange(day.dateString)}
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

        {occurrenceLoading && (
          <ActivityIndicator size="small" color={theme.primary} style={{ marginBottom: 12 }} />
        )}

        {filteredPlans.map((item, index) => {
          const repeatBadge = getRepeatBadge(item.repeat_frequency);
          const isDoneToday = occurrenceMap[item.taskId] === 'completed';
          const isRecurring = item.repeat_frequency !== 'once';

          return (
            <View key={`${item.taskId}-${index}`} style={styles.timelineRow}>
              <View style={styles.timelineTimeWrap}>
                <Text style={[styles.timelineTime, { color: theme.timelineTime }]}>{item.time}</Text>
              </View>

              <View style={styles.timelineTrackWrap}>
                <View style={[
                  styles.timelineDot,
                  { backgroundColor: item.hasOverlap ? '#E97316' : theme.timelineDot }
                ]} />
                {index !== filteredPlans.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: theme.timelineLine }]} />
                )}
              </View>

              <View style={[
                styles.timelineCard,
                { backgroundColor: theme.timelineCardBg, borderColor: item.hasOverlap ? '#E97316' : theme.timelineCardBorder },
                item.hasOverlap && styles.overlapCard,
              ]}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.iconBox, { backgroundColor: theme.iconBoxBg }]}>
                    <Ionicons name={item.icon} size={18} color={theme.planTitle} />
                  </View>

                  <View style={styles.badgesRow}>
                    {item.hasOverlap && (
                      <View style={styles.overlapBadge}>
                        <Ionicons name="warning-outline" size={12} color="#E97316" />
                        <Text style={styles.overlapBadgeText}>Overlap</Text>
                      </View>
                    )}
                    {repeatBadge && (
                      <View style={[styles.repeatBadge, { borderColor: repeatBadge.color }]}>
                        <Text style={[styles.repeatBadgeText, { color: repeatBadge.color }]}>{repeatBadge.label}</Text>
                      </View>
                    )}
                    <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                      <Text style={[styles.statusBadgeText, getStatusTextStyle(item.status)]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.planTitle, { color: theme.planTitleText }]}>{item.title}</Text>
                <Text style={[styles.planNote, { color: theme.planNoteText }]}>{item.note}</Text>

                {/* Per-day done button for recurring tasks */}
                {isRecurring && (
                  <TouchableOpacity
                    style={[
                      styles.doneBtn,
                      { backgroundColor: isDoneToday ? '#22c55e20' : theme.dateIconWrapBg, borderColor: isDoneToday ? '#22c55e' : theme.dateCardBorder }
                    ]}
                    onPress={() => handleMarkDone(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isDoneToday ? 'checkmark-circle' : 'checkmark-circle-outline'}
                      size={16}
                      color={isDoneToday ? '#22c55e' : theme.planTitle}
                    />
                    <Text style={[styles.doneBtnText, { color: isDoneToday ? '#22c55e' : theme.planTitle }]}>
                      {isDoneToday ? "Done today ✓" : "Mark done today"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

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
          <Ionicons name="add" size={20} color={theme.planPrimaryBtnText} />
          <Text style={[styles.primaryBtnText, { color: theme.planPrimaryBtnText }]}>Add New Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDateToISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  dateLabel: { fontSize: 13, color: '#777', marginBottom: 2 },
  dateValue: { fontSize: 16, color: '#111', fontWeight: '700' },
  changeDateBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  changeDateBtnText: { color: '#111', fontSize: 12, fontWeight: '700' },
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
  highlightTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  highlightText: { fontSize: 14, lineHeight: 20 },
  percentBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentValue: { fontSize: 22, fontWeight: '800' },
  percentLabel: { fontSize: 12, marginTop: 2 },
  progressTrack: { height: 10, borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 10 },
  sectionTitle: { fontSize: 22, marginBottom: 12, fontWeight: '700' },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 10,
    marginBottom: 20,
  },
  calendar: { borderRadius: 18, overflow: 'hidden' },
  filterRow: { paddingBottom: 14, gap: 10 },
  filterChip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: { fontSize: 14, fontWeight: '500' },
  activeFilterText: { fontWeight: '700' },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  scheduleDateText: { fontSize: 13, fontWeight: '700' },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timelineTimeWrap: { width: 78, paddingTop: 10 },
  timelineTime: { fontSize: 14, fontWeight: '700' },
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
  overlapCard: {
    borderWidth: 1.5,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  overlapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E97316',
  },
  overlapBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E97316',
  },
  repeatBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  repeatBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  todoBadge: { backgroundColor: '#FCE7F3' },
  todoText: { color: '#C0266D' },
  progressBadge: { backgroundColor: '#FEF3C7' },
  progressText: { color: '#B45309' },
  completedBadge: { backgroundColor: '#DCFCE7' },
  completedText: { color: '#15803D' },
  planTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  planNote: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 4,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptyText: { fontSize: 14, lineHeight: 20 },
  primaryBtn: {
    height: 48,
    borderWidth: 1,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
});
