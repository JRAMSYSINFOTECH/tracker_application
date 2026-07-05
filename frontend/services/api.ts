import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_URL } from '../constants/api';

export type AuthResponse = {
  message: string;
  token: string;

  user?: {
    user_id: number;
    name: string;
    email: string;
     profile_pic?: string | null;
  };
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  gender?: 'F' | 'M' | 'O';
  profileImageUri?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UpdateProfilePayload = {
  name: string;
  email: string;
  gender?: 'F' | 'M' | 'O';
  profileImageUri?: string | null;
};

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'missed';
export type TaskImportance = 'low' | 'medium' | 'high';
export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'custom';

export type BackendTask = {
  task_id: number;
  user_id: number;
  title: string;
  description: string | null;
  deadline: string;
  estimated_minutes: number;
  importance_hint: TaskImportance | null;
  status: TaskStatus;
  repeat_frequency: ReminderFrequency;
  repeat_days: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  deadline: string;
  estimated_minutes: number;
  importance_hint?: TaskImportance;
  status?: TaskStatus;
  repeat_frequency?: ReminderFrequency;
  repeat_days?: string | null;
};


export type UpdateTaskPayload = Partial<CreateTaskPayload> & {
  status?: TaskStatus;
};

type TaskMutationResponse = {
  message: string;
  task: BackendTask;
};

export type BackendReminder = {
  reminder_id: number;
  task_id: number;
  remind_at: string;
  frequency: ReminderFrequency;
  is_active: boolean;
  task?: {
    title: string;
    deadline: string;
    status: TaskStatus;
  };
};

export type CreateReminderPayload = {
  task_id: number;
  remind_at: string;
  frequency: ReminderFrequency;
};

type ReminderMutationResponse = {
  message: string;
  reminder: BackendReminder;
};

export type TodayPlanItem = {
  plan_item_id: number;
  task_id: number;
  slot_order: number;
  item_status: 'scheduled' | 'done' | 'skipped' | 'moved';
  start_time: string;
  end_time: string;
  confidence_score: number;
  task: {
    title: string;
    deadline: string;
    status: TaskStatus;
    importance_hint: TaskImportance | null;
  };
};

type GeneratePlanResponse = {
  message: string;
  progress: number;
  plan: {
    plan_id: number;
    plan_date: string;
    status: string;
    items: TodayPlanItem[];
  };
};

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

const getPayloadMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const message = record.message || record.error;

  return typeof message === 'string' ? message : null;
};

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
};

const getImageFileInfo = (uri: string) => {
  const cleanUri = uri.split('?')[0];
  const uriParts = cleanUri.split('/');
  const rawFileName = uriParts[uriParts.length - 1] || '';
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(rawFileName);
  const fileName = hasExtension ? rawFileName : 'profile-pic.jpg';
  const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const fileType = fileExt === 'jpg' ? 'jpeg' : fileExt;

  return {
    fileName,
    mimeType: `image/${fileType}`,
  };
};

const appendProfileImage = async (formData: FormData, uri: string) => {
  const { fileName, mimeType } = getImageFileInfo(uri);

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const typedBlob = blob.type ? blob : blob.slice(0, blob.size, mimeType);

    (formData.append as any)('profile_pic', typedBlob, fileName);
    return;
  }

  formData.append(
    'profile_pic',
    {
      uri,
      name: fileName,
      type: mimeType,
    } as any
  );
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {}
) => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const storedToken = authToken || await AsyncStorage.getItem('token');

  const requestToken = options.token ?? storedToken;

  if (requestToken) {
    headers.Authorization = `Bearer ${requestToken}`;
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined
        ? undefined
        : (options.body instanceof FormData ? (options.body as any) : JSON.stringify(options.body)),
    });
  } catch {
    throw new ApiError(
      'Cannot reach backend. Please start the backend server and try again.',
      0
    );
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(
      getPayloadMessage(data) || 'Request failed',
      response.status,
      data
    );
  }

  return data as T;
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  return fallback;
};

