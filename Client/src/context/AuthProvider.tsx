import {useEffect, useState} from "react";
import {AuthContext} from "./AuthContext.ts";
import {apiClient, setHeader} from "../service/apiClient.ts";
import router from "../router.tsx";
import { logoutRequest } from "../service/authService.ts";


interface AuthProviderProps{
    children: React.ReactNode;
}

export const AuthProvider = ({children}: AuthProviderProps) => {

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const[accessToken, setAccessToken] = useState<string>("")

    const[isAuthenticating, setIsAuthenticate] = useState<boolean>(true)

    const login = (token: string) => {
        setIsLoggedIn(true)
        setAccessToken(token)
        setHeader(token)
        localStorage.setItem("accessToken", token);
        window.dispatchEvent(new Event("auth-updated"));
        
    }

    const logout = async () => {
        try {
            await logoutRequest()
        } catch {
            // local cleanup still runs even if server logout fails
        }

        setIsLoggedIn(false);
        setAccessToken("")
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
                setIsLoggedIn(true)
                localStorage.setItem("accessToken", result.data.accessToken);
                window.dispatchEvent(new Event("auth-updated"));

                const currentPath = window.location.pathname
                if (currentPath === "/login" || currentPath === "/signup" || currentPath === "/"){
                    router.navigate("/UserDashboard")
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            }catch (error) {
                setAccessToken("")
                setHeader("")
                setIsLoggedIn(false)
                localStorage.removeItem("accessToken");
                window.dispatchEvent(new Event("auth-updated"));

            }finally {
                setIsAuthenticate(false)
            }
        }

        tryRefresh()
    }, []);

    return(
        <AuthContext.Provider value={{isLoggedIn, login, logout, isAuthenticating}}>
            {children}
        </AuthContext.Provider>
    )

}
