import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTaskContext } from '../../../constants/src/context/TaskContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleTaskNotification } from '../../../services/notificationService';

type RepeatType = 'Once' | 'Daily' | 'Weekly' | 'Custom';
type PriorityType = 'High' | 'Medium' | 'Low';
type StatusType = 'To Do' | 'In Progress' | 'Completed';

export default function AddTaskScreen() {
  const router = useRouter();
  const { addTask } = useTaskContext();

  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [meridiem, setMeridiem] = useState<'AM' | 'PM' | ''>('');
  const [repeat, setRepeat] = useState<RepeatType>('Once');
  const [priority, setPriority] = useState<PriorityType>('High');
  const [status, setStatus] = useState<StatusType>('To Do');
  const [reminder, setReminder] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const onChangeDate = (event: any, selected?: Date) => {
    setShowDatePicker(false);

    if (selected) {
      setSelectedDate(selected);

      const formattedDate = selected.toISOString().split('T')[0];
      setDeadline(formattedDate);
    }
  };

  const onChangeTime = (event: any, selected?: Date) => {
    setShowTimePicker(false);

    if (selected) {
      setSelectedDate(selected);

      const hours = selected.getHours();
      const minutes = selected.getMinutes();

      const formattedTime = `${hours % 12 || 12}:${minutes
        .toString()
        .padStart(2, '0')}`;

      setTime(formattedTime);
      setMeridiem(hours >= 12 ? 'PM' : 'AM');
    }
  };
  const handleSave = async () => {

    if (
      !title.trim() ||
      !deadline.trim() ||
      !time.trim()
    ) {

      Alert.alert(
        'Missing details',
        'Please fill all required fields.'
      );

      return;
    }

    const [hours, minutes] =
      time.split(':');

    const finalDate =
      new Date(deadline);

    let finalHours =
      Number(hours);

    if (
      meridiem === 'PM' &&
      finalHours < 12
    ) {
      finalHours += 12;
    }

    if (
      meridiem === 'AM' &&
      finalHours === 12
    ) {
      finalHours = 0;
    }

    finalDate.setHours(finalHours);

    finalDate.setMinutes(
      Number(minutes)
    );

    // Map priority to backend importance_hint
    const importanceMap: Record<string, 'low' | 'medium' | 'high'> = {
      Low: 'low',
      Medium: 'medium',
      High: 'high',
    };

    // Map status to backend status
    const statusMap: Record<string, 'pending' | 'in_progress' | 'completed'> = {
      'To Do': 'pending',
      'In Progress': 'in_progress',
      'Completed': 'completed',
    };

    try {
      await addTask({
        title: title.trim(),
        description: note.trim() || undefined,
        deadline: finalDate.toISOString(),
        estimated_minutes: 60,
        importance_hint: importanceMap[priority],
        status: statusMap[status],
      });

      if (
        reminder &&
        status !== 'Completed' &&
        finalDate > new Date()
      ) {
        await scheduleTaskNotification(
          'Task Reminder',
          `${title} deadline reached!`,
          finalDate
        );
      }

      Alert.alert('Success', 'Task saved successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save task. Please try again.');
    }
  };



  const Chip = ({
    label,
    selected,
    onPress,
    icon,
    activeColor = '#df5ca8',
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    icon?: React.ReactNode;
    activeColor?: string;
  }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <View style={styles.chipInner}>
        {icon ? <View style={styles.chipIcon}>{icon}</View> : null}
        <Text style={[styles.chipText, selected && { color: activeColor, fontWeight: '700' }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topShape} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>

        <Text style={styles.title}>Add Task</Text>
        <Text style={styles.subtitle}>Create a task and organize your work clearly.</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.leftIconBox}>
              <Ionicons name="create-outline" size={20} color="#df5ca8" />
            </View>
            <Text style={styles.cardTitle}>Task Title</Text>
          </View>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor="#7A6D80"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.leftIconBox}>
              <Ionicons name="calendar-outline" size={20} color="#df5ca8" />
            </View>
            <Text style={styles.cardTitle}>Task Deadline</Text>
          </View>

          <View style={styles.deadlineRow}>
            <View style={styles.deadlineBlock}>
              <Text style={styles.fieldLabel}>Date</Text>

              <TouchableOpacity
                style={styles.inputWithIcon}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inlineInput}>
                  {deadline || 'Select date'}
                </Text>

                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#df5ca8"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.deadlineBlock}>
              <Text style={styles.fieldLabel}>Time</Text>

              <TouchableOpacity
                style={styles.inputWithIcon}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.inlineInput}>
                  {time || 'Select time'}
                </Text>

                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#df5ca8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display="default"
              onChange={onChangeTime}
            />
          )}

          <View style={styles.amPmRow}>
            <Chip
              label="AM"
              selected={meridiem === 'AM'}
              onPress={() => setMeridiem('AM')}
              icon={
                <Ionicons
                  name="sunny-outline"
                  size={18}
                  color={meridiem === 'AM' ? '#df5ca8' : '#666'}
                />
              }
            />

            <Chip
              label="PM"
              selected={meridiem === 'PM'}
              onPress={() => setMeridiem('PM')}
              icon={
                <Ionicons
                  name="moon-outline"
                  size={18}
                  color={meridiem === 'PM' ? '#df5ca8' : '#666'}
                />
              }
            />
          </View>
        </View>


        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.leftIconBox}>
              <Ionicons name="reload-outline" size={20} color="#df5ca8" />
            </View>
            <Text style={styles.cardTitle}>Repeat</Text>
          </View>
          <View style={styles.chipGrid}>
            <Chip
              label="Once"
              selected={repeat === 'Once'}
              onPress={() => setRepeat('Once')}
              icon={<Ionicons name="radio-button-on" size={18} color={repeat === 'Once' ? '#df5ca8' : '#666'} />}
            />
            <Chip
              label="Daily"
              selected={repeat === 'Daily'}
              onPress={() => setRepeat('Daily')}
              icon={<Ionicons name="calendar-outline" size={18} color={repeat === 'Daily' ? '#df5ca8' : '#666'} />}
            />
            <Chip
              label="Weekly"
              selected={repeat === 'Weekly'}
              onPress={() => setRepeat('Weekly')}
              icon={<Ionicons name="calendar-outline" size={18} color={repeat === 'Weekly' ? '#df5ca8' : '#666'} />}
            />
            <Chip
              label="Custom"
              selected={repeat === 'Custom'}
              onPress={() => setRepeat('Custom')}
              icon={<Ionicons name="options-outline" size={18} color={repeat === 'Custom' ? '#df5ca8' : '#666'} />}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.leftIconBox}>
              <Ionicons name="flag-outline" size={20} color="#df5ca8" />
            </View>
            <Text style={styles.cardTitle}>Priority Level</Text>
          </View>
          <View style={styles.chipGrid}>
            <Chip
              label="High"
              selected={priority === 'High'}
              onPress={() => setPriority('High')}
              activeColor="#d94848"
              icon={<View style={[styles.dot, { backgroundColor: '#ef4444' }]} />}
            />
            <Chip
              label="Medium"
              selected={priority === 'Medium'}
              onPress={() => setPriority('Medium')}
              activeColor="#d18b00"
              icon={<View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />}
            />
            <Chip
              label="Low"
              selected={priority === 'Low'}
              onPress={() => setPriority('Low')}
              activeColor="#23944b"
              icon={<View style={[styles.dot, { backgroundColor: '#22c55e' }]} />}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.leftIconBox}>
              <Ionicons name="bookmark-outline" size={20} color="#df5ca8" />
            </View>
            <Text style={styles.cardTitle}>Status</Text>
          </View>
          <View style={styles.chipGrid}>
            <Chip
              label="To Do"
              selected={status === 'To Do'}
              onPress={() => setStatus('To Do')}
              activeColor="#df5ca8"
              icon={<Ionicons name="pin-outline" size={18} color={status === 'To Do' ? '#df5ca8' : '#666'} />}
            />
            <Chip
              label="In Progress"
              selected={status === 'In Progress'}
              onPress={() => setStatus('In Progress')}
              activeColor="#d18b00"
              icon={<Ionicons name="hourglass-outline" size={18} color={status === 'In Progress' ? '#d18b00' : '#666'} />}
            />
            <Chip
              label="Completed"
              selected={status === 'Completed'}
              onPress={() => setStatus('Completed')}
              activeColor="#2e9d4d"
              icon={<Ionicons name="checkmark-circle-outline" size={18} color={status === 'Completed' ? '#2e9d4d' : '#666'} />}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.leftIconBox}>
              <Ionicons name="document-text-outline" size={20} color="#df5ca8" />
            </View>
            <Text style={styles.cardTitle}>Note (Optional)</Text>
          </View>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Write a short note..."
            placeholderTextColor="#7A6D80"
            textAlignVertical="top"
          />
          <Text style={styles.countText}>{note.length}/250</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.leftIconBox}>
              <Ionicons name="notifications-outline" size={20} color="#df5ca8" />
            </View>
            <Text style={styles.cardTitle}>Reminder</Text>
          </View>
          <View style={styles.reminderRow}>
            <Text style={styles.reminderText}>Add a reminder for this task</Text>
            <Switch
              value={reminder}
              onValueChange={setReminder}
              trackColor={{ false: '#ddd', true: '#f4a8cc' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} activeOpacity={0.9} onPress={handleSave}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addBtnText}>Add Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7FB',
    position: 'relative',
  },
  topShape: {
    position: 'absolute',
    top: -35,
    alignSelf: 'center',
    width: 190,
    height: 150,
    backgroundColor: '#F8DCEB',
    borderBottomLeftRadius: 95,
    borderBottomRightRadius: 95,
    zIndex: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 180,
    zIndex: 1,
  },
  backBtn: {
    marginTop: 10,
    marginBottom: 20,
    width: 30,
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
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFE7ED',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  leftIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff3f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
  input: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    color: '#111',
    borderWidth: 1,
    borderColor: '#E8E3E7',
  },
  deadlineRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  deadlineBlock: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWithIcon: {
    height: 46,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E3E7',
  },
  inlineInput: {
    flex: 1,
    color: '#111',
    fontSize: 15,
    paddingVertical: 10,
  },
  amPmRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D8D4D9',
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    borderColor: '#df5ca8',
    backgroundColor: '#FFF6FB',
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipIcon: {
    marginRight: 8,
  },
  chipText: {
    fontSize: 15,
    color: '#111',
    fontWeight: '500',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  noteInput: {
    minHeight: 110,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    color: '#111',
    borderWidth: 1,
    borderColor: '#E8E3E7',
  },
  countText: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
    color: '#777',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderText: {
    flex: 1,
    fontSize: 15,
    color: '#555',
    marginRight: 12,
  },
  addBtn: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#e814ac',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  addBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
});