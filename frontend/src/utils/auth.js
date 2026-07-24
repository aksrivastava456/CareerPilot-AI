/**
 * Decodes a JWT token and checks if it has expired.
 * @param {string|null} token - The JWT token to verify.
 * @returns {boolean} True if the token is expired or invalid, false otherwise.
 */
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payloadBase64 = parts[1];
    // Replace base64url characters to standard base64 characters
    const normalizedBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = JSON.parse(atob(normalizedBase64));
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedPayload.exp < currentTime;
  } catch (e) {
    return true; // Treat as expired/invalid if decoding fails
  }
}

/**
 * Retrieves the access token from localStorage, clearing auth data if it has expired.
 * @returns {string|null} The token if valid, null otherwise.
 */
export function getValidToken() {
  const token = localStorage.getItem("access_token");
  if (token && isTokenExpired(token)) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    return null;
  }
  return token;
}
