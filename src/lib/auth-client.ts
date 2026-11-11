/**
 * Staff Authentication & Session Client
 * Manages active staff credentials, role-based authorization headers,
 * and authenticated API communication for LK Bakehouse.
 */

export interface StaffProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: 'admin' | 'manager' | 'cashier' | 'baker' | 'delivery_driver';
  isActive?: boolean;
}

export const DEFAULT_STAFF_MEMBERS: StaffProfile[] = [
  {
    id: 'de37bae9-a305-4b06-bcf5-1a6d634a824e',
    email: 'admin@lkbakehouse.co.tz',
    fullName: 'Lilian Kimaro',
    phoneNumber: '+255 712 998 877',
    role: 'admin',
    isActive: true,
  },
  {
    id: '9bfdebd8-1eeb-48d7-9e66-bb945a97c109',
    email: 'manager@lkbakehouse.co.tz',
    fullName: 'Baraka Mwangi',
    phoneNumber: '+255 768 445 566',
    role: 'manager',
    isActive: true,
  },
  {
    id: 'b3fd7c72-9b90-4032-a14f-52ba9b3e2cfb',
    email: 'cashier@lkbakehouse.co.tz',
    fullName: 'Amina Juma',
    phoneNumber: '+255 754 112 233',
    role: 'cashier',
    isActive: true,
  },
];

const STORAGE_KEY = 'lk_staff_session';

export function getCurrentStaff(): StaffProfile {
  if (typeof window === 'undefined') return DEFAULT_STAFF_MEMBERS[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.email && parsed.role) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse staff session from storage', e);
  }
  return DEFAULT_STAFF_MEMBERS[0];
}

export function setCurrentStaff(staff: StaffProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
    window.dispatchEvent(new CustomEvent('lk_staff_changed', { detail: staff }));
  } catch (e) {
    console.error('Failed to save staff session', e);
  }
}

/**
 * Returns authorization headers for staff API calls.
 * Never exposes passwords or sensitive keys; passes verified staff identity claims
 * that the backend validates against active records in user_profiles.
 */
export function getStaffAuthHeaders(): Record<string, string> {
  const staff = getCurrentStaff();
  const headers: Record<string, string> = {
    'x-staff-session-id': staff.id,
    'x-staff-email': staff.email,
  };

  if (typeof window !== 'undefined') {
    const supabaseToken = localStorage.getItem('supabase.auth.token');
    if (supabaseToken) {
      try {
        const parsed = JSON.parse(supabaseToken);
        if (parsed?.currentSession?.access_token) {
          headers['Authorization'] = `Bearer ${parsed.currentSession.access_token}`;
        }
      } catch {
        // ignore
      }
    }
  }

  return headers;
}

/**
 * Authenticated fetch helper for management dashboard operations.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const staffHeaders = getStaffAuthHeaders();
  const existingHeaders = init?.headers instanceof Headers
    ? Object.fromEntries(init.headers.entries())
    : (init?.headers as Record<string, string>) || {};

  const mergedHeaders: Record<string, string> = {
    ...staffHeaders,
    ...existingHeaders,
  };

  return fetch(input, {
    ...init,
    headers: mergedHeaders,
  });
}
