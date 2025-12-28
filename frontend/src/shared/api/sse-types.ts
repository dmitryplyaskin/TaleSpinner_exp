export interface SseEnvelope<TPayload = unknown> {
  run_id: string;
  seq: number;
  type: string;
  ts: string;
  payload: TPayload;
}

export type SseEventHandler<TPayload = unknown> = (
  envelope: SseEnvelope<TPayload>,
  raw: MessageEvent<string>
) => void;
