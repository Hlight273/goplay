export interface PlayerData {
    index:number;
    url:string;
    curTime:number;
    paused:boolean;
    srcUserId:number;
    isExternal:boolean;
}

class PData implements PlayerData {
    index: number;
    url: string;
    curTime: number;
    paused: boolean;
    srcUserId: number;
    isExternal: boolean;
    constructor(
        index: number,
        url: string,
        curTime: number,
        paused: boolean,
        srcUserId: number,
        isExternal: boolean
      ) {
        this.index = index;
        this.url = url;
        this.curTime = curTime;
        this.paused = paused;
        this.srcUserId = srcUserId;
        this.isExternal = isExternal;
      }
}