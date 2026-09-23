/*
 * ============================================================
 * API CONFIG
 * ============================================================
 * The website calls the Spring Boot backend through /api.
 *
 * In Vite development, /api is proxied to the backend so the
 * browser does not run into CORS problems.
 *
 * For a deployed build, set VITE_API_BASE_URL to the public
 * Spring Boot backend URL, for example:
 *   VITE_API_BASE_URL=https://your-backend.example.com
 * ============================================================
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '';

const TOKEN_KEY = 'vericure_admin_token';
const ADMIN_KEY = 'vericure_admin_info';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredAdmin() {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }
}

export function storeSession(token, admin) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

/*
 * Central fetch wrapper.
 *
 * IMPORTANT: A failed/unreachable backend must not leave the
 * Login button stuck forever on "Logging in...".
 */
export async function apiRequest(path, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    console.log(`[VeriCure API] ${options.method || 'GET'} ${API_BASE_URL}${path}`);

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      // Response body was not JSON.
    }

    console.log(
      `[VeriCure API] ${response.status} ${options.method || 'GET'} ${path}`,
      data
    );

    if (response.status === 401) {
      clearSession();
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error('[VeriCure API] Request failed:', error);

    if (error.name === 'AbortError') {
      return {
        ok: false,
        status: 0,
        data: {
          success: false,
          message:
            'The backend did not respond within 15 seconds. Make sure Spring Boot is running and the API address is correct.',
        },
      };
    }

    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        message:
          'Could not connect to the VeriCure backend. Make sure Spring Boot is running and the API address is correct.',
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
