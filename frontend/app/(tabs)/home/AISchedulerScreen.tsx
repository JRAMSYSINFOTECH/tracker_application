import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useAuth } from '../../../constants/src/context/AuthContext';
import TopCurve from '../../../constants/src/components/TopCurve';
import { commonStyles } from '../../../constants/src/theme/commonStyles';
import { dashboardApi, TodayPlanItem } from '../../../services/api';
import { aiApi } from '../../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────
type RescheduleAnalysis = {
  advantages: string[];
  disadvantages: string[];
  recommendation: 'change' | 'keep';
  summary: string;
};

type PendingReschedule = {
  item: TodayPlanItem;
  newStart: Date;
  newEnd: Date;
  analysis: RescheduleAnalysis;
};

// ─── Local AI Analysis (no new backend endpoint needed) ──────────────────────
function computeAnalysis(
  item: TodayPlanItem,
  allItems: TodayPlanItem[],
  newStart: Date,
  newEnd: Date
): RescheduleAnalysis {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const hour = newStart.getHours();

  // 1. Deadline check
  const deadline = new Date(item.task.deadline);
  if (newEnd > deadline) {
    disadvantages.push(`Task will finish after its deadline (${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
  } else {
    const minsBeforeDeadline = (deadline.getTime() - newEnd.getTime()) / 60000;
    if (minsBeforeDeadline > 60) {
      advantages.push(`Finishes ${Math.round(minsBeforeDeadline / 60)}h before deadline — good buffer`);
    } else {
      advantages.push('Completes within deadline');
    }
  }

  // 2. Overlap check
  const conflicts = allItems.filter((other) => {
    if (other.plan_item_id === item.plan_item_id) return false;
    if (!other.start_time || !other.end_time) return false;
    const s = new Date(other.start_time);
    const e = new Date(other.end_time);
    return newStart < e && newEnd > s;
  });

  if (conflicts.length > 0) {
    disadvantages.push(`Overlaps with: ${conflicts.map((c) => `"${c.task.title}"`).join(', ')}`);
  } else {
    advantages.push('No conflicts with other scheduled tasks');
  }

  // 3. Time-of-day heuristics
  if (hour >= 6 && hour < 9) {
    if (item.task.importance_hint === 'high') {
      advantages.push('Early morning — great for high-focus tasks');
    } else {
      disadvantages.push('Very early slot — may be tiring for routine work');
    }
  } else if (hour >= 9 && hour < 12) {
    advantages.push('Morning slot — peak productivity hours');
  } else if (hour >= 12 && hour < 14) {
    disadvantages.push('Lunch break hours — energy tends to dip');
  } else if (hour >= 14 && hour < 17) {
    if (item.task.importance_hint === 'low') {
      advantages.push('Afternoon — good for lighter tasks');
    } else {
      disadvantages.push('Post-lunch hours — harder to stay focused on complex work');
    }
  } else if (hour >= 17 && hour < 20) {
    advantages.push('Evening — good for review or planning tasks');
  } else {
    disadvantages.push('Late night — working late may increase stress');
  }

  // 4. Priority check
  if (item.task.importance_hint === 'high') {
    if (hour < 9 || hour >= 18) {
      disadvantages.push('High priority task scheduled outside core working hours');
    } else {
      advantages.push('High priority task fits within productive working hours');
    }
  }

  const recommendation: 'change' | 'keep' =
    advantages.length >= disadvantages.length ? 'change' : 'keep';

  const summary =
    recommendation === 'change'
      ? 'Overall this looks like a reasonable change. Proceed if it suits your schedule.'
      : 'This change has more downsides than benefits. Consider keeping the original slot.';

  return { advantages, disadvantages, recommendation, summary };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(isoString: string) {
  console.log("TIME FROM API:", isoString);

  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function addMinutes(date: Date, mins: number) {
  return new Date(date.getTime() + mins * 60_000);
}

function getPriorityColor(p: string | null) {
  return p === 'high' ? '#E91E63' : p === 'medium' ? '#FF9800' : p === 'low' ? '#4CAF50' : '#9E9E9E';
}
function getPriorityBg(p: string | null) {
  return p === 'high' ? '#FDE8EF' : p === 'medium' ? '#FFF3E0' : p === 'low' ? '#E8F5E9' : '#F5F5F5';
}

// ─── Reschedule Modal ─────────────────────────────────────────────────────────
function RescheduleModal({
  visible,
  pending,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  pending: PendingReschedule | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!pending) return null;
  const { item, newStart, newEnd, analysis } = pending;
  const newTimeLabel = `${newStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} – ${newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          {/* Header */}
          <View style={mStyles.header}>
            <View style={mStyles.dragHandle} />
            <Text style={mStyles.title}>Reschedule Task</Text>
            <Text style={mStyles.taskName} numberOfLines={2}>
              "{item.task.title}"
            </Text>
            <View style={mStyles.timeRow}>
              <View style={mStyles.timePill}>
                <Ionicons name="time-outline" size={14} color="#a855f7" />
                <Text style={mStyles.timePillText}>{newTimeLabel}</Text>
              </View>
            </View>
          </View>

          {/* Advantages */}
          {analysis.advantages.length > 0 && (
            <View style={mStyles.section}>
              <View style={mStyles.sectionHeader}>
                <View style={[mStyles.dot, { backgroundColor: '#22c55e' }]} />
                <Text style={[mStyles.sectionTitle, { color: '#15803d' }]}>Advantages</Text>
              </View>
              {analysis.advantages.map((a, i) => (
                <View key={i} style={mStyles.bulletRow}>
                  <Text style={mStyles.bullet}>✓</Text>
                  <Text style={[mStyles.bulletText, { color: '#166534' }]}>{a}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Disadvantages */}
          {analysis.disadvantages.length > 0 && (
            <View style={mStyles.section}>
              <View style={mStyles.sectionHeader}>
                <View style={[mStyles.dot, { backgroundColor: '#ef4444' }]} />
                <Text style={[mStyles.sectionTitle, { color: '#b91c1c' }]}>Disadvantages</Text>
              </View>
              {analysis.disadvantages.map((d, i) => (
                <View key={i} style={mStyles.bulletRow}>
                  <Text style={mStyles.bullet}>✕</Text>
                  <Text style={[mStyles.bulletText, { color: '#991b1b' }]}>{d}</Text>
                </View>
              ))}
            </View>
          )}

          {/* AI Summary */}
          <View style={[mStyles.summaryCard, analysis.recommendation === 'change' ? mStyles.summaryGreen : mStyles.summaryRed]}>
            <Ionicons
              name="sparkles"
              size={16}
              color={analysis.recommendation === 'change' ? '#15803d' : '#b91c1c'}
            />
            <Text style={[mStyles.summaryText, { color: analysis.recommendation === 'change' ? '#15803d' : '#b91c1c' }]}>
              {analysis.summary}
            </Text>
          </View>

          {/* Buttons */}
          <View style={mStyles.btnRow}>
            <TouchableOpacity style={mStyles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
              <Ionicons name="arrow-undo-outline" size={18} color="#555" />
              <Text style={mStyles.cancelBtnText}>Keep Original</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[mStyles.confirmBtn, analysis.recommendation === 'keep' && mStyles.confirmBtnWarn]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={mStyles.confirmBtnText}>
                {analysis.recommendation === 'keep' ? 'Move Anyway' : 'Confirm Move'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Draggable Card ───────────────────────────────────────────────────────────
function DraggableCard({
  item,
  allItems,
  onRescheduleRequest,
  priorityColor,
  priorityBg,
}: {
  item: TodayPlanItem;
  allItems: TodayPlanItem[];
  onRescheduleRequest: (item: TodayPlanItem, newStart: Date, newEnd: Date) => void;
  priorityColor: string;
  priorityBg: string;
}) {
  const pan = useRef(new Animated.Value(0)).current;
  const [dragging, setDragging] = useState(false);
  const accumulatedDy = useRef(0);

  const SLOT_HEIGHT = 70; // px per 30-min slot

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDragging(true);
        pan.setValue(0);
      },
      onPanResponderMove: (_, gs) => {
        pan.setValue(gs.dy);
        accumulatedDy.current = gs.dy;
      },
      onPanResponderRelease: () => {
        const dy = accumulatedDy.current;

        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }).start();

        setDragging(false);
        // Convert drag distance → 30-min slots
        const slotsChanged = Math.round(dy / SLOT_HEIGHT);
        const minutesChanged = slotsChanged * 30;

        if (Math.abs(minutesChanged) >= 30 && item.start_time && item.end_time) {
          const newStart = addMinutes(new Date(item.start_time), minutesChanged);
          const newEnd = addMinutes(new Date(item.end_time), minutesChanged);
          onRescheduleRequest(item, newStart, newEnd);
        }
        accumulatedDy.current = 0;
        // setCanDrag(false);
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
        setDragging(false);
        accumulatedDy.current = 0;
      },
    })
  ).current;

  return (
    <Animated.View
      style={{ transform: [{ translateY: pan }], zIndex: dragging ? 99 : 1 }}
      {...panResponder.panHandlers}
    >
      <View
        style={[
          styles.taskCard,
          { borderLeftColor: priorityColor },
          dragging && styles.taskCardDragging,
        ]}
      >
        {/* Drag hint */}
        <View style={styles.dragHintRow}>
          <Ionicons name="reorder-three-outline" size={20} color="#ccc" />
          <Text style={styles.dragHint}>hold & drag to reschedule</Text>
        </View>

        <View style={styles.taskCardHeader}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {item.task.title}
          </Text>
          <View style={[styles.priorityBadge, { backgroundColor: priorityBg }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {(item.task.importance_hint || 'normal').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.taskMeta}>
          <Ionicons name="time-outline" size={14} color="#888" />
          <Text style={styles.taskMetaText}>
            {item.start_time && item.end_time
              ? `${formatTime(item.start_time)} – ${formatTime(item.end_time)}`
              : 'Time TBD'}
          </Text>
        </View>

        {item.confidence_score > 0 && (
          <View style={styles.confidenceRow}>
            <View style={styles.confidenceBarBg}>
              <View
                style={[
                  styles.confidenceBarFill,
                  { width: `${Math.round(item.confidence_score * 100)}%` as any },
                ]}
              />
            </View>
            <Text style={styles.confidenceText}>
              {Math.round(item.confidence_score * 100)}% match
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AISchedulerScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [planItems, setPlanItems] = useState<TodayPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);

  // Reschedule state
  const [modalVisible, setModalVisible] = useState(false);
  const [pending, setPending] = useState<PendingReschedule | null>(null);

  // ── Fetch plan ────────────────────────────────────────────────────────────
  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.todayPlan();
      if (Array.isArray(data) && data.length > 0) {
        setPlanItems(data);
        setHasPlan(true);
      } else {
        setPlanItems([]);
        setHasPlan(false);
      }
    } catch (e) {
      console.log('FETCH PLAN ERROR:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // ── Generate plan ─────────────────────────────────────────────────────────
  const generateAIPlan = async () => {
    setGenerating(true);
    try {
      const response = await dashboardApi.generatePlan();
      if (response?.plan?.items) {
        setPlanItems(response.plan.items);
        setHasPlan(true);
      } else {
        await fetchPlan();
      }
      Alert.alert('✅ Plan Generated!', `Your AI schedule is ready with ${response?.plan?.items?.length ?? 0} tasks.`);
    } catch (error: any) {
      const msg = error?.message || 'Failed to generate AI plan';
      if (msg.includes('No pending tasks')) {
        Alert.alert('No Tasks', 'Add some pending tasks first, then generate a plan.');
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  // ── Handle drag drop ──────────────────────────────────────────────────────
  const handleRescheduleRequest = useCallback(
    async (item: TodayPlanItem, newStart: Date, newEnd: Date) => {
      try {
        const analysis = await aiApi.analyzeReschedule({
          plan_item_id: item.plan_item_id,
          new_start: newStart.toISOString(),
          new_end: newEnd.toISOString(),
        });

        setPending({
          item,
          newStart,
          newEnd,
          analysis,
        });

        setModalVisible(true);
      } catch (error) {
        console.log('ANALYZE ERROR:', error);
        Alert.alert(
          'Error',
          'Unable to analyze reschedule'
        );
      }
    },
    [planItems]
  );

  // ── Confirm reschedule ────────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (!pending) return;

    try {
      await aiApi.rescheduleItem({
        plan_item_id: pending.item.plan_item_id,
        new_start: pending.newStart.toISOString(),
        new_end: pending.newEnd.toISOString(),
      });

      setPlanItems((prev) =>
        prev
          .map((p) =>
            p.plan_item_id === pending.item.plan_item_id
              ? {
                ...p,
                start_time: pending.newStart.toISOString(),
                end_time: pending.newEnd.toISOString(),
              }
              : p
          )
          .sort(
            (a, b) =>
              new Date(a.start_time!).getTime() -
              new Date(b.start_time!).getTime()
          )
      );

      setModalVisible(false);
      setPending(null);

      Alert.alert(
        '✅ Rescheduled!',
        'Task moved to the new time slot.'
      );
    } catch (error) {
      console.log('RESCHEDULE ERROR:', error);

      Alert.alert(
        'Error',
        'Failed to reschedule task'
      );
    }
  }, [pending]);
  // ── Cancel reschedule ─────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setPending(null);
  }, []);

  const userName = user?.name?.split(' ')[0] || 'User';

  return (
    <View style={commonStyles.screen}>
      <TopCurve />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>Hi, {userName} 👋</Text>
            <Text style={styles.subText}>Let's plan your day smartly</Text>
          </View>
          <View style={styles.avatar}>
            {user?.profile_pic ? (
              <Image
                source={{ uri: user.profile_pic }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
        </View>

        {/* AI CARD */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <Ionicons name="sparkles" size={24} color="#a855f7" />
            <Text style={styles.cardTitle}>AI Scheduler</Text>
          </View>
          <Text style={styles.cardText}>
            {hasPlan
              ? 'Your schedule is ready! Drag any task up/down to reschedule it.'
              : 'Generate your AI-powered schedule based on your tasks, priorities, and deadlines.'}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, generating && styles.primaryButtonDisabled]}
            onPress={generateAIPlan}
            disabled={generating}
            activeOpacity={0.85}
          >
            {generating ? (
              <View style={styles.buttonRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.primaryButtonText}>  Generating...</Text>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <Ionicons name="sparkles-outline" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>
                  {hasPlan ? '  Regenerate Plan' : '  Generate AI Plan'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* LOADING */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#a855f7" />
            <Text style={styles.loadingText}>Loading your schedule...</Text>
          </View>
        )}

        {/* DRAG HINT BANNER */}
        {!loading && hasPlan && planItems.length > 0 && (
          <View style={styles.hintBanner}>
            <Ionicons name="hand-left-outline" size={18} color="#7c3aed" />
            <Text style={styles.hintText}>
              Hold & drag a card up/down to reschedule. AI will show impact before confirming.
            </Text>
          </View>
        )}

        {/* TIMELINE */}
        {!loading && hasPlan && planItems.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <Text style={styles.taskCount}>{planItems.length} tasks</Text>
            </View>

            <View style={styles.timeline}>
              {planItems.map((item, index) => {
                const isLast = index === planItems.length - 1;
                const pColor = getPriorityColor(item.task.importance_hint);
                const pBg = getPriorityBg(item.task.importance_hint);

                return (
                  <View key={item.plan_item_id} style={styles.timelineItem}>
                    {/* Time column */}
                    <View style={styles.timeColumn}>
                      <Text style={styles.timeStart}>
                        {item.start_time ? formatTime(item.start_time) : '--:--'}
                      </Text>
                      <Text style={styles.timeEnd}>
                        {item.end_time ? formatTime(item.end_time) : ''}
                      </Text>
                    </View>

                    {/* Dot + Line */}
                    <View style={styles.dotLineColumn}>
                      <View style={[styles.dot, { backgroundColor: pColor }]} />
                      {!isLast && <View style={styles.line} />}
                    </View>

                    {/* Draggable card */}
                    <View style={{ flex: 1 }}>
                      <DraggableCard
                        item={item}
                        allItems={planItems}
                        onRescheduleRequest={handleRescheduleRequest}
                        priorityColor={pColor}
                        priorityBg={pBg}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* EMPTY STATE */}
        {!loading && !hasPlan && (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Schedule Yet</Text>
            <Text style={styles.emptyText}>
              Add some tasks and tap "Generate AI Plan" to create your personalized daily schedule.
            </Text>
          </View>
        )}

        {/* QUICK ACTIONS */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridCard} activeOpacity={0.8} onPress={() => router.push('/(tabs)/home/add-task')}>
            <View style={styles.iconWrap}>
              <Ionicons name="add-circle-outline" size={26} color="#d14df0" />
            </View>
            <Text style={styles.gridText}>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridCard} activeOpacity={0.8} onPress={() => router.push('/(tabs)/tasks')}>
            <View style={styles.iconWrap}>
              <Ionicons name="list-outline" size={26} color="#d14df0" />
            </View>
            <Text style={styles.gridText}>Tasks</Text>
          </TouchableOpacity>
        </View>

        {/* TIP */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Productivity Tip</Text>
            <Text style={styles.tipText}>
              High priority tasks and closer deadlines are scheduled first. Drag to adjust — AI will advise before confirming.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* RESCHEDULE MODAL */}
      <RescheduleModal
        visible={modalVisible}
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </View>
  );
}

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 6 },
  taskName: { fontSize: 16, color: '#555', marginBottom: 10 },
  timeRow: { flexDirection: 'row' },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timePillText: { fontSize: 14, fontWeight: '700', color: '#7c3aed' },
  section: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6, paddingLeft: 4 },
  bullet: { fontSize: 14, fontWeight: '700', marginTop: 1, color: '#555', width: 16 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  summaryGreen: { backgroundColor: '#f0fdf4' },
  summaryRed: { backgroundColor: '#fef2f2' },
  summaryText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#555' },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#a855f7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmBtnWarn: { backgroundColor: '#ef4444' },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 24, paddingTop: 95, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  hello: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 4 },
  subText: { fontSize: 15, color: '#555' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#c68be9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: 52, height: 52, borderRadius: 26 },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  mainCard: { backgroundColor: '#f7d0fb', borderRadius: 24, padding: 22, marginBottom: 20 },
  mainCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  cardText: { fontSize: 15, lineHeight: 22, color: '#333', marginBottom: 18 },
  primaryButton: { height: 50, borderRadius: 25, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  primaryButtonDisabled: { backgroundColor: '#555' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', alignItems: 'center' },
  loadingWrap: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#888' },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ede9fe',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  hintText: { flex: 1, fontSize: 13, color: '#6d28d9', lineHeight: 18 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 14 },
  taskCount: {
    fontSize: 14, fontWeight: '600', color: '#a855f7',
    backgroundColor: '#f3e8ff', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, overflow: 'hidden', marginBottom: 14,
  },
  timeline: { marginBottom: 28 },
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timeColumn: { width: 65, alignItems: 'flex-end', paddingRight: 12, paddingTop: 12 },
  timeStart: { fontSize: 13, fontWeight: '700', color: '#111' },
  timeEnd: { fontSize: 11, color: '#999', marginTop: 2 },
  dotLineColumn: { width: 24, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2, marginTop: 14 },
  line: { width: 2, flex: 1, backgroundColor: '#e5e7eb', minHeight: 40 },
  // Draggable card
  taskCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
    marginLeft: 12, marginBottom: 12, borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  taskCardDragging: {
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 10,
    backgroundColor: '#fdf4ff', transform: [{ scale: 1.02 }],
  },
  dragHintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  dragHint: { fontSize: 11, color: '#ccc', fontStyle: 'italic' },
  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  taskTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111', marginRight: 8 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  priorityText: { fontSize: 10, fontWeight: '800' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  taskMetaText: { fontSize: 13, color: '#888' },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confidenceBarBg: { flex: 1, height: 4, backgroundColor: '#f3f4f6', borderRadius: 2, overflow: 'hidden' },
  confidenceBarFill: { height: '100%' as any, backgroundColor: '#a855f7', borderRadius: 2 },
  confidenceText: { fontSize: 11, color: '#a855f7', fontWeight: '600' },
  // Empty state
  emptyCard: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20, backgroundColor: '#fafafa', borderRadius: 24, borderWidth: 1.5, borderColor: '#ececec', marginBottom: 28 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginTop: 14, marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  // Grid
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  gridCard: { width: '48%', backgroundColor: '#fff', borderRadius: 22, borderWidth: 1.5, borderColor: '#ececec', paddingVertical: 22, paddingHorizontal: 14, alignItems: 'center' },
  iconWrap: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fdeaff', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  gridText: { fontSize: 15, fontWeight: '700', color: '#111' },
  // Tip
  tipCard: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ececec', borderRadius: 20, padding: 20, gap: 14, alignItems: 'flex-start' },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 6 },
  tipText: { fontSize: 14, lineHeight: 21, color: '#555' },
});