export const authApi = {
  signup: async (payload: SignupPayload) => {
    if (payload.profileImageUri) {
      const formData = new FormData();

      formData.append('name', payload.name);
      formData.append('email', payload.email);
      formData.append('password', payload.password);

      if (payload.gender) {
        formData.append('gender', payload.gender);
      }

      await appendProfileImage(formData, payload.profileImageUri);

      return apiRequest<AuthResponse>(
        '/api/auth/signup',
        {
          method: 'POST',
          body: formData,
        }
      );
    }

    return apiRequest<AuthResponse>(
      '/api/auth/signup',
      {
        method: 'POST',
        body: {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          gender: payload.gender,
        },
      }
    );
  },

  login: (payload: LoginPayload) =>
    apiRequest<AuthResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: payload,
      }
    ),

  googleLogin: () => {
    return `${API_URL}/auth/google`;
  },

  googleMobileLogin: (payload: {
    email: string;
    name: string;
    googleId: string;
    profile_pic?: string;
  }) =>
    apiRequest<AuthResponse>(
      '/api/auth/google-mobile',
      {
        method: 'POST',
        body: payload,
      }
    ),
};

export type OverlapConflict = {
  task_id: number;
  title: string;
  start: string;
  end: string;
};

export type OverlapCheckResponse = {
  hasOverlap: boolean;
  conflicts: OverlapConflict[];
};

export type OccurrenceStatus = 'pending' | 'completed' | 'skipped';

export type TaskOccurrence = {
  occurrence_id: number;
  task_id: number;
  occurrence_date: string;
  status: OccurrenceStatus;
  created_at: string;
};

export const taskApi = {
  list: () => apiRequest<BackendTask[]>('/api/tasks'),
  create: (payload: CreateTaskPayload) =>
    apiRequest<TaskMutationResponse>('/api/tasks', {
      method: 'POST',
      body: payload,
    }),
  update: (taskId: number, payload: UpdateTaskPayload) =>
    apiRequest<TaskMutationResponse>(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: payload,
    }),
  delete: (taskId: number) =>
    apiRequest<{ message: string }>(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    }),
  checkOverlap: (payload: { deadline: string; estimated_minutes: number; exclude_task_id?: number }) =>
    apiRequest<OverlapCheckResponse>('/api/tasks/check-overlap', {
      method: 'POST',
      body: payload,
    }),
};

export const occurrenceApi = {
  mark: (payload: { task_id: number; occurrence_date: string; status: OccurrenceStatus }) =>
    apiRequest<{ message: string; occurrence: TaskOccurrence }>('/api/tasks/occurrence', {
      method: 'POST',
      body: payload,
    }),
  getForDate: (date: string) =>
    apiRequest<(TaskOccurrence & { task: { title: string; repeat_frequency: string } })[]>(
      `/api/tasks/occurrences?date=${date}`
    ),
};


export const reminderApi = {
  listDue: () => apiRequest<BackendReminder[]>('/api/reminders'),
  create: (payload: CreateReminderPayload) =>
    apiRequest<ReminderMutationResponse>('/api/reminders', {
      method: 'POST',
      body: payload,
    }),
};

export type DashboardOverview = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  missed: number;
};

export const dashboardApi = {
  overview: () => apiRequest<DashboardOverview>('/api/dashboard/overview'),
  todayPlan: () => apiRequest<TodayPlanItem[]>('/api/dashboard/today-plan'),
  reminders: () => apiRequest<BackendReminder[]>('/api/dashboard/reminders'),
  generatePlan: () =>
    apiRequest<GeneratePlanResponse>('/api/ai/generate-plan', {
      method: 'POST',
      body: {
        timezoneOffset: new Date().getTimezoneOffset()
      }
    }),
};
export type RescheduleAnalysisResponse = {
  advantages: string[];
  disadvantages: string[];
  recommendation: 'change' | 'keep';
  summary: string;
};

export const aiApi = {
  analyzeReschedule: (payload: {
    plan_item_id: number;
    new_start: string;
    new_end: string;
  }) =>
    apiRequest<RescheduleAnalysisResponse>(
      '/api/ai/analyze-reschedule',
      {
        method: 'POST',
        body: payload,
      }
    ),

  rescheduleItem: (payload: {
    plan_item_id: number;
    new_start: string;
    new_end: string;
  }) =>
    apiRequest<{
      message: string;
      item: TodayPlanItem;
    }>('/api/ai/reschedule-item', {
      method: 'POST',
      body: payload,
    }),
};

export const userApi = {
  getProfile: () => apiRequest<any>('/api/user/profile'),
  updateProfile: async (payload: UpdateProfilePayload) => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    if (payload.gender) {
      formData.append('gender', payload.gender);
    }

    if (payload.profileImageUri === null) {
      formData.append('remove_profile_pic', 'true');
    } else if (payload.profileImageUri) {
      const uri = payload.profileImageUri;
      if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
        await appendProfileImage(formData, uri);
      }
    }

    return apiRequest<any>('/api/user/update-profile', {
      method: 'PUT',
      body: formData,
    });
  },
};
