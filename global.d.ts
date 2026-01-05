/// <reference types="onejs-core" />

export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      cooldownradial: {
        frac?: number;
        alpha?: number;
        color?: string;
        style?: any;
        class?: string;
        // allow anything else OneJS passes through:
        [key: string]: any;
      };
    }
  }
}
