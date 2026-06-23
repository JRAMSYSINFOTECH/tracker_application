import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { taskApi, ApiError } from '../../../services/api';
import type { CreateTaskPayload } from '../../../services/api';
import { useAuth } from './AuthContext';

export type TaskStatus = 'pending' | 'completed' | 'missed';

export type TaskItem = {
  id: number;
  title: string;
  time: string;
  deadline: string;
  status: TaskStatus;
  description?: string;
  importance?: string;
};

type TaskContextType = {
  tasks: TaskItem[];
  loadTasks: () => Promise<void>;
  addTask: (payload: CreateTaskPayload) => Promise<void>;

  updateTask: (
    id: number,
    updates: Partial<TaskItem>
  ) => Promise<void>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {

  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadTasks();
    }
    if (!authLoading && !isAuthenticated) {
      setTasks([]);
    }
  }, [isAuthenticated, authLoading]);

  const loadTasks = async () => {
    try {
      const backendTasks = await taskApi.list();

      const formattedTasks: TaskItem[] = backendTasks.map((task) => ({
        id: task.task_id,
        title: task.title,
        deadline: task.deadline,
        time: task.deadline,
        status: task.status === 'completed' ? 'completed' : task.status === 'missed' ? 'missed' : 'pending',
        description: task.description ?? undefined,
        importance: task.importance_hint ?? undefined,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      // If token is invalid/expired → auto logout so user can login fresh
      if (error instanceof ApiError && (error.status === 401 || error.message.toLowerCase().includes('token'))) {
        console.log('Token expired or invalid — logging out automatically');
        await logout();
      } else {
        console.log('Load tasks error:', error);
      }
    }
  };

  const addTask = async (payload: CreateTaskPayload) => {
    try {
      const response = await taskApi.create(payload);

      const newTask: TaskItem = {
        id: response.task.task_id,
        title: response.task.title,
        deadline: response.task.deadline,
        time: response.task.deadline,
        status: response.task.status === 'completed' ? 'completed' : response.task.status === 'missed' ? 'missed' : 'pending',
        description: response.task.description ?? undefined,
        importance: response.task.importance_hint ?? undefined,
      };

      setTasks((prev) => [...prev, newTask]);
    } catch (error) {
      console.log('Add task error:', error);
      throw error; // re-throw so add-task screen can show error to user
    }
  };
  const updateTask = async (
    id: number,
    updates: Partial<TaskItem>
  ) => {

    try {

      await taskApi.update(
        id,
        updates
      );

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? {
              ...task,
              ...updates,
            }
            : task
        )
      );

    } catch (error) {

      console.log(
        'Update task error:',
        error
      );

      throw error;
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loadTasks,
        addTask,
        updateTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);

  if (!context) {
    throw new Error('useTaskContext must be used inside TaskProvider');
  }

  return context;
};