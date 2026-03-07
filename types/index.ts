export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Registration {
  name: string;
  age: string;
  club: string;
  license: string;
  sporttiId: string;
  category: string;
  email: string;
  price: number;
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
