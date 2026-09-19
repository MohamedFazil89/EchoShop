import { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { loginUser, registerUser } from "../services/authService";
import { useToast } from "./ToastContext";
import { clearUserData } from "../utils/userStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage("ecoshop_session", null);
  const { showToast } = useToast();

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

  const logout = () => {
    setUser(null);
    clearUserData();
    showToast("You've been signed out", { type: "info" });
  };

  const value = { user, isAuthenticated: Boolean(user), login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
