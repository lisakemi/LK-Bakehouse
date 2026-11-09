import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-public-key')
  );
};

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    console.log('Supabase client initialized with Realtime support.');
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabase = clientInstance;

// Shared listener registries to fan out events to multiple components safely
const orderListeners = new Set<(payload: any) => void>();
const notificationListeners = new Set<(item: any) => void>();

// Supabase Realtime Channel Singletons (guarantees .on() is never called after .subscribe())
let supabaseOrdersChannel: any = null;
let supabaseNotificationsChannel: any = null;

function ensureSupabaseOrdersChannel() {
  if (!supabase || supabaseOrdersChannel) return;

  try {
    supabaseOrdersChannel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          orderListeners.forEach((listener) => {
            try {
              listener(payload);
            } catch (e) {
              console.error('Supabase order listener callback error:', e);
            }
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to Supabase Realtime orders channel');
        }
      });
  } catch (err) {
    console.warn('Failed to subscribe to Supabase orders channel:', err);
  }
}

function releaseSupabaseOrdersChannelIfIdle() {
  if (orderListeners.size === 0 && supabaseOrdersChannel && supabase) {
    try {
      supabase.removeChannel(supabaseOrdersChannel);
    } catch (err) {
      console.warn('Failed to remove Supabase orders channel:', err);
    }
    supabaseOrdersChannel = null;
  }
}

function ensureSupabaseNotificationsChannel() {
  if (!supabase || supabaseNotificationsChannel) return;

  try {
    supabaseNotificationsChannel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          notificationListeners.forEach((listener) => {
            try {
              listener(payload.new);
            } catch (e) {
              console.error('Supabase notification listener callback error:', e);
            }
          });
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('Failed to subscribe to Supabase notifications channel:', err);
  }
}

function releaseSupabaseNotificationsChannelIfIdle() {
  if (notificationListeners.size === 0 && supabaseNotificationsChannel && supabase) {
    try {
      supabase.removeChannel(supabaseNotificationsChannel);
    } catch (err) {
      console.warn('Failed to remove Supabase notifications channel:', err);
    }
    supabaseNotificationsChannel = null;
  }
}

// Shared SSE connection singleton to prevent browser HTTP connection starvation
let sharedEventSource: EventSource | null = null;

function ensureSharedEventSource() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
  if (sharedEventSource) return;

  try {
    sharedEventSource = new EventSource('/api/live/stream');
    sharedEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === 'order_created' ||
          data.type === 'order_status_updated' ||
          data.type === 'order_cancellation_requested' ||
          data.type === 'payment_verified'
        ) {
          orderListeners.forEach((listener) => {
            try {
              listener(data);
            } catch (e) {
              console.error('Order listener error:', e);
            }
          });
        }
        if (data.type === 'notification_new' && data.notification) {
          notificationListeners.forEach((listener) => {
            try {
              listener(data.notification);
            } catch (e) {
              console.error('Notification listener error:', e);
            }
          });
        }
      } catch {
        // ignore parse errors
      }
    };
    sharedEventSource.onerror = () => {
      // Browser EventSource automatically attempts reconnection
    };
  } catch (err) {
    console.warn('Unable to initialize shared EventSource:', err);
  }
}

function releaseSharedEventSourceIfIdle() {
  if (orderListeners.size === 0 && notificationListeners.size === 0 && sharedEventSource) {
    sharedEventSource.close();
    sharedEventSource = null;
  }
}

/**
 * Real-time order update listener supporting both Supabase Realtime and Backend SSE.
 * Fans out events across multiple components without duplicate channel subscription errors.
 */
export const subscribeToOrders = (onUpdate: (payload: any) => void): (() => void) => {
  orderListeners.add(onUpdate);

  if (supabase) {
    ensureSupabaseOrdersChannel();
  }
  ensureSharedEventSource();

  return () => {
    orderListeners.delete(onUpdate);
    releaseSupabaseOrdersChannelIfIdle();
    releaseSharedEventSourceIfIdle();
  };
};

/**
 * Real-time notifications listener supporting both Supabase Realtime and Backend SSE.
 */
export const subscribeToNotifications = (onNotification: (item: any) => void): (() => void) => {
  notificationListeners.add(onNotification);

  if (supabase) {
    ensureSupabaseNotificationsChannel();
  }
  ensureSharedEventSource();

  return () => {
    notificationListeners.delete(onNotification);
    releaseSupabaseNotificationsChannelIfIdle();
    releaseSharedEventSourceIfIdle();
  };
};
