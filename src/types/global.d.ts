/** @type {import('next').NextConfig} */
// TypeScript declarations untuk web-push
declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  export interface WebPushError extends Error {
    statusCode?: number;
    headers?: Record<string, string>;
    body?: string;
  }

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  export function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer | null,
    options?: {
      TTL?: number;
      headers?: Record<string, string>;
      contentEncoding?: string;
      urgency?: 'very-low' | 'low' | 'normal' | 'high';
      topic?: string;
    }
  ): Promise<{
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }>;

  export function generateVAPIDKeys(): {
    publicKey: string;
    privateKey: string;
  };
}

// Extend Window interface untuk beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}
