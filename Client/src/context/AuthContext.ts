import {createContext} from "react";
import type { UserRole } from "../types/Auth";

export interface AuthContextType{
    isLoggedIn: boolean
    userRole: UserRole | null
    login: (accessToken: string, role: UserRole) => void
    hasRole: (...roles: UserRole[]) => boolean
    logout: () => Promise<void> | void
    isAuthenticating: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
