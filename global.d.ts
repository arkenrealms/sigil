/// <reference types="onejs-core" />
//
// global.d.ts

export {};

declare global {
  namespace CS {
    namespace Arken {
      namespace Bridge {
        namespace Instance {
          function add_OnServerEvent(handler: function): void;
          function remove_OnServerEvent(handler: function): void;
          function Emit(type: string, payloadJson: string): void;
          function EmitString(type: string, payload: string): void;
        }
      }

      namespace Evolution {
        namespace NetworkManager {
          const Instance: any;
        }
      }

      namespace Web {
        namespace WebCommunicator {
          function EnsureOneJsAsset(remoteUrl: string, assetRel: string): void;
          function GetOneJsFullPath(assetRel: string): string;
          function PostJson(json: string): void;
        }
      }
    }
  }

  namespace JSX {
    interface IntrinsicElements {
      cooldownradial: {
        frac?: number;
        alpha?: number;
        color?: string;
        style?: any;
        class?: string;
        [key: string]: any;
      };
    }
  }
}
