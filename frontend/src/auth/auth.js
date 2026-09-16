import { cognitoConfig } from "./cognito";


const generateRandomString = (length = 64) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  const randomValues = crypto.getRandomValues(
    new Uint8Array(length)
  );

  return Array.from(randomValues)
    .map((value) => chars[value % chars.length])
    .join("");
};


const base64UrlEncode = (arrayBuffer) => {
  return btoa(
    String.fromCharCode(
      ...new Uint8Array(arrayBuffer)
    )
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};


const sha256 = async (plainText) => {
  const encoder = new TextEncoder();

  return crypto.subtle.digest(
    "SHA-256",
    encoder.encode(plainText)
  );
};


export async function login() {
  const codeVerifier = generateRandomString();

  const challengeBuffer =
    await sha256(codeVerifier);

  const codeChallenge =
    base64UrlEncode(challengeBuffer);

  sessionStorage.setItem(
    "cognito_code_verifier",
    codeVerifier
  );

  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    response_type: "code",
    scope: "openid email phone",
    redirect_uri: cognitoConfig.redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    prompt: "login",
  });

  window.location.href =
    `${cognitoConfig.domain}/oauth2/authorize?${params}`;
}


export async function exchangeCodeForTokens(code) {
  const codeVerifier =
    sessionStorage.getItem(
      "cognito_code_verifier"
    );

  if (!codeVerifier) {
    throw new Error(
      "Cognito code verifier is missing"
    );
  }

  const response = await fetch(
    `${cognitoConfig.domain}/oauth2/token`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },

      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: cognitoConfig.clientId,
        code,
        redirect_uri: cognitoConfig.redirectUri,
        code_verifier: codeVerifier,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Token exchange failed: ${error}`
    );
  }

  const tokens = await response.json();

  sessionStorage.setItem(
    "access_token",
    tokens.access_token
  );

  sessionStorage.setItem(
    "id_token",
    tokens.id_token
  );

  if (tokens.refresh_token) {
    sessionStorage.setItem(
      "refresh_token",
      tokens.refresh_token
    );
  }

  sessionStorage.removeItem(
    "cognito_code_verifier"
  );

  return tokens;
}


export function getAccessToken() {
  return sessionStorage.getItem(
    "access_token"
  );
}


export function logout() {
  // Clear local authentication data first
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("id_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("cognito_code_verifier");

  // Tell Cognito to end its hosted login session
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    logout_uri: "http://localhost:5173/",
  });

  window.location.href =
    `${cognitoConfig.domain}/logout?${params.toString()}`;
}


