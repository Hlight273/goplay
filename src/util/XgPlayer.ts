import 'xgplayer';
import Player, { Events, Util } from 'xgplayer';
import "xgplayer-music/dist/index.min.css";
import 'xgplayer/dist/index.min.css';
import MusicPreset, * as Music from 'xgplayer-music';
import { PlayerData } from '@/interface/playerData';
import { App } from 'vue';
import { Song } from '@/interface/song';
import { getSongBlob } from '@/api/song';
import { eventBus,MEventTypes } from "@/util/eventBus";
import { fa } from 'element-plus/es/locale';


export class GoPlayer {
    private static instance: GoPlayer;
    //private playerList: Array<Song.SongContent>|null = null;
    private curIndex: number = 0;
    player:Player | null = null;
    public static broadcast_lock:boolean = false;
    private hasSynced = false;

    constructor() { 
        GoPlayer.broadcast_lock=false;
    }  

    static getInstance(): GoPlayer {
        if (!GoPlayer.instance) {
            GoPlayer.instance = new GoPlayer();
        }
        return GoPlayer.instance;
    }

    list(){
        if (this.player==null)
            return null
        return this.player.plugins.music.list
    }

    registerPlayer(_id:string):void {
        if (this.player) return;
        
        this.player = new Player({
            id: _id,
            url: '',
            volume: 0.8,
            width: window.innerWidth,
            height: 50,
            mediaType: 'audio',
            presets: ['default', MusicPreset],
            preloadNext: true,//预加载下一首
            halfPass: true,
            ignores: ['playbackrate'],
            controls: {
                initShow: true,
                mode: 'flex'
            },
            marginControls: true,
            videoConfig: {
                crossOrigin: "anonymous"
            },
            music: {
                list: [{}]
            },
            icons: {
                play: () => {
                    const imgSrc = require('@/assets/icons/play1.png');
                    const dom = Util.createDom('div', `<img src="${imgSrc}"/>`, {}, 'mse_btn');
                    return dom;
                },
                pause: ()=>{
                    const imgSrc = require('@/assets/icons/pause1.png');
                    const dom = Util.createDom('div', `<img src="${imgSrc}"/>`, {}, 'mse_btn');
                    return dom;
                },
                playnext: ()=>{
                    const imgSrc = require('@/assets/icons/next2.png');
                    const dom = Util.createDom('div', `<img src="${imgSrc}"/>`, {}, 'mse_btn');
                    return dom;
                },
                prev: ()=>{
                    const imgSrc = require('@/assets/icons/step2.png');
                    const dom = Util.createDom('div', `<img src="${imgSrc}"/>`, {}, 'mse_btn');
                    return dom;
                },
                x: ()=>{
                    const imgSrc = require('@/assets/icons/pause1.png');
                    const dom = Util.createDom('div', `<img src="${imgSrc}"/>`, {}, 'mse_btn');
                    return dom;
                },
                d: ()=>{
                    const imgSrc = require('@/assets/icons/pause1.png');
                    const dom = Util.createDom('div', `<img src="${imgSrc}"/>`, {}, 'mse_btn');
                    return dom;
                },
              },
        })

        // this.player.on(Events.PLAYNEXT, () => {
        //     this.player?.play()
        //   })
        console.log("🎵Goplayer初始化完成🎵...");
        console.log("\n");
        
    }

    
    async syncPlayList(_playerList:Array<Song.SongContent>):Promise<void>{
        this.list().length = 0;
        // 创建所有 getSongBlob 的 Promise
        const promises = _playerList.map((song, i) =>
            getSongBlob(song.songUrl).then(res => ({ res, song, index: i }))
        );
        // 等待所有 Blob 加载完成
        const results = await Promise.all(promises);

         // 按索引排序，保证顺序
        results.sort((a, b) => a.index - b.index);

        // 按顺序添加到播放列表
        for (const { res, song, index } of results) {
            if (res) {
                this.player?.plugins.music.add({
                    src: res,
                    title: song.songInfo.songName,
                    vid: '00000' + index,
                    poster: song.coverBase64
                });
                console.log(`>>>> 歌曲 ${index} 已同步: ${song.songInfo.songName} >>>>`);
            }
        }
        // console.log(results);
        // console.log(this.list());
        
    }


    forceReset():void{
        if(this.player)
            this.player.plugins.music.list = null
        this.player?.reset();
    }

    syncPlayerData(_data:PlayerData):void{

        console.log("sync_pdata:",_data);
        
        if (!this.player || this.player.plugins.music.list==null) 
            return

        let dataIsSetIndex = _data.curTime==0 || _data.index!=this.player.plugins.music.index;

        //状态为播放 才允许调时间(time为0走setindex而不是调时间)
        if(!_data.paused && !dataIsSetIndex){
            this.player.seek(_data.curTime);
        }

        //来的数据时间为0，index和上一首不同才视为调index
        if(dataIsSetIndex){
            this.player.plugins.music.setIndex(_data.index);
        }

        //仅仅切换暂停播放
        if (_data.paused === this.player.paused) return;
        
        if(_data.paused){      
            this.player.autoplay = false;
            this.player.pause();
        }else{
            this.player.autoplay = true;
            this.player.play().then(() => {
                
           }).catch(() => {
               //console.log("catch"); //未经用户交互时的自动播放
           });
        }  

        this.hasSynced = true;
    }

    checkCache():Promise<any>{
        return this.player?.plugins.music.checkOffline()
    }

    isPaused():boolean{
        if (!this.player) 
            return true
        return this.player.paused;
    }

    destroy() {
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
    }

    b_lock():void{
        GoPlayer.broadcast_lock = true;
    }
    b_unlock():void{
        GoPlayer.broadcast_lock = false;
    }
    is_b_locked():boolean{
        return GoPlayer.broadcast_lock;
    }
    
}

const GoPlayerPlugin = {
    install(app: App) {
        const goPlayer = GoPlayer.getInstance();
        app.provide('GoPlayer', goPlayer);
        app.config.globalProperties.$GoPlayer = goPlayer;
    },
};

export default GoPlayerPlugin;