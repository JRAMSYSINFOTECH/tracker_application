import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  BackendTask,
  getApiErrorMessage,
  taskApi,
  TaskStatus,
} from '../../services/api';

type FilterType = 'All' | 'ToDo' | 'InProgress' | 'Completed' | 'Missed';
type DisplayStatus = Exclude<FilterType, 'All'>;

type TaskType = {
  id: number;
  title: string;
  note: string;
  time: string;
  status: DisplayStatus;
  deadline: string;
};

const backendStatusToDisplay: Record<TaskStatus, DisplayStatus> = {
  pending: 'ToDo',
  in_progress: 'InProgress',
  completed: 'Completed',
  missed: 'Missed',
};

const displayStatusToBackend: Record<DisplayStatus, TaskStatus> = {
  ToDo: 'pending',
  InProgress: 'in_progress',
  Completed: 'completed',
  Missed: 'missed',
};

const formatTaskTime = (deadline: string) => {
  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) {
    return 'No time';
  }

  const rawHours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const meridiem = rawHours >= 12 ? 'PM' : 'AM';
  const hours = String(rawHours % 12 || 12).padStart(2, '0');

  return `${hours}:${minutes} ${meridiem}`;
};

const mapBackendTask = (task: BackendTask): TaskType => ({
  id: task.task_id,
  title: task.title,
  note: task.description || '',
  time: formatTaskTime(task.deadline),
  status: backendStatusToDisplay[task.status],
  deadline: task.deadline,
});

const updateDeadlineTime = (deadline: string, time: string) => {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const date = new Date(deadline);

  if (!match || Number.isNaN(date.getTime())) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export default function MyTasksScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState<DisplayStatus>('ToDo');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const filters: FilterType[] = ['All', 'ToDo', 'InProgress', 'Completed', 'Missed'];
  const editableStatuses: DisplayStatus[] = ['ToDo', 'InProgress', 'Completed', 'Missed'];

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await taskApi.list();
      setTasks(response.map(mapBackendTask));
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not load tasks.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

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

  const handleDeleteTask = async (id: number) => {
    setDeletingTaskId(id);

    try {
      await taskApi.delete(id);
      setTasks((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      Alert.alert(
        'Could not delete task',
        getApiErrorMessage(err, 'Please try deleting the task again.')
      );
    } finally {
      setDeletingTaskId(null);
    }
  };

  const openEditModal = (task: TaskType) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditNote(task.note);
    setEditTime(task.time);
    setEditStatus(task.status);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editTime.trim()) {
      Alert.alert('Missing details', 'Please fill all edit fields.');
      return;
    }

    const existingTask = tasks.find((item) => item.id === editingTaskId);

    if (!existingTask || editingTaskId === null) {
      Alert.alert('Could not update task', 'Please close and open the task again.');
      return;
    }

    const updatedDeadline = updateDeadlineTime(existingTask.deadline, editTime);

    if (!updatedDeadline) {
      Alert.alert('Invalid time', 'Please enter time as HH:MM AM or HH:MM PM.');
      return;
    }

    setIsSavingEdit(true);

    try {
      const response = await taskApi.update(editingTaskId, {
        title: editTitle.trim(),
        description: editNote.trim(),
        status: displayStatusToBackend[editStatus],
        deadline: updatedDeadline,
      });

      const updatedTask = mapBackendTask(response.task);

      setTasks((prev) =>
        prev.map((item) => (item.id === editingTaskId ? updatedTask : item))
      );
      setEditModalVisible(false);
    } catch (err) {
      Alert.alert(
        'Could not update task',
        getApiErrorMessage(err, 'Please try saving the task again.')
      );
    } finally {
      setIsSavingEdit(false);
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

        {isLoading && (
          <View style={styles.emptyCard}>
            <ActivityIndicator color="#111" />
            <Text style={styles.emptyText}>Loading tasks...</Text>
          </View>
        )}

        {!isLoading && loadError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Could not load tasks</Text>
            <Text style={styles.emptyText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadTasks}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isLoading && !loadError && filteredTasks.map((item) => (
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
            {item.note ? <Text style={styles.taskNote}>{item.note}</Text> : null}

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                <Ionicons name="create-outline" size={16} color="#111" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteBtn,
                  deletingTaskId === item.id && styles.disabledBtn,
                ]}
                onPress={() => handleDeleteTask(item.id)}
                disabled={deletingTaskId === item.id}
              >
                <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                <Text style={styles.deleteBtnText}>
                  {deletingTaskId === item.id ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {!isLoading && !loadError && filteredTasks.length === 0 && (
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
              {editableStatuses.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.filterChip,
                    editStatus === item && styles.activeFilterChip,
                  ]}
                  onPress={() => setEditStatus(item)}
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

              <TouchableOpacity
                style={[styles.modalSaveBtn, isSavingEdit && styles.disabledBtn]}
                onPress={handleSaveEdit}
                disabled={isSavingEdit}
              >
                <Text style={styles.modalSaveText}>
                  {isSavingEdit ? 'Saving...' : 'Save'}
                </Text>
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

  missedBadge: {
    backgroundColor: '#FEE2E2',
  },

  missedText: {
    color: '#B91C1C',
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

  disabledBtn: {
    opacity: 0.65,
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
