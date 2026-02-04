
import { useState } from 'react';
import { supabase } from '../utils/supabase';

// Helper to convert VAPID key
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribeToPush = async (userId: string) => {
    setLoading(true);
    setError(null);

    // Vercel / Production Check
    const apiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api/save-subscription`;
    
    // If we are on a deployed domain (not localhost) AND haven't set an API_URL, 
    // we assume the backend isn't deployed. Return false gracefully to prevent UI blocking.
    if (!import.meta.env.VITE_API_URL && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.warn("Push Notifications disabled: Backend URL (VITE_API_URL) not configured.");
        return false;
    }

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications not supported on this device');
      }

      // 1. Request Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission denied');
      }

      // 2. Get Service Worker Registration
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe to Push Manager
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
          throw new Error('VAPID Public Key missing in environment');
      }
      
      // Check if already subscribed to avoid unnecessary re-subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });
      }

      // 4. Send Subscription to Backend
      console.log(`[Push] Sending subscription to: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server rejected subscription: ${response.status} ${errText}`);
      }

      console.log('Push Subscription successful and saved to server.');
      return true;

    } catch (err: any) {
      console.error('Push Subscription Error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribeToPush, loading, error };
};
