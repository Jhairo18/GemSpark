export interface RecetaRequest {
  prompt: string;
}

export interface RecetaResponse {
  respuesta: string;
  audio_url?: string;
}
