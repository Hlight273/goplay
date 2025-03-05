import { Room } from "@/interface/room";
import { defineStore } from "pinia";
import { ref } from "vue";

//tabRom.vue中会更新此状态，其他页面或组件引用此状态
export const useRoomStore = defineStore("room", () => {

    // 存储当前房间信息
    const roomData = ref<Room.Room>({...rawRoomData})
    // 存储当前房间码
    const roomCode = ref(""); 

    const enterRoom = (_roomData: Room.Room) => {
        roomData.value = _roomData;
        roomCode.value = _roomData.roomCode;
    };

    const leaveRoom = () => {
        roomData.value = {...rawRoomData};
        roomCode.value = "";
    };

    return { roomData, roomCode, enterRoom, leaveRoom };
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
