export type HitlPhase = "thinking" | "questions" | "done";

export interface HitlOption {
  id: string;
  label: string;
}

export interface HitlQuestion {
  id: string;
  question: string;
  options: HitlOption[];
}

export interface HitlRound {
  id: string;
  thinkingTitle: string;
  thinkingDescription: string;
  questions: HitlQuestion[];
}

export interface HitlAnswer {
  selectedOptionId?: string;
  freeText?: string;
}

export interface WorldDraft {
  overview: string;
  geography: string;
  societies: string;
  conflicts: string;
  tone: string;
}


