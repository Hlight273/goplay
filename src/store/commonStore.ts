import { updateNickname, userInfo, userVipInfo } from "@/api/user";
import { User } from "@/interface/user";
import { ResultCode } from "@/util/webConst";
import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";

export const useCommonStore = defineStore("common", () => {

    const dissolveOn = ref<boolean>(false);
    const userPageOn = ref<boolean>(false);
    
    const myUserinfo = ref<User.UserInfo>({
        id: 0,
        username: '',
        avatarUrl: '',
        level: 0,
        nickname: '',
        hPoints: 0,
      });
    const myVipinfo = ref<User.VipInfo>({
        userId: 0,
        level: 0,
        startTime: new Date().toString(),
        endTime: new Date().toString(), 
        days: 0,
    });
    const updateMyUserInfo = ()=>{
        userPageOn.value = true;
        userInfo(Number(localStorage.getItem("userid"))).then((res)=>{
            if(res.code == ResultCode.SUCCESS){
                Object.assign(myUserinfo, res.oData);
            }
        })
    }
    const updateMyVipInfo = ()=>{
        userPageOn.value = true;
        userVipInfo(Number(localStorage.getItem("userid"))).then((res)=>{
            if(res.code == ResultCode.SUCCESS){
                Object.assign(myVipinfo, res.oData);
            }
        })
    }

    const targetUserInfo = reactive<User.UserInfo>({
        id: 0,
        username: "",
        avatarUrl: "",
        level: 0,
        nickname: ""
    })
    const targetUserVipInfo = reactive<User.VipInfo>({
        userId: 0,
        level: 0,
        startTime: "",
        endTime: "",
        days: 0
    })
    const openUserPage = (targetUserId:number)=>{
        userPageOn.value = true;
        userInfo(targetUserId).then((res)=>{
            if(res.code == ResultCode.SUCCESS){
                Object.assign(targetUserInfo, res.oData);
            }
        })
    }
    const openUserPage_byUserInfo = (_targetUserInfo:User.UserInfo)=>{
        userPageOn.value = true;
        Object.assign(targetUserInfo, _targetUserInfo);
    }
    const closeUserPage = ()=>{
        userPageOn.value = false;
    }
    
   

    return { dissolveOn, userPageOn, targetUserInfo, targetUserVipInfo, openUserPage, closeUserPage, openUserPage_byUserInfo,
        myUserinfo, myVipinfo, updateMyUserInfo, updateMyVipInfo
     };
});
