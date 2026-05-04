import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  dashboardApi,
  getApiErrorMessage,
  TaskStatus,
  TodayPlanItem,
} from '../services/api';

type FilterType = 'All' | 'ToDo' | 'InProgress' | 'Completed' | 'Missed';
type DisplayStatus = Exclude<FilterType, 'All'>;

type PlanType = {
  id: number;
  taskId: number;
  order: number;
  time: string;
  title: string;
  note: string;
  icon: string;
  status: DisplayStatus;
};

const backendStatusToDisplay: Record<TaskStatus, DisplayStatus> = {
  pending: 'ToDo',
  in_progress: 'InProgress',
  completed: 'Completed',
  missed: 'Missed',
};

const formatTodayDate = () =>
  new Date().toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatDeadline = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No deadline';
  }

  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getPlanIcon = (item: TodayPlanItem) => {
  if (item.task.status === 'completed') {
    return 'checkmark-circle-outline';
  }

  switch (item.task.importance_hint) {
    case 'high':
      return 'timer-outline';
    case 'medium':
      return 'calendar-outline';
    default:
      return 'book-outline';
  }
};

const mapTodayPlanItem = (item: TodayPlanItem): PlanType => ({
  id: item.plan_item_id,
  taskId: item.task_id,
  order: item.slot_order,
  time: `Task ${item.slot_order}`,
  title: item.task.title,
  note: `Due ${formatDeadline(item.task.deadline)} - Priority ${
    item.task.importance_hint || 'none'
  }`,
  icon: getPlanIcon(item),
  status: backendStatusToDisplay[item.task.status],
});

export default function TodayPlanScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const todayDate = formatTodayDate();
  const filters: FilterType[] = ['All', 'ToDo', 'InProgress', 'Completed', 'Missed'];

  const loadTodayPlan = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      let planItems = await dashboardApi.todayPlan();

      if (planItems.length === 0) {
        const generated = await dashboardApi.generatePlan();

        if (generated.message !== 'No tasks to plan') {
          planItems = await dashboardApi.todayPlan();
        }
      }

      setPlans(planItems.map(mapTodayPlanItem));
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not load today plan.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodayPlan();
    }, [loadTodayPlan])
  );

  const filteredPlans = useMemo(() => {
    if (selectedFilter === 'All') return plans;
    return plans.filter((item) => item.status === selectedFilter);
  }, [plans, selectedFilter]);

  const focusText =
    plans.length > 0
      ? `Start with ${plans[0].title}, then continue in the planned order.`
      : 'Add a task to build a plan for today.';

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
      style={[styles.filterChip, active && styles.activeFilterChip]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.filterText, active && styles.activeFilterText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ToDo':
        return styles.todoBadge;
      case 'InProgress':
        return styles.progressBadge;
      case 'Completed':
        return styles.completedBadge;
      case 'Missed':
        return styles.missedBadge;
      default:
        return styles.todoBadge;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'ToDo':
        return styles.todoText;
      case 'InProgress':
        return styles.progressText;
      case 'Completed':
        return styles.completedText;
      case 'Missed':
        return styles.missedText;
      default:
        return styles.todoText;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topShape} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>

        <Text style={styles.title}>Today Plan</Text>
        <Text style={styles.subtitle}>Manage your day with a simple planned schedule.</Text>

        <View style={styles.dateCard}>
          <View style={styles.dateIconWrap}>
            <Ionicons name="calendar-outline" size={20} color="#111" />
          </View>
          <View>
            <Text style={styles.dateLabel}>{"Today's Date"}</Text>
            <Text style={styles.dateValue}>{todayDate}</Text>
          </View>
        </View>

        <View style={styles.highlightCard}>
          <Text style={styles.highlightTitle}>Focus for Today</Text>
          <Text style={styles.highlightText}>{focusText}</Text>
        </View>

        <Text style={styles.sectionTitle}>Task Status</Text>
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

        <Text style={styles.sectionTitle}>Your Schedule</Text>

        {isLoading && (
          <View style={styles.emptyCard}>
            <ActivityIndicator color="#111" />
            <Text style={styles.emptyText}>Loading today plan...</Text>
          </View>
        )}

        {!isLoading && loadError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Could not load today plan</Text>
            <Text style={styles.emptyText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadTodayPlan}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isLoading &&
          !loadError &&
          filteredPlans.map((item) => (
            <View key={item.id} style={styles.planCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.timePill}>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>

                <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  <Text style={[styles.statusBadgeText, getStatusTextStyle(item.status)]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.planRow}>
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon as any} size={20} color="#111" />
                </View>

                <View style={styles.planTextWrap}>
                  <Text style={styles.planTitle}>{item.title}</Text>
                  <Text style={styles.planNote}>{item.note}</Text>
                </View>
              </View>
            </View>
          ))}

        {!isLoading && !loadError && filteredPlans.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptyText}>
              There are no planned tasks available in this status right now.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/add-task')}>
          <Text style={styles.primaryBtnText}>Add New Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  topShape: {
    position: 'absolute',
    top: -35,
    alignSelf: 'center',
    width: 190,
    height: 150,
    backgroundColor: '#F4CCFF',
    borderBottomLeftRadius: 95,
    borderBottomRightRadius: 95,
    zIndex: 0,
  },

  scrollContent: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    paddingTop: 56,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E9D9EE',
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
    backgroundColor: '#F4CCFF',
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

  highlightCard: {
    backgroundColor: '#F4CCFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
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

  sectionTitle: {
    fontSize: 17,
    color: '#111',
    marginBottom: 12,
    fontWeight: '600',
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
    backgroundColor: '#F4CCFF',
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

  planCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9D9EE',
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  timePill: {
    backgroundColor: '#F4CCFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },

  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
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

  missedBadge: {
    backgroundColor: '#FEE2E2',
  },

  missedText: {
    color: '#B91C1C',
  },

  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4CCFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  planTextWrap: {
    flex: 1,
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

  retryBtn: {
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
  },

  retryText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '600',
  },

  primaryBtn: {
    height: 46,
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
    color: '#D094E8',
    fontSize: 16,
    fontWeight: '500',
  },
});
