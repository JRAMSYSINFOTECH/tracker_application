import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Gender = 'F' | 'M' | 'O';

type User = {
  name: string;
  email: string;
  password: string;
  gender?: Gender;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signup: (
    name: string,
    email: string,
    password: string,
    gender?: Gender
  ) => Promise<{ success: boolean; message?: string }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  clearAllAuthData: () => Promise<void>;
};

const REGISTERED_USER_KEY = 'registered_user';
const CURRENT_USER_KEY = 'current_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await AsyncStorage.removeItem(CURRENT_USER_KEY);
        setUser(null);
      } catch (error) {
        console.log('Init auth error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signup = async (
    name: string,
    email: string,
    password: string,
    gender?: Gender
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    try {
      const storedRegisteredUser = await AsyncStorage.getItem(REGISTERED_USER_KEY);
      const existingUser: User | null = storedRegisteredUser
        ? JSON.parse(storedRegisteredUser)
        : null;

      if (existingUser?.email === normalizedEmail) {
        return { success: false, message: 'User already exists' };
      }

      const newUser: User = {
        name: name.trim(),
        email: normalizedEmail,
        password: normalizedPassword,
        gender,
      };

      await AsyncStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(newUser));
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      setUser(newUser);

      return { success: true, message: 'Signup successful' };
    } catch (error) {
      console.log('Signup save error:', error);
      return { success: false, message: 'Failed to save user' };
    }
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    try {
      const storedRegisteredUser = await AsyncStorage.getItem(REGISTERED_USER_KEY);

      if (!storedRegisteredUser) {
        return { success: false, message: 'No account found. Please sign up first' };
      }

      const currentRegisteredUser: User = JSON.parse(storedRegisteredUser);

      if (
        currentRegisteredUser.email !== normalizedEmail ||
        currentRegisteredUser.password !== normalizedPassword
      ) {
        return { success: false, message: 'Invalid email or password' };
      }

      setUser(currentRegisteredUser);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentRegisteredUser));

      return { success: true, message: 'Login successful' };
    } catch (error) {
      console.log('Login error:', error);
      return { success: false, message: 'Failed to login' };
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  const clearAllAuthData = async () => {
    try {
      await AsyncStorage.removeItem(REGISTERED_USER_KEY);
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
    } catch (error) {
      console.log('Clear auth data error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        signup,
        login,
        logout,
        clearAllAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}