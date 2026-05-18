import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  authApi,
  getApiErrorMessage,
  setAuthToken,
} from '../../../services/api';

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
  ) => Promise<{
    success: boolean;
    message?: string;
  }>;

  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message?: string;
  }>;

  logout: () => Promise<void>;

  clearAllAuthData: () => Promise<void>;
};

const CURRENT_USER_KEY =
  'current_user';

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const initAuth = async () => {

      try {

        // await AsyncStorage.clear();

        const storedCurrentUser =
          await AsyncStorage.getItem(
            CURRENT_USER_KEY
          );

        const storedToken =
          await AsyncStorage.getItem(
            'token'
          );

        if (storedCurrentUser) {

          setUser(
            JSON.parse(
              storedCurrentUser
            )
          );
        }

        if (storedToken) {

          setAuthToken(
            storedToken
          );
        }

      } catch (error) {

        console.log(
          'Init auth error:',
          error
        );

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

    try {

      const response =
        await authApi.signup({

          name,
          email,
          password,
          gender,
        });

      const newUser: User = {

        name,
        email,
        password,
        gender,
      };

      await AsyncStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(newUser)
      );

      await AsyncStorage.setItem(
        'token',
        response.token
      );

      console.log(
        'SIGNUP TOKEN:',
        response.token
      );

      setAuthToken(
        response.token
      );

      setUser(newUser);

      return {
        success: true,
        message:
          response.message,
      };

    } catch (error) {

      return {
        success: false,
        message:
          getApiErrorMessage(
            error,
            'Signup failed'
          ),
      };
    }
  };

  const login = async (
    email: string,
    password: string
  ) => {

    try {

      const response =
        await authApi.login({
          email,
          password,
        });

      const loggedInUser: User = {
        name: response.user?.name || email.split('@')[0],
        email,
        password,
      };

      await AsyncStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(
          loggedInUser
        )
      );

      await AsyncStorage.setItem(
        'token',
        response.token
      );

      console.log(
        'LOGIN TOKEN:',
        response.token
      );

      setAuthToken(
        response.token
      );

      setUser(
        loggedInUser
      );

      return {
        success: true,
        message:
          response.message,
      };

    } catch (error) {

      return {
        success: false,
        message:
          getApiErrorMessage(
            error,
            'Login failed'
          ),
      };
    }
  };

  const logout = async () => {

    try {

      setUser(null);

      await AsyncStorage.removeItem(
        CURRENT_USER_KEY
      );

      await AsyncStorage.removeItem(
        'token'
      );

      setAuthToken(null);

    } catch (error) {

      console.log(
        'Logout error:',
        error
      );
    }
  };

  const clearAllAuthData =
    async () => {

      try {

        await AsyncStorage.removeItem(
          CURRENT_USER_KEY
        );

        await AsyncStorage.removeItem(
          'token'
        );

        setUser(null);

        setAuthToken(null);

      } catch (error) {

        console.log(
          'Clear auth data error:',
          error
        );
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

  const context =
    useContext(AuthContext);

  if (!context) {

    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}