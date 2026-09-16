import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  exchangeCodeForTokens,
} from "./auth";

import { useAuth } from "./AuthContext";


function AuthCallback() {

  const navigate =
    useNavigate();


  const {
    setAccessToken,
  } = useAuth();


  useEffect(() => {

    async function handleCallback() {

      const params =
        new URLSearchParams(
          window.location.search
        );


      const code =
        params.get("code");


      // ========================================================
      // NO AUTHORIZATION CODE
      // ========================================================

      if (!code) {

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );

        return;

      }


      // ========================================================
      // EXCHANGE CODE FOR TOKENS
      // ========================================================

      try {

        const tokens =
          await exchangeCodeForTokens(
            code
          );


        setAccessToken(
          tokens.access_token
        );


        // ======================================================
        // AFTER SUCCESSFUL LOGIN → DASHBOARD
        // ======================================================

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );


      } catch (error) {

        console.error(
          "Cognito token exchange failed:",
          error
        );

      }

    }


    handleCallback();

  }, [
    navigate,
    setAccessToken,
  ]);


  return (

    <div
      style={{
        padding: "40px",
      }}
    >

      <h2>
        Signing you in...
      </h2>


      <p>
        Please wait...
      </p>

    </div>

  );

}


export default AuthCallback;


