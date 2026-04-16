/**
 * In-memory token store.
 * SecureStore handles persistence (app restart).
 * tokenManager handles in-session access without async reads.
 */
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenManager = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  setTokens: (at: string, rt: string) => {
    accessToken = at;
    refreshToken = rt;
  },
  clearTokens: () => {
    accessToken = null;
    refreshToken = null;
  },
};
