import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService";
import { updateProfile as saveProfile } from "../services/profileService";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser()
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch((error) => {
        if (!cancelled) showToast(error.message, { type: "error" });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const login = async (credentials) => {
    const loggedInUser = await loginUser(credentials);
    setUser(loggedInUser);
    showToast(`Welcome back, ${loggedInUser.name.split(" ")[0]}`, { type: "success" });
    return loggedInUser;
  };

  const register = async (details) => {
    const newUser = await registerUser(details);
    setUser(newUser);
    showToast(`Account created — welcome, ${newUser.name.split(" ")[0]}`, {
      type: "success",
    });
    return newUser;
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      showToast("You've been signed out", { type: "info" });
    } catch (error) {
      showToast(error.message, { type: "error" });
    }
  };

  const updateUserProfile = async (profile) => {
    const updatedUser = await saveProfile(profile);
    setUser(updatedUser);
    return updatedUser;
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
