export enum JobStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Success = 'Success',
  Failed = 'Failed',
}

export enum InputType {
  Text = 'Text to Video',
  Image = 'Image to Video',
}

export interface Job {
  id: string;
  prompt: string;
  inputType: InputType;
  model: string;
  aspectRatio: string;
  outputCount: number;
  imageFile?: File;
  status: JobStatus;
  resultUrl?: string; // Blob URL for the generated video
  error?: string;
  veoCookie?: string;
  apiKey?: string; // User-provided API key
}

// Represents a job that has been configured but not yet submitted to the main queue.
// This is now simplified to just a prompt, as config is global.
export interface PendingJobPrompt {
  id: string;
  prompt: string;
}

// Represents the global configuration that applies to all pending jobs.
export interface GlobalConfigState {
  inputType: InputType;
  model: string;
  aspectRatio: string;
  outputCount: number;
  imageFile?: File;
  veoCookie?: string;
  apiKey?: string; // User-provided API key
}