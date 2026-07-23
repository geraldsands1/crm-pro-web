/**
 * The two roles the backend issues in a JWT (`roles.name`), and the only
 * two this portal knows how to authorise. A union rather than an enum:
 * the tsconfig sets `erasableSyntaxOnly`, and a union also narrows
 * correctly when a value arrives from JSON.
 */
export type UserRole = 'admin' | 'agent';

/** The signed-in user, exactly as `POST /auth/login` returns it. */
export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
}

/** Credentials collected by the login form. */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * `POST /auth/login` — note that `token` and `user` sit at the TOP level
 * of the envelope, not under `data` like every other endpoint. That is
 * the backend's actual shape and this type documents it rather than
 * papering over it.
 */
export interface LoginResponse {
  success: boolean;
  message?: string;
  token: string;
  user: AuthUser;
}

/**
 * `GET /auth/profile` — returns only what the JWT itself carries, so
 * there is no `full_name` here. It exists to answer one question: is this
 * token still accepted? The display name comes from the cached login
 * response.
 */
export interface ProfileResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/** What `useAuth()` exposes to the rest of the app. */
export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True while the stored token is being revalidated on boot. */
  isRestoringSession: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}
