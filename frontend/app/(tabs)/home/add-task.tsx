import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleTaskNotification, scheduleRecurringNotification } from '../../../services/notificationService';
import { useTheme } from '../../../constants/src/context/ThemeContext';
import { taskApi } from '../../../services/api';
import type { OverlapConflict } from '../../../services/api';

type RepeatType = 'Once' | 'Daily' | 'Weekly' | 'Custom';
type PriorityType = 'High' | 'Medium' | 'Low';
type StatusType = 'To Do' | 'In Progress' | 'Completed';

const DAYS_OF_WEEK = [
  { label: 'Sun', index: 0 },
  { label: 'Mon', index: 1 },
  { label: 'Tue', index: 2 },
  { label: 'Wed', index: 3 },
  { label: 'Thu', index: 4 },
  { label: 'Fri', index: 5 },
  { label: 'Sat', index: 6 },
];

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
  const [selectedRepeatDays, setSelectedRepeatDays] = useState<number[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Overlap modal state
  const [overlapModalVisible, setOverlapModalVisible] = useState(false);
  const [overlapConflicts, setOverlapConflicts] = useState<OverlapConflict[]>([]);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

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

  const toggleRepeatDay = (dayIndex: number) => {
    setSelectedRepeatDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const buildFinalDate = () => {
    const [hours, minutes] = time.split(':');
    let finalHours = Number(hours);

    if (meridiem === 'PM' && finalHours < 12) finalHours += 12;
    if (meridiem === 'AM' && finalHours === 12) finalHours = 0;

    return new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      finalHours,
      Number(minutes),
      0,
      0
    );
  };

  const buildRepeatDaysString = () => {
    if (repeat !== 'Custom' || selectedRepeatDays.length === 0) return null;
    return selectedRepeatDays.join(',');
  };

  const performSave = async (payload: any, finalDate: Date) => {
    try {
      await addTask(payload);

      if (reminder && status !== 'Completed' && finalDate > new Date()) {
        await scheduleRecurringNotification(
          'Task Reminder',
          `${title} is scheduled now!`,
          finalDate,
          repeat.toLowerCase() as any,
          buildRepeatDaysString() ?? undefined
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
      setSelectedRepeatDays([]);

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

  const handleSave = async () => {
    if (!title.trim() || !deadline.trim() || !time.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please fill all required fields.');
      } else {
        Alert.alert('Missing details', 'Please fill all required fields.');
      }
      return;
    }

    if (repeat === 'Custom' && selectedRepeatDays.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Please select at least one repeat day for Custom repeat.');
      } else {
        Alert.alert('Missing repeat days', 'Please select at least one day for Custom repeat.');
      }
      return;
    }

    const finalDate = buildFinalDate();

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

    const payload = {
      title: title.trim(),
      description: note.trim() || undefined,
      deadline: finalDate.toISOString(),
      estimated_minutes: 60,
      importance_hint: importanceMap[priority],
      status: statusMap[status],
      repeat_frequency: repeat.toLowerCase() as any,
      repeat_days: buildRepeatDaysString(),
      reminder: reminder,
    };

    // ── Overlap Check ──────────────────────────────────────────
    try {
      const overlapResult = await taskApi.checkOverlap({
        deadline: finalDate.toISOString(),
        estimated_minutes: 60,
      });

      if (overlapResult.hasOverlap) {
        setOverlapConflicts(overlapResult.conflicts);
        setPendingPayload({ payload, finalDate });
        setOverlapModalVisible(true);
        return; // Pause — wait for user decision in the modal
      }
    } catch {
      // If overlap check fails (network issue etc.), proceed with save anyway
    }

    await performSave(payload, finalDate);
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
      style={[styles.chip, { backgroundColor: selected ? theme.addTaskChipSelectedBg : theme.addTaskChipBg, borderColor: selected ? theme.addTaskChipSelectedBorder : theme.addTaskChipBorder }, selected && styles.chipSelected]}
    >
      <View style={styles.chipInner}>
        {icon ? <View style={styles.chipIcon}>{icon}</View> : null}
        <Text style={[styles.chipText, { color: theme.addTaskChipText }, selected && { color: activeColor, fontWeight: '700' }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const formatOverlapTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.container, { backgroundColor: theme.addTaskContainerBg }]}>
      <View style={[styles.topShape, { backgroundColor: theme.addTaskTopShape }]} />

      {/* ── Overlap Warning Modal ───────────────────────────── */}
      <Modal
        visible={overlapModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOverlapModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.addTaskCardBg }]}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning-outline" size={32} color="#E97316" />
            </View>
            <Text style={[styles.modalTitle, { color: theme.addTaskTitle }]}>Time Overlap Detected</Text>
            <Text style={[styles.modalSubtitle, { color: theme.addTaskSubtitle }]}>
              This task overlaps with {overlapConflicts.length} existing task{overlapConflicts.length > 1 ? 's' : ''}:
            </Text>

            {overlapConflicts.map((c) => (
              <View key={c.task_id} style={[styles.conflictRow, { backgroundColor: theme.addTaskInputBg, borderColor: '#E97316' }]}>
                <Ionicons name="time-outline" size={16} color="#E97316" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.conflictTitle, { color: theme.addTaskCardTitle }]}>{c.title}</Text>
                  <Text style={[styles.conflictTime, { color: theme.addTaskSubtitle }]}>
                    {formatOverlapTime(c.start)} – {formatOverlapTime(c.end)}
                  </Text>
                </View>
              </View>
            ))}

            <Text style={[styles.modalQuestion, { color: theme.addTaskSubtitle }]}>
              Do you want to save this task anyway?
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: theme.addTaskCardBorder }]}
                onPress={() => setOverlapModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: theme.addTaskCardTitle }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave, { backgroundColor: theme.addTaskBtnBg }]}
                onPress={async () => {
                  setOverlapModalVisible(false);
                  if (pendingPayload) {
                    await performSave(pendingPayload.payload, pendingPayload.finalDate);
                  }
                }}
              >
                <Text style={styles.modalBtnSaveText}>Save Anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.addTaskTitle} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.addTaskTitle }]}>Add Task</Text>
        <Text style={[styles.subtitle, { color: theme.addTaskSubtitle }]}>Create a task and organize your work clearly.</Text>

        <View style={[styles.card, { backgroundColor: theme.addTaskCardBg, borderColor: theme.addTaskCardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.addTaskIconBoxBg }]}>
              <Ionicons name="create-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.addTaskCardTitle }]}>Task Title</Text>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: theme.addTaskInputBg, borderColor: theme.addTaskInputBorder, color: theme.addTaskInputText }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor={theme.isDark ? '#666' : '#7A6D80'}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.addTaskCardBg, borderColor: theme.addTaskCardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.addTaskIconBoxBg }]}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.addTaskCardTitle }]}>Task Deadline</Text>
          </View>

          {Platform.OS === 'web' ? (
            <View style={styles.deadlineRow}>
              <View style={styles.deadlineBlock}>
                <Text style={[styles.fieldLabel, { color: theme.addTaskFieldLabel }]}>Date</Text>
                <View style={[styles.inputWithIcon, { backgroundColor: theme.addTaskInputBg, borderColor: theme.addTaskInputBorder }]}>
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
                      color: theme.addTaskInputText,
                      fontFamily: 'inherit',
                      padding: '10px 0',
                    }}
                  />
                </View>
              </View>

              <View style={styles.deadlineBlock}>
                <Text style={[styles.fieldLabel, { color: theme.addTaskFieldLabel }]}>Time</Text>
                <View style={[styles.inputWithIcon, { backgroundColor: theme.addTaskInputBg, borderColor: theme.addTaskInputBorder }]}>
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
                      color: '#111',
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
                  <Text style={[styles.fieldLabel, { color: theme.addTaskFieldLabel }]}>Date</Text>

                  <TouchableOpacity
                    style={[styles.inputWithIcon, { backgroundColor: theme.addTaskInputBg, borderColor: theme.addTaskInputBorder }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={[styles.inlineInput, { color: theme.addTaskInputText }]}>
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
                  <Text style={[styles.fieldLabel, { color: theme.addTaskFieldLabel }]}>Time</Text>

                  <TouchableOpacity
                    style={[styles.inputWithIcon, { backgroundColor: theme.addTaskInputBg, borderColor: theme.addTaskInputBorder }]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={[styles.inlineInput, { color: theme.addTaskInputText }]}>
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


        <View style={[styles.card, { backgroundColor: theme.addTaskCardBg, borderColor: theme.addTaskCardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.addTaskIconBoxBg }]}>
              <Ionicons name="reload-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.addTaskCardTitle }]}>Repeat</Text>
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

          {/* Day-of-week selector shown only when Custom is selected */}
          {repeat === 'Custom' && (
            <View style={styles.customDaysSection}>
              <Text style={[styles.fieldLabel, { color: theme.addTaskFieldLabel, marginTop: 14, marginBottom: 10 }]}>
                Repeat on days
              </Text>
              <View style={styles.daysRow}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedRepeatDays.includes(day.index);
                  return (
                    <TouchableOpacity
                      key={day.index}
                      onPress={() => toggleRepeatDay(day.index)}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.addTaskInputBg,
                          borderColor: isSelected ? theme.primary : theme.addTaskInputBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.dayChipText, { color: isSelected ? '#fff' : theme.addTaskChipText }]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedRepeatDays.length === 0 && (
                <Text style={styles.dayWarningText}>Select at least one day</Text>
              )}
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.addTaskCardBg, borderColor: theme.addTaskCardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.addTaskIconBoxBg }]}>
              <Ionicons name="flag-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.addTaskCardTitle }]}>Priority Level</Text>
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

        <View style={[styles.card, { backgroundColor: theme.addTaskCardBg, borderColor: theme.addTaskCardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.addTaskIconBoxBg }]}>
              <Ionicons name="bookmark-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.addTaskCardTitle }]}>Status</Text>
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

        <View style={[styles.card, { backgroundColor: theme.addTaskCardBg, borderColor: theme.addTaskCardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.addTaskIconBoxBg }]}>
              <Ionicons name="document-text-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.addTaskCardTitle }]}>Note (Optional)</Text>
          </View>
          <TextInput
            style={[styles.noteInput, { backgroundColor: theme.addTaskNoteInputBg, borderColor: theme.addTaskNoteInputBorder, color: theme.addTaskInputText }]}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Write a short note..."
            placeholderTextColor={theme.isDark ? '#666' : '#7A6D80'}
            textAlignVertical="top"
          />
          <Text style={[styles.countText, { color: theme.addTaskCountText }]}>{note.length}/250</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.addTaskCardBg, borderColor: theme.addTaskCardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.leftIconBox, { backgroundColor: theme.addTaskIconBoxBg }]}>
              <Ionicons name="notifications-outline" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.addTaskCardTitle }]}>Reminder</Text>
          </View>
          <View style={styles.reminderRow}>
            <Text style={[styles.reminderText, { color: theme.addTaskReminderText }]}>Add a reminder for this task</Text>
            <Switch
              value={reminder}
              onValueChange={setReminder}
              trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
              thumbColor="#fff"
            />
          </View>
          {reminder && (
            <View style={[styles.reminderHint, { backgroundColor: theme.addTaskInputBg }]}>
              <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
              <Text style={[styles.reminderHintText, { color: theme.addTaskSubtitle }]}>
                {repeat === 'Once'
                  ? 'You will be reminded once at the scheduled time.'
                  : repeat === 'Daily'
                  ? 'You will be reminded every day at the scheduled time.'
                  : repeat === 'Weekly'
                  ? 'You will be reminded every week on the same day.'
                  : 'You will be reminded on each selected day.'}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.addTaskBtnBg }]} activeOpacity={0.9} onPress={handleSave}>
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
    position: 'relative',
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
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    borderWidth: 1.5,
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
  customDaysSection: {
    marginTop: 4,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayWarningText: {
    marginTop: 8,
    fontSize: 12,
    color: '#E97316',
    fontWeight: '600',
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
  reminderHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    borderRadius: 12,
    padding: 10,
  },
  reminderHintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#555',
  },
  addBtn: {
    height: 58,
    borderRadius: 18,
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
  // ── Overlap Modal ──────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalIconWrap: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  conflictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
  },
  conflictTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  conflictTime: {
    fontSize: 12,
    marginTop: 2,
  },
  modalQuestion: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 19,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    borderWidth: 1.5,
  },
  modalBtnSave: {},
  modalBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalBtnSaveText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
