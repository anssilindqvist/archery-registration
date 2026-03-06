export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Registration {
  name: string;
  birthYear: string;
  club: string;
  category: string;
  email: string;
}

export interface SubmitRequest extends Registration {
  waitlist?: boolean;
  preferredCategory?: string;
}

export interface CategoryAvailability {
  max: number;
  registered: number;
  available: boolean;
}
