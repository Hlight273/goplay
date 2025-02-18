import { GoPlayer } from "@/util/XgPlayer";
declare module 'vue' {
  interface ComponentCustomProperties {
    $GoPlayer : GoPlayer
  }
}
export {}