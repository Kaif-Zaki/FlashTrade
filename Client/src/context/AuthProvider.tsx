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
    const getDefaultPathByRole = (role: UserRole, sellerApproved?: boolean, sellerActive?: boolean) => {
        if (role === "admin") return "/admin/analytics";
        if (role === "seller") {
            if (sellerApproved === false || sellerActive === false) return "/seller/approval-required";
            return "/seller/analytics";
        }
        return "/dashboard";
    };

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const[accessToken, setAccessToken] = useState<string>("")
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [sellerApproved, setSellerApproved] = useState<boolean | null>(null);
    const [sellerActive, setSellerActive] = useState<boolean | null>(null);

    const[isAuthenticating, setIsAuthenticate] = useState<boolean>(true)

    const login = (token: string, role: UserRole, isSellerApproved?: boolean, isSellerActive?: boolean) => {
        setIsLoggedIn(true)
        setAccessToken(token)
        setUserRole(role)
        setSellerApproved(typeof isSellerApproved === "boolean" ? isSellerApproved : null)
        setSellerActive(typeof isSellerActive === "boolean" ? isSellerActive : null)
        setHeader(token)
        localStorage.setItem("accessToken", token);
        localStorage.setItem("userRole", role);
        if (typeof isSellerApproved === "boolean") {
            localStorage.setItem("sellerApproved", String(isSellerApproved));
        } else {
            localStorage.removeItem("sellerApproved");
        }
        if (typeof isSellerActive === "boolean") {
            localStorage.setItem("sellerActive", String(isSellerActive));
        } else {
            localStorage.removeItem("sellerActive");
        }
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
        setSellerApproved(null)
        setSellerActive(null)
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
                setSellerApproved(
                    typeof profile.data.sellerApproved === "boolean" ? profile.data.sellerApproved : null
                )
                setSellerActive(
                    typeof profile.data.sellerActive === "boolean" ? profile.data.sellerActive : null
                )
                localStorage.setItem("accessToken", result.data.accessToken);
                localStorage.setItem("userRole", profile.data.role);
                if (typeof profile.data.sellerApproved === "boolean") {
                    localStorage.setItem("sellerApproved", String(profile.data.sellerApproved));
                } else {
                    localStorage.removeItem("sellerApproved");
                }
                if (typeof profile.data.sellerActive === "boolean") {
                    localStorage.setItem("sellerActive", String(profile.data.sellerActive));
                } else {
                    localStorage.removeItem("sellerActive");
                }
                window.dispatchEvent(new Event("auth-updated"));

                const currentPath = window.location.pathname
                if (currentPath === "/login" || currentPath === "/signup"){
                    router.navigate(
                        getDefaultPathByRole(
                            profile.data.role,
                            profile.data.sellerApproved,
                            profile.data.sellerActive
                        )
                    )
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            }catch (error) {
                setAccessToken("")
                setUserRole(null)
                setSellerApproved(null)
                setSellerActive(null)
                setHeader("")
                setIsLoggedIn(false)
                localStorage.removeItem("accessToken");
                localStorage.removeItem("userRole");
                localStorage.removeItem("sellerApproved");
                localStorage.removeItem("sellerActive");
                window.dispatchEvent(new Event("auth-updated"));

            }finally {
                setIsAuthenticate(false)
            }
        }

        tryRefresh()
    }, []);

    return(
        <AuthContext.Provider
            value={{isLoggedIn, userRole, sellerApproved, sellerActive, login, hasRole, logout, isAuthenticating}}
        >
            {children}
        </AuthContext.Provider>
    )

}
