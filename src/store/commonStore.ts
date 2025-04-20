import { updateNickname, userInfo, userPlaylistInfo, userVipInfo } from "@/api/user";
import { Playlist } from "@/interface/playlist";
import { User } from "@/interface/user";
import { ResultCode } from "@/util/webConst";
import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";

export const useCommonStore = defineStore("common", () => {

    const dissolveOn = ref<boolean>(false);

    const userPageOn = ref<boolean>(false);
    const curPlaylistOn = ref<boolean>(false);
    
    const myUserinfo = reactive<User.UserInfo>({...User.UserInfo_InitData});
    const myVipinfo = reactive<User.VipInfo>({...User.VipInfo_InitData});

    const myPlaylistInfos = reactive<Playlist.PlaylistInfo[]>([]);

    const updateMyUserInfo = ()=>{
        Object.assign(myUserinfo, {...User.UserInfo_InitData});
        userInfo(Number(localStorage.getItem("userid"))).then((res)=>{
            if(res.code == ResultCode.SUCCESS){
                Object.assign(myUserinfo, res.oData);
            }
        })
    }
    const updateMyVipInfo = ()=>{
        Object.assign(myVipinfo, {...User.VipInfo_InitData});//先需要清空，因为有可能切换账号，但是查到vip为空 就不会覆盖
        userVipInfo(Number(localStorage.getItem("userid"))).then((res)=>{
            if(res.code == ResultCode.SUCCESS){
                Object.assign(myVipinfo, res.oData);
            }
        })
    }

    const updateMyPlaylistInfo = () => {
        myPlaylistInfos.length = 0;
        const userId = Number(localStorage.getItem("userid"));
        userPlaylistInfo(userId).then(
            (res) => {   
                switch (res.code) {
                    case ResultCode.SUCCESS:
                        Object.assign(myPlaylistInfos, res.oData);
                        //console.log(myPlaylistInfos);
                        
                        break;
                    case ResultCode.EMPTY:          
                        break;
                    default:
                        break;
                }
            }
        );
    }

    const targetUserInfo = reactive<User.UserInfo>({...User.UserInfo_InitData})
    const targetUserVipInfo = reactive<User.VipInfo>({...User.VipInfo_InitData})
    const openUserPage = async (targetUserId:number)=>{
        
        Object.assign(targetUserInfo, {...User.UserInfo_InitData});
        Object.assign(targetUserVipInfo, {...User.VipInfo_InitData});
        
        try {
            const [userInfoRes, vipInfoRes] = await Promise.all([
                userInfo(targetUserId),
                userVipInfo(targetUserId)
            ]);
            
            if (userInfoRes.code === ResultCode.SUCCESS) {
                Object.assign(targetUserInfo, userInfoRes.oData);
            }
            if (vipInfoRes.code === ResultCode.SUCCESS) {
                Object.assign(targetUserVipInfo, vipInfoRes.oData);
            }
            userPageOn.value = true;
        } catch (error) {
            //console.error('加载用户信息失败:', error);
        }
    }
    const openUserPage_byUserInfo = async (_targetUserInfo:User.UserInfo)=>{
        
        Object.assign(targetUserInfo, _targetUserInfo);
        Object.assign(targetUserVipInfo, {...User.VipInfo_InitData});
        
        try {
            const vipInfoRes = await userVipInfo(_targetUserInfo.id);
            if (vipInfoRes.code === ResultCode.SUCCESS) {
                Object.assign(targetUserVipInfo, vipInfoRes.oData);
            }
            userPageOn.value = true;
        } catch (error) {
            //console.error('加载用户VIP信息失败:', error);
        }
    }
    const closeUserPage = ()=>{
        userPageOn.value = false;
    }
    
   
    
    return { dissolveOn, userPageOn, curPlaylistOn, 
        targetUserInfo, targetUserVipInfo, openUserPage, closeUserPage, openUserPage_byUserInfo,
        myUserinfo, myVipinfo, updateMyUserInfo, updateMyVipInfo, 
        myPlaylistInfos, updateMyPlaylistInfo
     };
});
