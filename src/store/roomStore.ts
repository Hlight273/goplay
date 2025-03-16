import { Room } from "@/interface/room";
import { eventBus, MEventTypes } from "@/util/eventBus";
import { defineStore } from "pinia";
import { ref } from "vue";

//tabRom.vue中会更新此状态，其他页面或组件引用此状态
export const useRoomStore = defineStore("room", () => {

    // 存储当前房间信息
    const roomData = ref<Room.Room>({...rawRoomData});
    // 存储当前房间码
    const roomCode = ref(""); 
    //播放器是否是roomMode
    const isRoomMode = ref(false);

    const enterRoom = (_roomData: Room.Room) => {
        roomData.value = _roomData;
        roomCode.value = _roomData.roomCode;
    };

    const leaveRoom = () => {
        roomData.value = {...rawRoomData};
        roomCode.value = "";
    };

    const myUserHasRoom = ():boolean => roomCode.value!="";


    const handleModeChanged = (val: boolean) => {
        isRoomMode.value = val;
    }
    eventBus.on(MEventTypes.GOPLAYER_MODE_CHANGED, handleModeChanged);
    
    return { roomData, roomCode, isRoomMode, enterRoom, leaveRoom, myUserHasRoom };
});

const rawRoomData = {
    id: 0,
    roomName: '',
    ownerId: 0,
    maxUsers: 0,
    currentUsers: 0,
    roomCode: '',
    createdAt: '',
    isActive: 0
    }
