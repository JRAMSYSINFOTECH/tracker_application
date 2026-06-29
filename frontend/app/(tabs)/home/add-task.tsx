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
import { Platform } from 'react-native';
import { useTaskContext } from '../../../constants/src/context/TaskContext';
import { useTheme } from '../../../constants/src/context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleTaskNotification } from '../../../services/notificationService';

type RepeatType = 'Once' | 'Daily' | 'Weekly' | 'Custom';
type PriorityType = 'High' | 'Medium' | 'Low';
type StatusType = 'To Do' | 'In Progress' | 'Completed';

export default function AddTaskScreen() {
  const router = useRouter();
  const { addTask } = useTaskContext();
  const { theme } = useTheme();

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

      // Format as YYYY-MM-DD in LOCAL time (not UTC)
      const year = selected.getFullYear();
      const month = String(selected.getMonth() + 1).padStart(2, '0');
      const day = String(selected.getDate()).padStart(2, '0');
      setDeadline(`${year}-${month}-${day}`);
    }
  };

  const onChangeTime = (event: any, selected?: Date) => {
    setShowTimePicker(false);

    if (selected) {
      // Preserve the DATE from selectedDate (user's picked date).
      // The time picker returns today's date + selected time, which would
      // overwrite the future date the user picked and cause deadline errors.
      const preserved = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        selected.getHours(),
        selected.getMinutes(),
        0,
        0
      );
      setSelectedDate(preserved);

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
      if (Platform.OS === 'web') {
        window.alert('Please fill all required fields.');
      } else {
        Alert.alert(
          'Missing details',
          'Please fill all required fields.'
        );
      }
      return;
    }

    const [hours, minutes] =
      time.split(':');

    let finalHours = Number(hours);

    if (meridiem === 'PM' && finalHours < 12) {
      finalHours += 12;
    }
    if (meridiem === 'AM' && finalHours === 12) {
      finalHours = 0;
    }

    // Build date using local time components to avoid UTC timezone offset issues.
    // Using new Date("YYYY-MM-DD") parses as UTC midnight, which in IST (+05:30)
    // becomes the previous evening — making valid future deadlines appear past.
    const finalDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      finalHours,
      Number(minutes),
      0,
      0
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
        repeat_frequency: repeat.toLowerCase() as any,
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

      // Clear the form fields
      setTitle('');
      setDeadline('');
      setTime('');
      setNote('');
      setMeridiem('');
      setRepeat('Once');
      setPriority('High');
      setStatus('To Do');
      setReminder(false);

      if (Platform.OS === 'web') {
        window.alert('Task saved successfully!');
      } else {
        Alert.alert('Success', 'Task saved successfully!');
      }
      router.back();
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert(error?.message || 'Failed to save task. Please try again.');
      } else {
        Alert.alert('Error', error?.message || 'Failed to save task. Please try again.');
      }
    }
  };



  const Chip = ({
    label,
    selected,
    onPress,
    icon,
    activeColor = theme.primary,
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
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.softPrimary : theme.cardBg,
          borderColor: selected ? activeColor : theme.border,
        },
      ]}
    >
      <View style={styles.chipInner}>
        {icon ? <View style={styles.chipIcon}>{icon}</View> : null}
        <Text style={[styles.chipText, { color: selected ? activeColor : theme.text }, selected && { fontWeight: '700' }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.topShape, { backgroundColor: theme.topSurface }]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>Add Task</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>Create a task and organize your work clearly.</Text>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.softPrimary }]}>
              <Ionicons name="create-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Task Title</Text>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor={theme.subText}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.softPrimary }]}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Task Deadline</Text>
          </View>

          {Platform.OS === 'web' ? (
            <View style={styles.deadlineRow}>
              <View style={styles.deadlineBlock}>
                <Text style={[styles.fieldLabel, { color: theme.subText }]}>Date</Text>
                <View style={[styles.inputWithIcon, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e: any) => {
                      const val = e.target.value;
                      setDeadline(val);
                      if (val) setSelectedDate(new Date(val));
                    }}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 15,
                      color: theme.text,
                      fontFamily: 'inherit',
                      padding: '10px 0',
                    }}
                  />
                </View>
              </View>

              <View style={styles.deadlineBlock}>
                <Text style={[styles.fieldLabel, { color: theme.subText }]}>Time</Text>
                <View style={[styles.inputWithIcon, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <input
                    type="time"
                    value={time ? `${(() => {
                      const [h, m] = time.split(':');
                      let hours = parseInt(h);
                      if (meridiem === 'PM' && hours < 12) hours += 12;
                      if (meridiem === 'AM' && hours === 12) hours = 0;
                      return `${hours.toString().padStart(2, '0')}:${m}`;
                    })()}` : ''}
                    onChange={(e: any) => {
                      const val = e.target.value;
                      if (val) {
                        const [h, m] = val.split(':');
                        const hours = parseInt(h);
                        const formattedTime = `${hours % 12 || 12}:${m}`;
                        setTime(formattedTime);
                        setMeridiem(hours >= 12 ? 'PM' : 'AM');
                      }
                    }}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 15,
                      color: theme.text,
                      fontFamily: 'inherit',
                      padding: '10px 0',
                    }}
                  />
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.deadlineRow}>
                <View style={styles.deadlineBlock}>
                  <Text style={[styles.fieldLabel, { color: theme.subText }]}>Date</Text>

                  <TouchableOpacity
                    style={[styles.inputWithIcon, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={[styles.inlineInput, { color: theme.text }]}>
                      {deadline || 'Select date'}
                    </Text>

                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.deadlineBlock}>
                  <Text style={[styles.fieldLabel, { color: theme.subText }]}>Time</Text>

                  <TouchableOpacity
                    style={[styles.inputWithIcon, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={[styles.inlineInput, { color: theme.text }]}>
                      {time || 'Select time'}
                    </Text>

                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={theme.primary}
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
            </>
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
                  color={meridiem === 'AM' ? theme.primary : theme.subText}
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
                  color={meridiem === 'PM' ? theme.primary : theme.subText}
                />
              }
            />
          </View>
        </View>


        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.softPrimary }]}>
              <Ionicons name="reload-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Repeat</Text>
          </View>
          <View style={styles.chipGrid}>
            <Chip
              label="Once"
              selected={repeat === 'Once'}
              onPress={() => setRepeat('Once')}
              icon={<Ionicons name="radio-button-on" size={18} color={repeat === 'Once' ? theme.primary : theme.subText} />}
            />
            <Chip
              label="Daily"
              selected={repeat === 'Daily'}
              onPress={() => setRepeat('Daily')}
              icon={<Ionicons name="calendar-outline" size={18} color={repeat === 'Daily' ? theme.primary : theme.subText} />}
            />
            <Chip
              label="Weekly"
              selected={repeat === 'Weekly'}
              onPress={() => setRepeat('Weekly')}
              icon={<Ionicons name="calendar-outline" size={18} color={repeat === 'Weekly' ? theme.primary : theme.subText} />}
            />
            <Chip
              label="Custom"
              selected={repeat === 'Custom'}
              onPress={() => setRepeat('Custom')}
              icon={<Ionicons name="options-outline" size={18} color={repeat === 'Custom' ? theme.primary : theme.subText} />}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.softPrimary }]}>
              <Ionicons name="flag-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Priority Level</Text>
          </View>
          <View style={styles.chipGrid}>
            <Chip
              label="High"
              selected={priority === 'High'}
              onPress={() => setPriority('High')}
              activeColor={theme.error}
              icon={<View style={[styles.dot, { backgroundColor: theme.error }]} />}
            />
            <Chip
              label="Medium"
              selected={priority === 'Medium'}
              onPress={() => setPriority('Medium')}
              activeColor={theme.warning}
              icon={<View style={[styles.dot, { backgroundColor: theme.warning }]} />}
            />
            <Chip
              label="Low"
              selected={priority === 'Low'}
              onPress={() => setPriority('Low')}
              activeColor={theme.success}
              icon={<View style={[styles.dot, { backgroundColor: theme.success }]} />}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.softPrimary }]}>
              <Ionicons name="bookmark-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Status</Text>
          </View>
          <View style={styles.chipGrid}>
            <Chip
              label="To Do"
              selected={status === 'To Do'}
              onPress={() => setStatus('To Do')}
              activeColor={theme.primary}
              icon={<Ionicons name="pin-outline" size={18} color={status === 'To Do' ? theme.primary : theme.subText} />}
            />
            <Chip
              label="In Progress"
              selected={status === 'In Progress'}
              onPress={() => setStatus('In Progress')}
              activeColor={theme.warning}
              icon={<Ionicons name="hourglass-outline" size={18} color={status === 'In Progress' ? theme.warning : theme.subText} />}
            />
            <Chip
              label="Completed"
              selected={status === 'Completed'}
              onPress={() => setStatus('Completed')}
              activeColor={theme.success}
              icon={<Ionicons name="checkmark-circle-outline" size={18} color={status === 'Completed' ? theme.success : theme.subText} />}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.softPrimary }]}>
              <Ionicons name="document-text-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Note (Optional)</Text>
          </View>
          <TextInput
            style={[styles.noteInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Write a short note..."
            placeholderTextColor={theme.subText}
            textAlignVertical="top"
          />
          <Text style={[styles.countText, { color: theme.subText }]}>{note.length}/250</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.softPrimary }]}>
              <Ionicons name="notifications-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Reminder</Text>
          </View>
          <View style={styles.reminderRow}>
            <Text style={[styles.reminderText, { color: theme.subText }]}>Add a reminder for this task</Text>
            <Switch
              value={reminder}
              onValueChange={setReminder}
              trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} activeOpacity={0.9} onPress={handleSave}>
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
