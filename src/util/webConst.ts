export enum ResultCode {
    SUCCESS = 20000,
    ERROR = 20001,
    EMPTY = 20002,
    EXPIRED = 20003,
}

const isLocalTest:boolean = false;
const RUrl:string = "192.168.3.55";

const FinalIp = isLocalTest?"localhost":RUrl

export const websocketRoot = `http://${FinalIp}:8081/ws`;
export const webRoot = `http://${FinalIp}:8081`;

export const needDebugOutpot = true;