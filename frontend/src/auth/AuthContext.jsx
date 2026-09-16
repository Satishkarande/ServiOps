import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { API_URL } from "../config";
import {
  getAccessToken,
  login,
  logout,
} from "./auth";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [accessToken, setAccessToken] =
    useState(getAccessToken());

  const [currentUser, setCurrentUser] =
    useState(null);

  const [permissions, setPermissions] =
    useState([]);

  const [loadingUser, setLoadingUser] =
    useState(false);


  // ============================================================
  // Load current ServiOps user
  // ============================================================

  useEffect(() => {

    const loadCurrentUser = async () => {

      if (!accessToken) {

        setCurrentUser(null);
        setPermissions([]);
        setLoadingUser(false);

        return;
      }


      try {

        setLoadingUser(true);


        const response = await fetch(
          `${API_URL}/users/me`,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );


        if (!response.ok) {

          throw new Error(
            `Failed to load current user: ${response.status}`
          );

        }


        const data =
          await response.json();


        setCurrentUser(data);

        setPermissions(
          data.permissions || []
        );


      } catch (error) {

        console.error(
          "Failed to load current user:",
          error
        );

        setCurrentUser(null);
        setPermissions([]);

      } finally {

        setLoadingUser(false);

      }

    };


    loadCurrentUser();

  }, [accessToken]);


  // ============================================================
  // Permission helper
  // ============================================================

  const hasPermission = (
    permissionName
  ) => {

    return permissions.includes(
      permissionName
    );

  };


  // ============================================================
  // Auth Context
  // ============================================================

  const value = {

    accessToken,

    isAuthenticated:
      Boolean(accessToken),

    currentUser,

    permissions,

    loadingUser,

    hasPermission,

    setAccessToken,

    login,

    logout,

  };


  return (

    <AuthContext.Provider
      value={value}
    >

      {children}

    </AuthContext.Provider>

  );

}


export function useAuth() {

  return useContext(
    AuthContext
  );

}


