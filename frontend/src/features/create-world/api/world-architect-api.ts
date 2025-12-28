import { request } from "@/shared/api/client";
import type { PlotTypeId } from "../model/types";

const createHeaders = (userId: string): HeadersInit => ({
  "X-User-Id": userId,
});

export interface WorldArchitectStartRequest {
  world_description: string;
  plot_type: PlotTypeId;
  plot_type_custom?: string | null;
  is_global_conflict_enabled: boolean;
}

export interface RunCreateResponse {
  run_id: string;
}

export interface HitlAnswerInput {
  selected_option_id?: string;
  free_text?: string;
}

export interface SubmitAnswersRequest {
  answers: Record<string, HitlAnswerInput>;
}

export const startWorldArchitectRun = async (
  userId: string,
  payload: WorldArchitectStartRequest
): Promise<RunCreateResponse> => {
  return request<RunCreateResponse>("/api/v1/world-architect/runs", {
    method: "POST",
    headers: createHeaders(userId),
    body: JSON.stringify(payload),
  });
};

export const submitWorldArchitectAnswers = async (
  userId: string,
  runId: string,
  payload: SubmitAnswersRequest
): Promise<void> => {
  return request<void>(`/api/v1/world-architect/runs/${runId}/answers`, {
    method: "POST",
    headers: createHeaders(userId),
    body: JSON.stringify(payload),
  });
};


