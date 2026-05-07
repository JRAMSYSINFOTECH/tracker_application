import React, { createContext, useContext, useState } from 'react';

export type TaskStatus = 'pending' | 'completed';

export type TaskItem = {
  id: number;
  title: string;
  time: string;
  status: TaskStatus;
};

type TaskContextType = {
  tasks: TaskItem[];
  addTask: (task: Omit<TaskItem, 'id'>) => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 1, title: 'Lunch Date', time: '06 April, 2026 12:00 PM', status: 'pending' },
    { id: 2, title: 'Interview', time: '06 April, 2026 02:00 PM', status: 'completed' },
    { id: 3, title: 'React Native Practice', time: 'Today 05:00 PM', status: 'pending' },
    { id: 4, title: 'Push to GitHub', time: 'Today 07:00 PM', status: 'completed' },
  ]);

  const addTask = (task: Omit<TaskItem, 'id'>) => {
    const newTask: TaskItem = {
      id: Date.now(),
      ...task,
    };

    setTasks((prev) => [...prev, newTask]);
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask }}>
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