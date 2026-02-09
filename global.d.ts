/// <reference types="onejs-core" />
//
// global.d.ts

export {};

declare global {
  namespace CS {
    namespace Newtonsoft {
      namespace Json {
        namespace JsonConvert {
          function SerializeObject(arg: any): any;
        }
      }
    }
    namespace LoaderHandler {
      const Instance: any;
    }
    namespace Arken {
      namespace LoaderHandler {
        const Instance: any;
      }
      namespace ArkenGame {
        const Evolution: any;
        const Infinite: any;
        const Heart: any;
        const Realms: any;
        const Oasis: any;
      }
      namespace Bridge {
        namespace Instance {
          function add_OnStreamEvent(handler: function): void;
          function remove_OnStreamEvent(handler: function): void;
          function Emit(type: string, payloadJson: string): void;
          function EmitString(type: string, payload: string): void;
          function ShowWeb(path?: string): void;
          function HideWeb(): void;
          function NavigateWeb(path?: string): void;
          function Authorize(payload: string): void;
          function ChangeScene(sceneName: string): void;
          function HandleWebviewEvent(
            ns: string,
            method: string,
            args: any,
          ): void;
          function SetCameraTarget(
            name: string,
            axis?: number,
            rotation?: number,
          ): void;
        }
      }

      namespace Evolution {
        namespace NetworkManager {
          const Instance: any;
        }
      }

      namespace Web {
        namespace WebCommunicator {
          const Instance: any;

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
