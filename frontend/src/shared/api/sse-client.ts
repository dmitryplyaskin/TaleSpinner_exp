import type { SseEnvelope, SseEventHandler } from "./sse-types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const tryParseJson = <T>(text: string): T | null => {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

export interface SseClient {
  close: () => void;
}

export interface ConnectSseOptions {
  /**
   * EventSource supports cookies only. No custom headers.
   * Keep `false` for local dev unless you use cookie auth.
   */
  withCredentials?: boolean;
}

export interface ConnectSseParams {
  path: string;
  onOpen?: () => void;
  onError?: (err: Event) => void;
  /**
   * Default handler for unregistered event types (or "message").
   */
  onAnyEvent?: SseEventHandler;
  /**
   * Typed event handlers by SSE `event:` name.
   */
  handlers?: Record<string, SseEventHandler>;
  options?: ConnectSseOptions;
}

export const connectSse = ({
  path,
  onOpen,
  onError,
  onAnyEvent,
  handlers,
  options,
}: ConnectSseParams): SseClient => {
  const url = `${API_BASE}${path}`;
  const es = new EventSource(url, {
    withCredentials: options?.withCredentials ?? false,
  });

  es.onopen = () => onOpen?.();
  es.onerror = (err) => onError?.(err);

  const handle = (eventType: string, raw: MessageEvent<string>) => {
    const parsed = tryParseJson<SseEnvelope>(raw.data);
    if (!parsed) return;

    const handler = handlers?.[eventType] ?? onAnyEvent;
    handler?.(parsed, raw);
  };

  // default message event
  es.onmessage = (raw) => handle("message", raw);

  // custom named events
  for (const [eventType, _] of Object.entries(handlers ?? {})) {
    es.addEventListener(eventType, (raw) =>
      handle(eventType, raw as MessageEvent<string>)
    );
  }

  return {
    close: () => es.close(),
  };
};
