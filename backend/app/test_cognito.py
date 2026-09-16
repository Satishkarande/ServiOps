import requests


# ============================================================
# Cognito configuration
# ============================================================

COGNITO_DOMAIN = (
    "ap-south-15nv2x8ml6.auth.ap-south-1.amazoncognito.com"
)

CLIENT_ID = (
    "3dkiv4n680jhhd8lm55hddbemc"
)

REDIRECT_URI = "http://localhost:5173/auth/callback"


# ============================================================
# Cognito OAuth token endpoint
# ============================================================

TOKEN_URL = (
    f"https://{COGNITO_DOMAIN}/oauth2/token"
)


# ============================================================
# Get authorization code
# ============================================================

print()
print("Open this URL in your browser:")
print()

LOGIN_URL = (
    f"https://{COGNITO_DOMAIN}/login"
    f"?client_id={CLIENT_ID}"
    f"&response_type=code"
    f"&scope=email+openid+phone"
    f"&redirect_uri={REDIRECT_URI}"
)

print(LOGIN_URL)

print()
print("1. Open the URL")
print("2. Login with your Cognito user")
print("3. After redirect, copy ONLY the value after ?code=")
print()

AUTH_CODE = input(
    "Paste authorization code here: "
).strip()


# ============================================================
# Exchange authorization code for tokens
# ============================================================

data = {
    "grant_type": "authorization_code",
    "client_id": CLIENT_ID,
    "code": AUTH_CODE,
    "redirect_uri": REDIRECT_URI,
}


response = requests.post(
    TOKEN_URL,
    data=data,
    timeout=10,
)


# ============================================================
# Display result
# ============================================================

print()
print("Status:", response.status_code)

if response.ok:

    tokens = response.json()

    print()
    print("Token received successfully!")
    print("Token type:", tokens.get("token_type"))
    print("Expires in:", tokens.get("expires_in"))

    print()
    print("ACCESS TOKEN:")
    print(tokens.get("access_token"))

    print()
    print("ID TOKEN:")
    print(tokens.get("id_token"))

    print()
    print(
        "Refresh token received:",
        "yes" if tokens.get("refresh_token") else "no"
    )

else:

    print()
    print("Token exchange failed:")
    print(response.text)