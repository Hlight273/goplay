import 'xgplayer';
import Player, { Events, Util } from 'xgplayer';
import "xgplayer-music/dist/index.min.css";
import 'xgplayer/dist/index.min.css';
import MusicPreset, * as Music from 'xgplayer-music';
import { PlayerData } from '@/interface/playerData';
import { App, reactive } from 'vue';
import { Song } from '@/interface/song';
import { getSongBlob } from '@/api/song';
import { eventBus,MEventTypes } from "@/util/eventBus";
import { HlsPlugin } from 'xgplayer-hls/es/plugin';


export class GoPlayer {
    private static instance: GoPlayer;
    player4room:Player | null = null;
    player4local:Player | null = null;

    private localSongBlob:Blob|null = null; 

    private static inRoomMode = false;

    private roomPlaylist: Song.SongContent[] = [];
    private roomSongLoadingStatus: Map<number, boolean> = new Map();
    private isPassiveChange: boolean = false;


    public personalPlaylist: Song.SongContent[] = reactive<Song.SongContent[]>([]);;
    private preloadedIndex: number = -1;
    
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

    registerPlayer4room(_id:string):void {
        if (this.player4room) return;
        
        this.player4room = new Player({
            id: _id,
            url: '',
            volume: 0.8,
            width: window.innerWidth,
            height: 50,
            mediaType: 'audio',
            presets: ['default', MusicPreset],
           // preloadNext: true,//预加载下一首
           // halfPass: true,
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
              },
            //   plugins: [HlsPlugin], // 添加 HLS 插件
            //     // HLS 配置
            //     hlsConfig: {
            //         maxBufferLength: 30, // 缓冲区长度
            //         maxMaxBufferLength: 60,
            //         enableWorker: true
            //     },
            //     hls: {
            //         retryCount: 3, // 重试 3 次，默认值
            //         retryDelay: 1000, // 每次重试间隔 1 秒，默认值
            //         loadTimeout: 10000, // 请求超时时间为 10 秒，默认值
            //         fetchOptions: {
            //             // 该参数会透传给 fetch，默认值为 undefined
            //             token: localStorage.getItem("token") || '',
            //             mode: 'cors'
            //         }
            //     }
        })
        this.player4room.on(Events.PLAY, this.sendNewSongEv)
        eventBus.on(MEventTypes.GOPLAYER_MODE_CHANGED, ()=>{this.player4local?.pause(); });
        console.log("🎵Goplayer4ROOM初始化完成🎵...");
        console.log("\n");
        
    }
    registerPlayer4local(_id:string):void {
        if (this.player4local) return;
        
        this.player4local = new Player({
            id: _id,
            url: '',
            volume: 0.8,
            width: window.innerWidth,
            height: 50,
            mediaType: 'audio',
            presets: ['default', MusicPreset],
            preloadNext: true,//预加载下一首
            halfPass: true,
            ignores: ['playbackrate', 'next'],
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
              },
        })
        this.setupPlayer4localListeners();
        this.player4local.on(Events.PLAY, this.sendlocalSongURLChangeEv)
        eventBus.on(MEventTypes.GOPLAYER_MODE_CHANGED, ()=>{this.player4room?.pause(); });
        console.log("🎵Goplayer4LOCAL初始化完成🎵...");
        console.log("\n");
        
    }
    destroy() {
        if (this.player4room) {
            this.player4room.off(Events.PLAY, this.sendNewSongEv)
            this.player4room.destroy();
            this.player4room = null;
        }
        if (this.player4local) {
            this.player4local.destroy();
            this.player4local = null;
        }
    }

    //房间内歌单增量加载
    async syncPlayList(_list:Array<Song.SongContent>):Promise<void>{
        if(!this.player4room) return;
    
        // 1. 保存当前播放索引
        const currentIndex = this.player4room.plugins.music.index;
        
        // 2. 清空当前播放列表和加载状态
        this.player4room.plugins.music.list.splice(0);
        this.roomSongLoadingStatus.clear();
        
        // 3. 创建新的加载状态映射
        const oldList = [...this.roomPlaylist];
        const promises = _list.map(async (song, i) => {
            const cacheKey = `${song.songInfo.id}_${song.songUrl}`;
            const cachedBlob = await BlobCacheManager.getInstance().getBlob(song.songUrl)
                .catch(() => null);
    
            if (cachedBlob) {
                return { 
                    res: URL.createObjectURL(cachedBlob), 
                    song, 
                    index: i 
                };
            }
    
            return getSongBlob(song.songUrl)
                .then(blobUrl => BlobCacheManager.getInstance().getBlob(song.songUrl))
                .then(blob => ({
                    res: URL.createObjectURL(blob),
                    song,
                    index: i
                }));
        });
    
        // 4. 处理结果并更新播放列表
        const results = await Promise.all(promises);
        results.sort((a, b) => a.index - b.index);
    
        for (const { res, song, index } of results) {
            if (res) {
                this.player4room.plugins.music.add({
                    src: res,
                    title: song.songInfo.songName,
                    vid: '00000' + index,
                    poster: song.coverBase64
                });
                this.roomSongLoadingStatus.set(index, true);
            }
        }
        
        // 5. 更新房间播放列表引用
        this.roomPlaylist = _list;
        
        // // 6. 恢复播放索引（如果有效）
        // if(currentIndex >= 0 && currentIndex < _list.length) {
        //     this.player4room.plugins.music.setIndex(currentIndex);
        // } else {
        //     this.player4room.plugins.music.setIndex(0);
        // }
    }
    loadPlaylist4local(_list:Array<Song.SongContent>){
        this.player4local?.plugins.music.list.splice(0); //清空
        this.personalPlaylist = _list;
        this.personalPlaylist.forEach((song, index) => {
            this.addLocalPlayerSong(song);
        });
    }

    addLocalPlayerSong(_song:Song.SongContent){
        this.player4local?.plugins.music.add({
            vid: `song_${this.player4local?.plugins.music.list.length}`,
            title: _song.songInfo.songName,
            poster: _song.coverBase64,
            // 使用占位符，实际播放时加载
            src: 'about:blank'
        }); 
    }

    addSong_to_LocalPlaylist(song:Song.SongContent){
        const curIndex = this.getLocalPlaylistIndex();
        this.player4local?.plugins.music.add({
            vid: `song_${curIndex+1}`,
            title: song.songInfo.songName,
            poster: song.coverBase64,
            // 使用占位符，实际播放时加载
            src: 'about:blank' 
        });
    }
    removeSong_from_LocalPlaylist(index:number){
        this.player4local?.plugins.music.splice(index,1);
    }

    syncPlayerData(_data:PlayerData):void{

        //console.log("sync_pdata:",_data);
        
        if (!this.player4room || this.player4room.plugins.music.list==null) 
            return

        let dataIsSetIndex = _data.curTime==0 && _data.index!=this.getRoomPlaylistIndex();

        //状态为播放 才允许调时间(time为0走setindex而不是调时间)
        if(!_data.paused){
            this.player4room.seek(_data.curTime);
        }

        //来的数据时间为0，index和上一首不同才视为调index (有一种特殊情况那就是尚未初始化过)
        if(dataIsSetIndex || !this.hasSynced){
            this.player4room.plugins.music.setIndex(_data.index);
        }

        //仅仅切换暂停播放
        if (_data.paused === this.player4room.paused) return;
        
        if(_data.paused){      
            this.player4room.autoplay = false;
            this.player4room.pause();
        }else{
            this.player4room.autoplay = true;
            this.player4room.play().then(() => {
                
           }).catch(() => {
               //console.log("catch"); //未经用户交互时的自动播放
           });
        }  

        this.hasSynced = true;
    }
    setPlayer4RoomIndex(_index:number):void{
        if (!this.player4room || this.player4room.plugins.music.list==null) 
            return
        this.player4room.plugins.music.setIndex(_index);
        this.player4room.autoplay = true;
        this.player4room.play();
    } 
    async setPlayer4localIndex(_index:number):Promise<void>{
        if (!this.player4local || this.player4local.plugins.music.list==null) 
            return
        await this.preload(_index);
        this.player4local.plugins.music.setIndex(_index);
        this.player4local.autoplay = true;
        this.player4local.play();
    } 

    // 由于本地预加载系统需要自己重构，在本地播放器事件监听中增加处理
    private setupPlayer4localListeners() {
        if(!this.player4local)
            return;
        // 预加载下一首
        this.player4local.on(Events.TIME_UPDATE, async ({ currentTime }) => {  
            const len = this.player4local?.plugins.music.list.length; 
            const cIndex:number = this.getLocalPlaylistIndex();
            const nextIndex:number = cIndex+1 > len-1 ? 0 : cIndex + 1;
            if(!this.player4local?.duration)
                return;
            if (this.preloadedIndex === nextIndex) // 检查是否已预加载该歌曲，避免重复请求
                return;
            if (currentTime > this.player4local?.duration - 30) { // 提前30秒加载
                if(!this.personalPlaylist[nextIndex])
                    return;
                const nextrealURL = this.personalPlaylist[nextIndex].songUrl;
                if (nextrealURL) {
                    const blob = await BlobCacheManager.getInstance().getBlob(nextrealURL);
                    if(this.player4local){
                        this.player4local.plugins.music.list[nextIndex].src = URL.createObjectURL(blob)
                        this.preloadedIndex = nextIndex; // 记录已预加载的索引
                    }
                }
            }
        });
    }
    private async preload(_index:number){
        const cIndex:number = _index;
        const realURL:string = this.personalPlaylist[cIndex].songUrl;
        try {
            const blob = await BlobCacheManager.getInstance().getBlob(realURL);
            //console.log('加载成功:', blob);
            
            if(this.player4local){
                console.log('当前歌曲blob更新:', blob);
                this.localSongBlob = blob;
                this.player4local.plugins.music.list[cIndex].src = URL.createObjectURL(blob)
            }
                
        } catch (e) {
            //console.error('加载失败:', realURL);
        }
    }

    public getCurLocalSongBlob():Blob|null{
        return this.localSongBlob;
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

    private sendNewSongEv = () =>  {
        let songContent = this.getCurRoomSongContent();
        eventBus.emit(MEventTypes.PLAY_NEW_SONG_ROOM, songContent)
    }
    private sendlocalSongURLChangeEv =() =>{
        let songContent = this.getCurLocalSongContent();
        eventBus.emit(MEventTypes.PLAY_NEW_SONG_LOCAL, songContent)
    }

    private getCurRoomSongContent(): Song.SongContent|null {
        if(!this.roomPlaylist)
            return null;
        let index = this.getRoomPlaylistIndex();
        let target = this.roomPlaylist[index];
        if(target==null||target==undefined)
            return null;
        return target;
    }

    public getCurLocalSongContent(): Song.SongContent|null {
        if(!this.personalPlaylist)
            return null;
        let index = this.getLocalPlaylistIndex();
        let target = this.personalPlaylist[index];
        if(target==null||target==undefined)
            return null;
        return target;
    }

    static enterRoomMode = () => {
        this.inRoomMode = true;
        eventBus.emit(MEventTypes.GOPLAYER_MODE_CHANGED, true);
    }
    static quitRoomMode = () => {
        this.inRoomMode = false;
        eventBus.emit(MEventTypes.GOPLAYER_MODE_CHANGED, false);
    }
    static isRoomMode = ():boolean => this.inRoomMode==true

    public getRoomPlaylistIndex(): number {
        return this.player4room?.plugins.music.index ?? -1;
    }

    public getLocalPlaylistIndex(): number {
        return this.player4local?.plugins.music.index ?? -1;
    }

    isSongLoaded(index: number): boolean {
        return this.roomSongLoadingStatus.get(index) ?? false;
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



class BlobCacheManager {
    private static instance: BlobCacheManager;
    private cache: Map<string, Blob> = new Map(); // 使用歌曲URL作为key
    private db: IDBDatabase | null = null;

    async initialize() {
        if (!window.indexedDB) return;
        
        const request = indexedDB.open('AudioBlobCache', 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('blobs')) {
                db.createObjectStore('blobs', { keyPath: 'key' });
            }
        };
        this.db = await new Promise(resolve => {
            request.onsuccess = (event) => {
                resolve((event.target as IDBOpenDBRequest).result);
            };
        });
    }

    static getInstance() {
        if (!BlobCacheManager.instance) {
            BlobCacheManager.instance = new BlobCacheManager();
        }
        return BlobCacheManager.instance;
    }

    async getBlob(key: string): Promise<Blob> {
        // 1. 检查内存缓存
        if (this.cache.has(key)) return this.cache.get(key)!;
        
        // 2. 检查IndexedDB
        if (this.db) {
            const blob = await new Promise<Blob|undefined>(resolve => {
                const tx = this.db!.transaction('blobs', 'readonly');
                const store = tx.objectStore('blobs');
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result?.blob);
            });
            if (blob) {
                this.cache.set(key, blob);
                return blob;
            }
        }
        
        // 3. 网络请求
        const blob = await this._fetchBlob(key);
        
        // 更新缓存
        this.cache.set(key, blob);
        if (this.db) {
            const tx = this.db.transaction('blobs', 'readwrite');
            tx.objectStore('blobs').put({ key, blob });
            await new Promise(resolve => tx.oncomplete = resolve);
        }
        
        return blob;
    }

    clearCache() {
        this.cache.clear();
    }

    deleteCache(url: string) {
        this.cache.delete(url);
    }

    private async _fetchBlob(key: string): Promise<Blob> {
        try {
            // 调用现有的getSongBlob API
            const blobUrl = await getSongBlob(key);
            
            // 将Blob URL转换为实际的Blob对象
            const response = await fetch(blobUrl as string);
            if (!response.ok) throw new Error('Failed to fetch blob');
            
            return await response.blob();
        } catch (e) {
            // 清理无效缓存
            this.cache.delete(key);
            throw new Error(`Failed to fetch blob: ${e}`);
        }
    }

    private async createBlobFromBlobUrl(blobUrl: string): Promise<Blob> {
        const response = await fetch(blobUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const blob = await response.blob(); // 将 Blob URL 转换为 Blob
        return blob;
    }
}