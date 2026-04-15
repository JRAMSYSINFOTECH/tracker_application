import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type FilterType = 'All' | 'ToDo' | 'InProgress' | 'Completed';

type TaskType = {
  id: number;
  title: string;
  note: string;
  time: string;
  status: FilterType;
};

export default function MyTasksScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [tasks, setTasks] = useState<TaskType[]>([
    {
      id: 1,
      title: 'Morning Revision',
      note: 'Revise Java concepts and notes.',
      time: '07:00 AM',
      status: 'ToDo',
    },
    {
      id: 2,
      title: 'Coding Practice',
      note: 'Solve 3 DSA problems today.',
      time: '10:00 AM',
      status: 'InProgress',
    },
    {
      id: 3,
      title: 'Project Work',
      note: 'Continue Kubernetes project explanation.',
      time: '02:00 PM',
      status: 'ToDo',
    },
    {
      id: 4,
      title: 'Mock Test',
      note: 'Complete one aptitude mock test.',
      time: '06:00 PM',
      status: 'Completed',
    },
  ]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState<FilterType>('ToDo');

  const filters: FilterType[] = ['All', 'ToDo', 'InProgress', 'Completed'];

  const filteredTasks = useMemo(() => {
    let filtered =
      selectedFilter === 'All'
        ? tasks
        : tasks.filter((item) => item.status === selectedFilter);

    if (searchText.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchText.toLowerCase()) ||
          item.note.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return filtered;
  }, [selectedFilter, searchText, tasks]);

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

  const handleDeleteTask = (id: number) => {
    setTasks((prev) => prev.filter((item) => item.id !== id));
  };

  const openEditModal = (task: TaskType) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditNote(task.note);
    setEditTime(task.time);
    setEditStatus(task.status);
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim() || !editNote.trim() || !editTime.trim()) {
      Alert.alert('Missing details', 'Please fill all edit fields.');
      return;
    }

    setTasks((prev) =>
      prev.map((item) =>
        item.id === editingTaskId
          ? {
              ...item,
              title: editTitle,
              note: editNote,
              time: editTime,
              status: editStatus,
            }
          : item
      )
    );

    setEditModalVisible(false);
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
      style={[styles.filterChip, active && styles.activeFilterChip]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.filterText, active && styles.activeFilterText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topShape} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.addIconBtn} onPress={() => router.push('/add-task')}>
            <Ionicons name="add" size={22} color="#111" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>My Tasks</Text>
        <Text style={styles.subtitle}>Track, edit and manage your daily tasks.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryNumber}>{tasks.length}</Text>
            <Text style={styles.summaryLabel}>Total Tasks</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryNumber}>
              {tasks.filter((item) => item.status === 'Completed').length}
            </Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks"
              placeholderTextColor="#777"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <TouchableOpacity
            style={styles.filterIconBtn}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={20} color="#111" />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <>
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
          </>
        )}

        <Text style={styles.sectionTitle}>Task List</Text>

        {filteredTasks.map((item) => (
          <View key={item.id} style={styles.taskCard}>
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

            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskNote}>{item.note}</Text>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                <Ionicons name="create-outline" size={16} color="#111" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteTask(item.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredTasks.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptyText}>
              Try another filter or search with a different keyword.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Task</Text>

            <TextInput
              style={styles.modalInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Task title"
              placeholderTextColor="#777"
            />

            <TextInput
              style={styles.modalInput}
              value={editTime}
              onChangeText={setEditTime}
              placeholder="Time"
              placeholderTextColor="#777"
            />

            <TextInput
              style={[styles.modalInput, styles.modalNoteInput]}
              value={editNote}
              onChangeText={setEditNote}
              placeholder="Task note"
              placeholderTextColor="#777"
              multiline
              textAlignVertical="top"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {['ToDo', 'InProgress', 'Completed'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.filterChip,
                    editStatus === item && styles.activeFilterChip,
                  ]}
                  onPress={() => setEditStatus(item as FilterType)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      editStatus === item && styles.activeFilterText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveEdit}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    width: 210,
    height: 160,
    backgroundColor: '#F4CCFF',
    borderBottomLeftRadius: 105,
    borderBottomRightRadius: 105,
    zIndex: 0,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
    marginBottom: 6,
    marginTop: 4,
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },

  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#F9EEFC',
    borderRadius: 26,
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginBottom: 18,
    alignItems: 'center',
  },

  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },

  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#D9B8E5',
  },

  summaryNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },

  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  searchBox: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F1FB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EAD7F0',
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#111',
  },

  filterIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F4CCFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 17,
    color: '#111',
    marginBottom: 12,
    fontWeight: '700',
  },

  filterRow: {
    gap: 10,
    paddingBottom: 14,
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

  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9D9EE',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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

  taskTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },

  taskNote: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 14,
  },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  editBtn: {
    width: '48%',
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4CCFF',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  editBtnText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '600',
  },

  deleteBtn: {
    width: '48%',
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FDECEC',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  deleteBtnText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '600',
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 34,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginBottom: 16,
    textAlign: 'center',
  },

  modalInput: {
    height: 48,
    backgroundColor: '#F8F1FB',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    color: '#111',
  },

  modalNoteInput: {
    height: 90,
    paddingTop: 14,
  },

  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  modalCancelBtn: {
    width: '48%',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCancelText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '600',
  },

  modalSaveBtn: {
    width: '48%',
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F4CCFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalSaveText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '700',
  },
});