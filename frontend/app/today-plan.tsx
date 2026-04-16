import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type FilterType = 'All' | 'ToDo' | 'InProgress' | 'Completed';

export default function TodayPlanScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');

  const todayDate = '14 Apr 2026';

  const plans = [
    {
      time: '07:00 AM',
      title: 'Morning Revision',
      note: 'Revise Java concepts and formulas.',
      icon: 'book-outline',
      status: 'ToDo',
    },
    {
      time: '10:00 AM',
      title: 'Coding Practice',
      note: 'Solve 3 DSA problems from arrays and strings.',
      icon: 'code-slash-outline',
      status: 'InProgress',
    },
    {
      time: '02:00 PM',
      title: 'Project Work',
      note: 'Continue Kubernetes + Jenkins explanation.',
      icon: 'laptop-outline',
      status: 'ToDo',
    },
    {
      time: '06:00 PM',
      title: 'Mock Test',
      note: 'Take one aptitude or coding mock test.',
      icon: 'timer-outline',
      status: 'Completed',
    },
  ];

  const filters: FilterType[] = ['All', 'ToDo', 'InProgress', 'Completed'];

  const filteredPlans = useMemo(() => {
    if (selectedFilter === 'All') return plans;
    return plans.filter((item) => item.status === selectedFilter);
  }, [selectedFilter]);

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
            <Text style={styles.dateLabel}>Today’s Date</Text>
            <Text style={styles.dateValue}>{todayDate}</Text>
          </View>
        </View>

        <View style={styles.highlightCard}>
          <Text style={styles.highlightTitle}>Focus for Today</Text>
          <Text style={styles.highlightText}>
            Complete important tasks first, then continue practice and revision.
          </Text>
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

        {filteredPlans.map((item, index) => (
          <View key={index} style={styles.planCard}>
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

        {filteredPlans.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptyText}>
              There are no tasks available in this status right now.
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