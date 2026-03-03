import {useEffect, useState} from "react";
import {AuthContext} from "./AuthContext.ts";
import {apiClient, setHeader} from "../service/apiClient.ts";
import router from "../router.tsx";
import { logoutRequest } from "../service/authService.ts";
import type { UserRole } from "../types/Auth";


interface AuthProviderProps{
    children: React.ReactNode;
}

export const AuthProvider = ({children}: AuthProviderProps) => {
    const getDefaultPathByRole = (role: UserRole) => {
        if (role === "admin") return "/admin/analytics";
        if (role === "seller") return "/seller/manage";
        return "/dashboard";
    };

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const[accessToken, setAccessToken] = useState<string>("")
    const [userRole, setUserRole] = useState<UserRole | null>(null);

    const[isAuthenticating, setIsAuthenticate] = useState<boolean>(true)

    const login = (token: string, role: UserRole) => {
        setIsLoggedIn(true)
        setAccessToken(token)
        setUserRole(role)
        setHeader(token)
        localStorage.setItem("accessToken", token);
        localStorage.setItem("userRole", role);
        window.dispatchEvent(new Event("auth-updated"));
        
    }

    const hasRole = (...roles: UserRole[]) => {
        return !!userRole && roles.includes(userRole);
    };

    const logout = async () => {
        try {
            await logoutRequest()
        } catch {
            // local cleanup still runs even if server logout fails
        }

        setIsLoggedIn(false);
        setAccessToken("")
        setUserRole(null)
        setHeader("")
        localStorage.clear();
        sessionStorage.clear();
        window.dispatchEvent(new Event("auth-updated"));
        window.location.replace("/login");
    }
    useEffect(()=>{
        setHeader(accessToken)
    },[accessToken])

    useEffect(() => {
        //console.log("App Mounted")
        const tryRefresh =async () =>{
            try{
                const result = await apiClient.post("/auth/refresh-token")
                setAccessToken(result.data.accessToken)
                setHeader(result.data.accessToken)
                const profile = await apiClient.get("/auth/profile");
                setIsLoggedIn(true)
                setUserRole(profile.data.role)
                localStorage.setItem("accessToken", result.data.accessToken);
                localStorage.setItem("userRole", profile.data.role);
                window.dispatchEvent(new Event("auth-updated"));

                const currentPath = window.location.pathname
                if (currentPath === "/login" || currentPath === "/signup" || currentPath === "/"){
                    router.navigate(getDefaultPathByRole(profile.data.role))
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            }catch (error) {
                setAccessToken("")
                setUserRole(null)
                setHeader("")
                setIsLoggedIn(false)
                localStorage.removeItem("accessToken");
                localStorage.removeItem("userRole");
                window.dispatchEvent(new Event("auth-updated"));

            }finally {
                setIsAuthenticate(false)
            }
        }

        tryRefresh()
    }, []);

    return(
        <AuthContext.Provider value={{isLoggedIn, userRole, login, hasRole, logout, isAuthenticating}}>
            {children}
        </AuthContext.Provider>
    )

}
