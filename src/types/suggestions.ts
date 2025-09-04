export interface Suggestion {
  name: string;
  description?: string;
  isApproved?: boolean;
  sector: string;
  type: 'issue' | 'standard';
  created_at?: string;
}

export interface SuggestionStore {
  suggestions: Suggestion[];
  addSuggestion: (suggestion: Suggestion) => void;
  approveSuggestion: (name: string) => void;
  rejectSuggestion: (name: string) => void;
  clearSuggestions: () => void;
}