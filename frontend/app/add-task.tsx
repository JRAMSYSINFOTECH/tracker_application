import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AddTaskScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [meridiem, setMeridiem] = useState<'AM' | 'PM' | ''>('');
  const [frequency, setFrequency] = useState('');
  const [priority, setPriority] = useState('');

  const Checkbox = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.checkRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Ionicons name="checkmark" size={16} color="#111" />}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const handleSave = () => {
    if (!title.trim() || !deadline.trim() || !meridiem || !frequency || !priority) {
      Alert.alert('Missing details', 'Please fill all required fields.');
      return;
    }

    Alert.alert('Success', 'Task saved successfully');
    router.back();
  };

  const handleClear = () => {
    setTitle('');
    setDeadline('');
    setNote('');
    setMeridiem('');
    setFrequency('');
    setPriority('');
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

        <Text style={styles.title}>Add Task</Text>
        <Text style={styles.subtitle}>
          Create a task and organize your work clearly.
        </Text>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter task title"
          placeholderTextColor="#7A6D80"
        />

        <Text style={styles.label}>Task Deadline</Text>
        <View style={styles.inputWithIcon}>
          <TextInput
            style={styles.deadlineInput}
            value={deadline}
            onChangeText={setDeadline}
            placeholder="DD / MM / YYYY"
            placeholderTextColor="#7A6D80"
          />
          <Ionicons name="calendar-outline" size={20} color="#111" />
        </View>

        <View style={styles.row}>
          <Checkbox
            label="AM"
            selected={meridiem === 'AM'}
            onPress={() => setMeridiem('AM')}
          />
          <Checkbox
            label="PM"
            selected={meridiem === 'PM'}
            onPress={() => setMeridiem('PM')}
          />
        </View>

        <Text style={styles.label}>Note (Optional)</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Write a short note"
          placeholderTextColor="#7A6D80"
          textAlignVertical="top"
        />

        <Text style={styles.sectionTitle}>Reminder Frequency</Text>
        <View style={styles.gridRow}>
          <Checkbox
            label="Once"
            selected={frequency === 'Once'}
            onPress={() => setFrequency('Once')}
          />
          <Checkbox
            label="Daily"
            selected={frequency === 'Daily'}
            onPress={() => setFrequency('Daily')}
          />
        </View>

        <View style={styles.gridRow}>
          <Checkbox
            label="Weekly"
            selected={frequency === 'Weekly'}
            onPress={() => setFrequency('Weekly')}
          />
          <Checkbox
            label="Custom"
            selected={frequency === 'Custom'}
            onPress={() => setFrequency('Custom')}
          />
        </View>

        <Text style={styles.sectionTitle}>Hint : Priority Level</Text>
        <View style={styles.gridRow}>
          <Checkbox
            label="High"
            selected={priority === 'High'}
            onPress={() => setPriority('High')}
          />
          <Checkbox
            label="Medium"
            selected={priority === 'Medium'}
            onPress={() => setPriority('Medium')}
          />
        </View>

        <View style={styles.lowRow}>
          <Checkbox
            label="Low"
            selected={priority === 'Low'}
            onPress={() => setPriority('Low')}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
            <Text style={styles.actionBtnText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleClear}>
            <Text style={styles.actionBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 24,
  },

  label: {
    fontSize: 16,
    color: '#111',
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '500',
  },

  input: {
    height: 46,
    backgroundColor: '#F4CCFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    marginBottom: 8,
    color: '#111',
  },

  inputWithIcon: {
    height: 46,
    backgroundColor: '#F4CCFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  deadlineInput: {
    flex: 1,
    color: '#111',
  },

  row: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 14,
    marginTop: 4,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#777',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
  },

  checkboxSelected: {
    backgroundColor: '#F4CCFF',
    borderColor: '#111',
  },

  checkLabel: {
    fontSize: 16,
    color: '#111',
  },

  noteInput: {
    minHeight: 95,
    backgroundColor: '#F4CCFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 14,
    marginBottom: 18,
    color: '#111',
  },

  sectionTitle: {
    fontSize: 16,
    color: '#111',
    marginBottom: 12,
    marginTop: 6,
    fontWeight: '500',
  },

  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 40,
  },

  lowRow: {
    alignItems: 'center',
    marginBottom: 26,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  actionBtn: {
    width: 125,
    height: 42,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  actionBtnText: {
    color: '#D094E8',
    fontSize: 16,
    fontWeight: '500',
  },
});