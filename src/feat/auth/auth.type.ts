export const AUTH_SERVERS = ['local', 'remote'] as const;
export const AUTH_SERVER_STORAGE_KEY = 'authServer';

export type AuthServer = (typeof AUTH_SERVERS)[number];

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface CallbackRequest {
  code: string;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  gender: Gender;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export const isAuthServer = (value: string | null | undefined): value is AuthServer => {
  return !!value && AUTH_SERVERS.includes(value as AuthServer);
};

export const getStoredAuthServer = (): AuthServer | null => {
  const value = localStorage.getItem(AUTH_SERVER_STORAGE_KEY);
  return isAuthServer(value) ? value : null;
};

export const setStoredAuthServer = (authServer: AuthServer): void => {
  localStorage.setItem(AUTH_SERVER_STORAGE_KEY, authServer);
};

export const clearStoredAuthServer = (): void => {
  localStorage.removeItem(AUTH_SERVER_STORAGE_KEY);
};
