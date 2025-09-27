declare module "react-speech-kit" {
    export function useSpeechSynthesis(): {
      speak: (args: { text: string }) => void;
      voices: SpeechSynthesisVoice[];
      speaking: boolean;
      supported: boolean;
      cancel: () => void;
    };
  
    export function useSpeechRecognition(options: {
      onResult: (result: string) => void;
      onEnd?: () => void;
    }): {
      listen: (options?: { lang?: string; interimResults?: boolean }) => void;
      listening: boolean;
      stop: () => void;
      supported: boolean;
    };
  }
  