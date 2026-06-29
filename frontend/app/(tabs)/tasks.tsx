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
import { useTaskContext } from '../../constants/src/context/TaskContext';
import { useTheme } from '../../constants/src/context/ThemeContext';

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
  const { theme } = useTheme();
  const {
    tasks: contextTasks,
    updateTask,
  } = useTaskContext();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const formattedTasks: TaskType[] = contextTasks.map((task) => {

    const taskDate = new Date(task.time);

    return {
      id: task.id,

      title: task.title,

      note: 'Task from planner',

      time: taskDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),

      status:
        task.status === 'completed'
          ? 'Completed'
          : 'ToDo',
    };
  });
  const [openMenuTaskId, setOpenMenuTaskId] = useState<number | null>(null);
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
        ? formattedTasks
        : formattedTasks.filter((item) => item.status === selectedFilter);

    if (searchText.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchText.toLowerCase()) ||
          item.note.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return filtered;
  }, [selectedFilter, searchText, formattedTasks]);

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
    Alert.alert('Delete task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => { },
      },
    ]);
  };

  const openEditModal = (task: TaskType) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditNote(task.note);
    setEditTime(task.time);
    setEditStatus(task.status);
    setEditModalVisible(true);
    setOpenMenuTaskId(null);
  };

  const handleSaveEdit = async () => {

    if (
      !editTitle.trim() ||
      !editNote.trim() ||
      !editTime.trim()
    ) {
      Alert.alert(
        'Missing details',
        'Please fill all edit fields.'
      );
      return;
    }

    if (!editingTaskId) return;

    try {

      await updateTask(
        editingTaskId,
        {
          title: editTitle,
          description: editNote,
          status:
            editStatus === 'Completed'
              ? 'completed'
              : 'pending',
        }
      );

      Alert.alert(
        'Success',
        'Task updated successfully'
      );

      setEditModalVisible(false);

    } catch (error) {

      Alert.alert(
        'Error',
        'Failed to update task'
      );
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
      style={[
        styles.filterChip,
        { backgroundColor: active ? theme.primary : theme.inputBg, borderColor: active ? theme.primary : theme.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.filterText, { color: active ? '#fff' : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  const TaskMenu = ({ taskId }: { taskId: number }) => {
    const open = openMenuTaskId === taskId;

    return (
      <View style={styles.menuWrap}>
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={() => setOpenMenuTaskId(open ? null : taskId)}
          activeOpacity={0.8}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={theme.text} />
        </TouchableOpacity>

        {open && (
          <View style={[styles.menuPopup, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                const task = formattedTasks.find((t) => t.id === taskId);
                if (task) openEditModal(task);
              }}
            >
              <Ionicons name="create-outline" size={16} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setOpenMenuTaskId(null);
                handleDeleteTask(taskId);
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#B91C1C" />
              <Text style={[styles.menuItemText, styles.deleteMenuText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.topShape, { backgroundColor: theme.topSurface }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScrollBeginDrag={() => setOpenMenuTaskId(null)}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.inputBg }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addIconBtn, { backgroundColor: theme.softPrimary }]}
            onPress={() => router.push('/(tabs)/home/add-task' as any)}
          >
            <Ionicons name="add" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>My Tasks</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>Track, edit and manage your daily tasks.</Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: theme.softPrimary }]}>
              <Ionicons name="clipboard-outline" size={24} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.summaryNumber, { color: theme.text }]}>{formattedTasks.length}</Text>
              <Text style={[styles.summaryLabel, { color: theme.subText }]}>Total Tasks</Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: theme.isDark ? 'rgba(34,197,94,0.16)' : '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.success} />
            </View>
            <View>
              <Text style={[styles.summaryNumber, { color: theme.text }]}>
                {formattedTasks.filter((item) => item.status === 'Completed').length}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.subText }]}>Completed</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.subText} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search tasks"
              placeholderTextColor={theme.subText}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <TouchableOpacity
            style={[styles.filterIconBtn, { backgroundColor: theme.softPrimary }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {showFilters && (
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
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Task List</Text>

        {filteredTasks.map((item) => (
          <View key={item.id} style={[styles.taskCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.taskCardTop}>
              <View style={styles.taskLeftColumn}>
                <View style={styles.timeWrap}>
                  <Text style={[styles.timeText, { color: theme.primary }]}>{item.time.split(' ')[0]}</Text>
                  <Text style={[styles.timeText, { color: theme.primary }]}>{item.time.split(' ')[1]}</Text>
                </View>
              </View>

              <View style={styles.taskMainColumn}>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      getStatusStyle(item.status),
                      theme.isDark && {
                        backgroundColor:
                          item.status === 'Completed'
                            ? 'rgba(34,197,94,0.16)'
                            : item.status === 'InProgress'
                              ? 'rgba(251,191,36,0.16)'
                              : 'rgba(99,102,241,0.16)',
                      },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, getStatusTextStyle(item.status)]}>
                      {item.status === 'ToDo'
                        ? 'To Do'
                        : item.status === 'InProgress'
                          ? 'In Progress'
                          : 'Completed'}
                    </Text>
                  </View>

                  <View style={styles.priorityWrap}>
                    <Text style={[styles.priorityText, { color: theme.text }]}>
                      {item.status === 'InProgress' ? 'Medium' : item.status === 'Completed' ? 'Low' : 'High'}
                    </Text>
                    <View
                      style={[
                        styles.priorityDot,
                        item.status === 'InProgress'
                          ? styles.mediumDot
                          : item.status === 'Completed'
                            ? styles.lowDot
                            : styles.highDot,
                      ]}
                    />
                  </View>

                  <TaskMenu taskId={item.id} />
                </View>

                <Text style={[styles.taskTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.taskNote, { color: theme.subText }]}>{item.note}</Text>
              </View>
            </View>
          </View>
        ))}

        {filteredTasks.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No tasks found</Text>
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              Try another filter or search with a different keyword.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Task</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Task title"
              placeholderTextColor={theme.subText}
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={editTime}
              onChangeText={setEditTime}
              placeholder="Time"
              placeholderTextColor={theme.subText}
            />

            <TextInput
              style={[styles.modalInput, styles.modalNoteInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={editNote}
              onChangeText={setEditNote}
              placeholder="Task note"
              placeholderTextColor={theme.subText}
              multiline
              textAlignVertical="top"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {(['ToDo', 'InProgress', 'Completed'] as FilterType[]).map((item) => (
                <TouchableOpacity
                  key={item}
                style={[
                  styles.filterChip,
                  { backgroundColor: editStatus === item ? theme.primary : theme.inputBg, borderColor: editStatus === item ? theme.primary : theme.border },
                ]}
                  onPress={() => setEditStatus(item)}
                >
                  <Text
                    style={[styles.filterText, { color: editStatus === item ? '#fff' : theme.text }]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]} onPress={handleSaveEdit}>
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
    paddingBottom: 120,
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
    backgroundColor: '#FBEAF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FBEAF7',
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalCard: {
    backgroundColor: '#FDF0F7',
  },
  completedCard: {
    backgroundColor: '#F2FAF0',
  },
  summaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalIconBox: {
    backgroundColor: '#FBE1EF',
  },
  completedIconBox: {
    backgroundColor: '#E4F7E6',
  },
  summaryNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  searchBox: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#111',
    fontSize: 16,
  },
  filterIconBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#FBEAF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    gap: 12,
    paddingBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterChip: {
    backgroundColor: '#E91E63',
  },
  filterText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#111',
    marginBottom: 14,
    fontWeight: '800',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  taskCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskLeftColumn: {
    width: 74,
    marginRight: 14,
  },
  timeWrap: {
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#E91E63',
  },
  taskMainColumn: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  priorityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BDBDBD',
  },
  highDot: {
    backgroundColor: '#E91E63',
  },
  mediumDot: {
    backgroundColor: '#F59E0B',
  },
  lowDot: {
    backgroundColor: '#22C55E',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
  },
  taskNote: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  menuWrap: {
    position: 'relative',
    marginLeft: 8,
  },
  moreBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuPopup: {
    position: 'absolute',
    top: 32,
    right: 0,
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDEDED',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    paddingVertical: 6,
    zIndex: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  deleteMenuText: {
    color: '#B91C1C',
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
