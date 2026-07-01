import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  authApi,
  userApi,
  getApiErrorMessage,
  setAuthToken,
} from '../../../services/api';

type Gender = 'F' | 'M' | 'O';

type User = {
  name: string;
  email: string;
  password?: string;
  gender?: Gender;
  profile_pic?: string | null;
};

type AuthContextType = {
  user: User | null;

  isAuthenticated: boolean;

  loading: boolean;

  signup: (
    name: string,
    email: string,
    password: string,
    gender?: Gender,
    profileImageUri?: string | null
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

  googleLogin: (
  email: string,
  name: string,
  googleId: string,
  profile_pic?: string
) => Promise<{
  success: boolean;
  message?: string;
}>;

  logout: () => Promise<void>;

  clearAllAuthData: () => Promise<void>;

  updateProfile: (
    name: string,
    email: string,
    gender?: Gender,
    profileImageUri?: string | null
  ) => Promise<{
    success: boolean;
    message?: string;
  }>;
};

const CURRENT_USER_KEY = 'current_user';

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

  const [token, setToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedCurrentUser =
          await AsyncStorage.getItem(
            CURRENT_USER_KEY
          );

        const storedToken =
          await AsyncStorage.getItem(
            'token'
          );

        if (storedCurrentUser && storedToken) {
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

          setToken(
            storedToken
          );
        } else {
          await AsyncStorage.removeItem(
            CURRENT_USER_KEY
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
    gender?: Gender,
    profileImageUri?: string | null
  ) => {
    try {
      const response =
        await authApi.signup({
          name,
          email,
          password,
          gender,
          profileImageUri,
        });

      const newUser: User = {
        name,
        email,
        password,
        gender,
        profile_pic:
          (response as any).profile_pic ||
          (response as any).user?.profile_pic ||
          null,
      };

      await AsyncStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(newUser)
      );

      await AsyncStorage.setItem(
        'token',
        response.token
      );

      setAuthToken(
        response.token
      );

      setToken(
        response.token
      );

      setUser(newUser);

      return {
        success: true,
        message: response.message,
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
        name:
          response.user?.name ||
          email.split('@')[0],
        email,
        password,
        gender:
          (response.user as any)?.gender,
        profile_pic:
          (response.user as any)
            ?.profile_pic || null,
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

      setAuthToken(
        response.token
      );

      setToken(
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

  const googleLogin = async (
  email: string,
  name: string,
  googleId: string,
  profile_pic?: string
) => {
  try {
    const response =
      await authApi.googleMobileLogin({
        email,
        name,
        googleId,
        profile_pic,
      });

    const googleUser: User = {
      name,
      email,
      profile_pic: profile_pic || null,
    };

    await AsyncStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify(googleUser)
    );

    await AsyncStorage.setItem(
      'token',
      response.token
    );

    setAuthToken(
      response.token
    );

    setToken(
      response.token
    );

    setUser(
      googleUser
    );

    return {
      success: true,
      message: response.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        getApiErrorMessage(
          error,
          'Google login failed'
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

      setToken(null);
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

        setToken(null);
      } catch (error) {
        console.log(
          'Clear auth data error:',
          error
        );
      }
    };

  const updateProfile = async (
    name: string,
    email: string,
    gender?: Gender,
    profileImageUri?: string | null
  ) => {
    try {
      const response =
        await userApi.updateProfile({
          name,
          email,
          gender,
          profileImageUri,
        });

      const updatedUser: User = {
        name:
          response.user?.name || name,
        email:
          response.user?.email ||
          email,
        gender:
          response.user?.gender ||
          gender,
        // If profileImageUri is null, user removed their photo → clear it.
        // If it's a string (local URI or URL), use backend URL or the URI.
        // Otherwise keep existing profile_pic.
        profile_pic:
          profileImageUri === null
            ? (response.user?.profile_pic ?? null)
            : response.user?.profile_pic ||
              profileImageUri ||
              user?.profile_pic ||
              null,
      };

      await AsyncStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(updatedUser)
      );

      setUser(updatedUser);

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
            'Update profile failed'
          ),
      };
    }
  };

  return (
    <AuthContext.Provider
  value={{
    user,
    isAuthenticated: !!user && !!token,
    loading,
    signup,
    login,
    googleLogin,
    logout,
    clearAllAuthData,
    updateProfile,
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
