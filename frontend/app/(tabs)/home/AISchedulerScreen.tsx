import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import TopCurve from '../../../constants/src/components/TopCurve';
import { commonStyles } from '../../../constants/src/theme/commonStyles';
import { useAuth } from '../../../constants/src/context/AuthContext';

import { dashboardApi, TodayPlanItem } from '../../../services/api';

export default function TodayPlanScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [planItems, setPlanItems] = useState<TodayPlanItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [hasPlan, setHasPlan] = useState(false);

    // =========================================
    // FETCH EXISTING PLAN
    // =========================================
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
        } catch (error) {
            console.log('FETCH PLAN ERROR:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    // =========================================
    // GENERATE AI PLAN
    // =========================================
    const generateAIPlan = async () => {
        setGenerating(true);
        try {
            console.log('Generating AI Plan...');
            const response = await dashboardApi.generatePlan();
            console.log('AI PLAN RESPONSE:', response);

            if (response?.plan?.items) {
                setPlanItems(response.plan.items);
                setHasPlan(true);
            } else {
                await fetchPlan();
            }

            Alert.alert(
                '✅ Plan Generated!',
                `Your AI schedule is ready with ${response?.plan?.items?.length || 0} tasks.`
            );
        } catch (error: any) {
            console.log('AI PLAN ERROR:', error);
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

    // =========================================
    // HELPERS
    // =========================================
    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getPriorityColor = (priority: string | null) => {
        switch (priority) {
            case 'high': return '#E91E63';
            case 'medium': return '#FF9800';
            case 'low': return '#4CAF50';
            default: return '#9E9E9E';
        }
    };

    const getPriorityBg = (priority: string | null) => {
        switch (priority) {
            case 'high': return '#FDE8EF';
            case 'medium': return '#FFF3E0';
            case 'low': return '#E8F5E9';
            default: return '#F5F5F5';
        }
    };

    const userName = user?.name?.split(' ')[0] || 'User';

    // =========================================
    // RENDER
    // =========================================
    return (
        <View style={commonStyles.screen}>
            <TopCurve />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* HEADER */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.hello}>Hi, {userName} 👋</Text>
                        <Text style={styles.subText}>Let's plan your day smartly</Text>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {userName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* MAIN CARD */}
                <View style={styles.mainCard}>
                    <View style={styles.mainCardHeader}>
                        <Ionicons name="sparkles" size={24} color="#a855f7" />
                        <Text style={styles.cardTitle}>AI Scheduler</Text>
                    </View>

                    <Text style={styles.cardText}>
                        {hasPlan
                            ? 'Your schedule is ready! Tap below to regenerate if needed.'
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

                {/* LOADING STATE */}
                {loading && (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="large" color="#a855f7" />
                        <Text style={styles.loadingText}>Loading your schedule...</Text>
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
                                const priorityColor = getPriorityColor(item.task.importance_hint);
                                const priorityBg = getPriorityBg(item.task.importance_hint);

                                return (
                                    <View key={item.plan_item_id} style={styles.timelineItem}>
                                        {/* Left: Time Column */}
                                        <View style={styles.timeColumn}>
                                            <Text style={styles.timeStart}>
                                                {item.start_time ? formatTime(item.start_time) : '--:--'}
                                            </Text>
                                            <Text style={styles.timeEnd}>
                                                {item.end_time ? formatTime(item.end_time) : '--:--'}
                                            </Text>
                                        </View>

                                        {/* Middle: Dot + Line */}
                                        <View style={styles.dotLineColumn}>
                                            <View style={[styles.dot, { backgroundColor: priorityColor }]} />
                                            {!isLast && <View style={styles.line} />}
                                        </View>

                                        {/* Right: Task Card */}
                                        <View style={[styles.taskCard, { borderLeftColor: priorityColor }]}>
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
                                                        ? `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`
                                                        : 'Time TBD'}
                                                </Text>
                                            </View>

                                            {item.confidence_score > 0 && (
                                                <View style={styles.confidenceRow}>
                                                    <View style={styles.confidenceBarBg}>
                                                        <View
                                                            style={[
                                                                styles.confidenceBarFill,
                                                                { width: `${Math.round(item.confidence_score * 100)}%` },
                                                            ]}
                                                        />
                                                    </View>
                                                    <Text style={styles.confidenceText}>
                                                        {Math.round(item.confidence_score * 100)}% match
                                                    </Text>
                                                </View>
                                            )}
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
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <View style={styles.grid}>
                    <TouchableOpacity
                        style={styles.gridCard}
                        activeOpacity={0.8}
                        onPress={() => router.push('/(tabs)/home/add-task')}
                    >
                        <View style={styles.iconWrap}>
                            <Ionicons name="add-circle-outline" size={26} color="#d14df0" />
                        </View>
                        <Text style={styles.gridText}>Add Task</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.gridCard}
                        activeOpacity={0.8}
                        onPress={() => router.push('/(tabs)/tasks')}
                    >
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
                            High priority tasks and closer deadlines are automatically scheduled first by the AI scheduler.
                        </Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 95,
        paddingBottom: 120,
    },

    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },

    hello: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111',
        marginBottom: 4,
    },

    subText: {
        fontSize: 15,
        color: '#555',
    },

    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#c68be9',
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },

    mainCard: {
        backgroundColor: '#f7d0fb',
        borderRadius: 24,
        padding: 22,
        marginBottom: 28,
    },

    mainCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },

    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111',
    },

    cardText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#333',
        marginBottom: 18,
    },

    primaryButton: {
        height: 50,
        borderRadius: 25,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
    },

    primaryButtonDisabled: {
        backgroundColor: '#555',
    },

    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    loadingWrap: {
        alignItems: 'center',
        paddingVertical: 40,
    },

    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#888',
    },

    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111',
        marginBottom: 14,
    },

    taskCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#a855f7',
        backgroundColor: '#f3e8ff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 14,
    },

    // ======== TIMELINE ========
    timeline: {
        marginBottom: 28,
    },

    timelineItem: {
        flexDirection: 'row',
        marginBottom: 0,
    },

    timeColumn: {
        width: 65,
        alignItems: 'flex-end',
        paddingRight: 12,
        paddingTop: 4,
    },

    timeStart: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111',
    },

    timeEnd: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },

    dotLineColumn: {
        width: 24,
        alignItems: 'center',
    },

    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
        marginTop: 6,
    },

    line: {
        width: 2,
        flex: 1,
        backgroundColor: '#e5e7eb',
        minHeight: 40,
    },

    taskCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginLeft: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    taskCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },

    taskTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginRight: 8,
    },

    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },

    priorityText: {
        fontSize: 10,
        fontWeight: '800',
    },

    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },

    taskMetaText: {
        fontSize: 13,
        color: '#888',
    },

    confidenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    confidenceBarBg: {
        flex: 1,
        height: 4,
        backgroundColor: '#f3f4f6',
        borderRadius: 2,
        overflow: 'hidden',
    },

    confidenceBarFill: {
        height: '100%',
        backgroundColor: '#a855f7',
        borderRadius: 2,
    },

    confidenceText: {
        fontSize: 11,
        color: '#a855f7',
        fontWeight: '600',
    },

    // ======== EMPTY STATE ========
    emptyCard: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        backgroundColor: '#fafafa',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#ececec',
        marginBottom: 28,
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        marginTop: 14,
        marginBottom: 6,
    },

    emptyText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },

    // ======== GRID / QUICK ACTIONS ========
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 28,
    },

    gridCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#ececec',
        paddingVertical: 22,
        paddingHorizontal: 14,
        alignItems: 'center',
        marginBottom: 14,
    },

    iconWrap: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#fdeaff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },

    gridText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },

    // ======== TIP ========
    tipCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#ececec',
        borderRadius: 20,
        padding: 20,
        gap: 14,
        alignItems: 'flex-start',
    },

    tipContent: {
        flex: 1,
    },

    tipTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111',
        marginBottom: 6,
    },

    tipText: {
        fontSize: 14,
        lineHeight: 21,
        color: '#555',
    },
});