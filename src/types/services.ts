export interface IGrammarRequest {
  input: string;
}

export interface IGrammarResponse {
  input: string;
  label: string;
  score: number;
  output?: string;
  outputScore?: number;
}

export interface IASRResponse {
  text: string;
  fileName: string;
}
