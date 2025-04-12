<template>
    <div class="analysis-content">
        <div class="analysis-header">
            <h3>高级音乐特征分析</h3>
            <el-button 
                class="black_oil_btn"
                :loading="analyzing" 
                type="primary" 
                @click="startAnalysis"
                :icon="MagicStick"
            >
                深度分析
            </el-button>
        </div>

        <div class="scroll-container">
            <!-- 可视化区域 -->
            <div v-if="analyzing" class="visualization">
                <canvas ref="visualizer" width="300" height="80"></canvas>
                <div class="progress-text">分析中... {{ Math.round(progress) }}%</div>
            </div>

            <div v-if="analysisResult.keywords.length > 0" class="analysis-result">
                <!-- 能量指示器 -->
                <div class="energy-meter">
                    <div class="energy-bar" :style="energyStyle"></div>
                    <span>动态能量 {{ energyLevel }}</span>
                </div>

                <!-- 关键词区域 -->
                <div class="keywords-section">
                    <h4>AI 创作关键词</h4>
                    <div class="keywords-list">
                        <el-tag
                            v-for="(keyword, index) in analysisResult.keywords"
                            :key="index"
                            :type="tagTypes[index % 5]"
                            class="keyword-tag"
                            effect="dark"
                        >
                            {{ keyword }}
                        </el-tag>
                    </div>
                    <!-- 一句话提示 -->
                    <!-- <div v-if="analysisResult.keywords[analysisResult.keywords.length - 1]?.startsWith('🎯')" class="prompt-line">
                        <p style="margin-top: 1vh; color: #ccc;">
                            AI提示语：{{ analysisResult.keywords[analysisResult.keywords.length - 1].slice(2) }}
                        </p>
                    </div> -->
                </div>

                <!-- 详细分析结果 -->
                <div class="details-section">
                    <el-descriptions :column="1" border class="dark-descriptions">
                        <el-descriptions-item label="曲风">
                            <el-tag effect="dark" type="danger">{{ analysisResult.genre }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="速度">
                            <div class="tempo-info">
                                <el-tag effect="dark" :type="analysisResult.tempo > 120 ? 'danger' : 'warning'">
                                    {{ analysisResult.tempo }} BPM
                                </el-tag>
                                <el-progress 
                                    :percentage="Math.min(100, analysisResult.tempo/2)" 
                                    :color="tempoColor"
                                    :show-text="false"
                                    class="dark-progress"
                                />
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item label="情感">
                            <el-tag effect="dark" :type="moodTagType">{{ analysisResult.mood }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="频谱特征">
                            <el-rate 
                                v-model="spectralRating"
                                :colors="['#626262', '#b74343', '#ff4757']"
                                disabled
                                show-text
                                text-color="#b74343"
                                :texts="['温暖', '均衡', '明亮']"
                            />
                        </el-descriptions-item>

                        <el-descriptions-item label="高频占比">
                            <el-progress
                                :percentage="Math.round((analysisResult.features.highFreqRatio || 0) * 100)"
                                :color="'#66ccff'"
                                :show-text="true"
                                class="dark-progress"
                            />
                         </el-descriptions-item>

                        <el-descriptions-item label="最终 Prompt">
                            <div style="word-break: break-all; white-space: pre-wrap; color: #aaa;">
                                {{ analysisResult.prompt }}
                            </div>
                        </el-descriptions-item>

                        
                    </el-descriptions>
                </div>
            </div>

            <div v-else-if="!analyzing" class="empty-state">
                <el-empty description="点击分析按钮获取音乐DNA特征">
                    <template #image>
                        <DataAnalysis class="empty-icon" />
                    </template>
                </el-empty>
            </div>
        </div>

      
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { analyzeSong, AnalysisResult } from '@/util/songAnalysis'
import { Song } from '@/interface/song'
import { DataAnalysis, MagicStick, VideoPlay } from '@element-plus/icons-vue'
import { GoPlayer } from '@/util/XgPlayer';

const props = defineProps<{
    curSong: Song.SongContent
}>()

// 分析状态
const analyzing = ref(false)
const progress = ref(0)
const visualizer = ref<HTMLCanvasElement | null>(null)
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null

// 分析结果
const analysisResult = reactive<AnalysisResult>({
    keywords: [] as string[],
    tempo: 0,
    mood: '',
    genre: '',
    prompt: '',
    features: {
        rms: 0,
        centroid: 0,
        fluctuation: 0,
        highFreqRatio: 0
    }
})

// UI配置
const tagTypes = ['', 'success', 'warning', 'danger', 'info']

// 计算属性
const energyLevel = computed(() => {
    const level = analysisResult.features.rms * 100 || 0
    return `${Math.min(100, Math.round(level))}%`
})

const energyStyle = computed(() => ({
    width: energyLevel.value,
    background: `linear-gradient(90deg, #b74343 ${energyLevel.value}, #ff9900 100%)`
}))

const spectralRating = computed(() => {
    return Math.min(5, Math.max(1, Math.round(analysisResult.features.centroid * 5)))
})

const tempoColor = computed(() => {
    return analysisResult.tempo > 120 ? '#f56c6c' : 
           analysisResult.tempo > 90 ? '#e6a23c' : '#67c23a'
})

const moodTagType = computed(() => {
    return analysisResult.mood.includes('忧郁') ? 'info' :
           analysisResult.mood.includes('欢快') ? 'success' : 'warning'
})

const chunkProgress = ref(0);
const totalChunks = ref(0);
// 分析方法
const startAnalysis = async () => {
    if (!props.curSong.songUrl) {
        ElMessage.warning('请先选择有效音频')
        return
    }
    
    try {
        // 初始化分析状态
        analyzing.value = true
        progress.value = 0
        chunkProgress.value = 0  // 新增：当前处理的分块数
        totalChunks.value = 0    // 新增：总分块数
        initVisualizer()
        
     
        // 预处理音频
        const rawBlob = GoPlayer.getInstance().getCurLocalSongBlob()
        if(rawBlob == null||rawBlob.size == 0) {
            ElMessage.warning('当前没有选择有效音频')
            return
        }
        const normalizedBlob = await normalizeAudioLevel(rawBlob)
        progress.value = 40
        
        // 计算总分块数 (44.1kHz, 16位立体声 ≈ 176KB/秒)
        totalChunks.value = Math.ceil(normalizedBlob.size / (30 * 44100 * 4))
        
        // 分块处理回调
        const onChunkProcessed = () => {
            chunkProgress.value++
            progress.value = Math.min(80, 40 + (chunkProgress.value / totalChunks.value) * 40)
        }
        
        // 执行分析（传入回调）
        const result = await analyzeSong(normalizedBlob).then(result => {
            onChunkProcessed();
            return result;
        });
        progress.value = 90
        
        // 更新结果
        analysisResult.keywords = result.keywords || []
        analysisResult.tempo = Math.round(result.tempo || 0)
        analysisResult.mood = result.mood || '未知'
        analysisResult.genre = result.genre || '未知'
        analysisResult.prompt = result.prompt || '（暂无）'  // ✅ 添加 prompt
        analysisResult.features = {
            rms: result.features?.rms ?? 0.5,
            centroid: result.features?.centroid ?? 0.5,
            fluctuation: result.features?.fluctuation ?? 0.5,
            highFreqRatio: result.features?.highFreqRatio ?? 0.5  // ✅ 添加高频占比
        }

        
        ElMessage.success({
            message: `分析完成：${result.genre}风格 (${totalChunks.value}个音频片段)`,
            duration: 2000
        })
    } catch (error) {
        console.error('完整分析流程:', error)
        ElMessage.error(`分析失败: ${(error as Error).message || '未知错误'}`)
    } finally {
        analyzing.value = false
        progress.value = 100
        cleanupAudio()
    }
}

// 音频预处理
async function normalizeAudioLevel(blob: Blob): Promise<Blob> {
    try {
        audioContext = new AudioContext()
        const arrayBuffer = await blob.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        
        // 计算峰值标准化
        const channelData = audioBuffer.getChannelData(0)
        const max = Math.max(...channelData.map(Math.abs))
        const scale = 0.9 / max
        
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        )
        
        const source = offlineContext.createBufferSource()
        source.buffer = audioBuffer
        
        const gainNode = offlineContext.createGain()
        gainNode.gain.value = scale
        
        source.connect(gainNode)
        gainNode.connect(offlineContext.destination)
        source.start()
        
        const normalizedBuffer = await offlineContext.startRendering()
        return new Blob([normalizedBuffer.getChannelData(0)], { type: blob.type })
    } catch (e) {
        console.warn('标准化失败，使用原始音频:', e)
        return blob
    }
}

// 可视化初始化
function initVisualizer() {
    if (!visualizer.value) return
    
    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    
    const ctx = visualizer.value.getContext('2d')
    if (!ctx) return
    
    const draw = () => {
        if (!analyzing.value || !analyser) return
        
        requestAnimationFrame(draw)
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(dataArray)
        
        ctx.fillStyle = '#2a2a2a'
        ctx.fillRect(0, 0, visualizer.value!.width, visualizer.value!.height)
        
        const barWidth = visualizer.value!.width / dataArray.length
        dataArray.forEach((value, i) => {
            const height = value / 255 * visualizer.value!.height
            const hue = i * 360 / dataArray.length
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
            ctx.fillRect(i * barWidth, visualizer.value!.height - height, barWidth - 1, height)
        })
    }
    
    draw()
}

// 清理音频资源
function cleanupAudio() {
    if (analyser) {
        analyser.disconnect()
        analyser = null
    }
    if (audioContext) {
        audioContext.close()
        audioContext = null
    }
}

// 复制关键词
const copyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword)
    ElMessage.success(`已复制: ${keyword}`)
}
</script>

<style scoped>
.analysis-content {
    padding: 2vh;
    color: #fff;
    height: 71vh;
    max-height: 71vh;
    box-sizing: border-box;
    background: #2a2a2a;
    border-radius: 0.8vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.scroll-container {
    flex: 1;
    overflow-y: auto;
    padding-right: 5px;
    scrollbar-width: thin;
    scrollbar-color: #b74343 transparent;
}

.analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3vh;
    padding-bottom: 2vh;
    border-bottom: 1px solid #3a3a3a;
}

.analysis-header h3 {
    margin: 0;
    font-size: 2.2vh;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 1vh;
}

.visualization {
    margin-bottom: 2vh;
    background: #1a1a1a;
    border-radius: 0.8vh;
    padding: 1.5vh;
    position: relative;
}

.progress-text {
    position: absolute;
    right: 2vh;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.4vh;
    color: #999;
}

canvas {
    width: 100%;
    height: 80px;
    display: block;
}

.energy-meter {
    margin-bottom: 2vh;
    background: #313131;
    border-radius: 0.8vh;
    padding: 1.5vh;
    font-size: 1.4vh;
    display: flex;
    flex-direction: column;
    gap: 0.8vh;
}

.energy-bar {
    height: 6px;
    border-radius: 3px;
    transition: width 0.5s ease;
    background: #b74343;
}

.keywords-section {
    margin-bottom: 3vh;
    padding: 2vh;
    background: #313131;
    border-radius: 0.8vh;
    box-shadow: 0 0.2vh 0.6vh rgba(0, 0, 0, 0.2);
}

.keywords-section h4 {
    margin: 0 0 1.5vh 0;
    font-size: 1.6vh;
    color: #999;
    display: flex;
    align-items: center;
    gap: 1vh;
}

.keywords-list {
    display: flex;
    flex-wrap: wrap;
    gap: 1vh;
}

.keyword-tag {
    cursor: default;
    transition: all 0.3s;
    font-size: 1.4vh;
    border: none;
    background-color: #2c2c2c;
}

.keyword-tag:hover {
    transform: none;
    box-shadow: none;
}

/* 移除复制提示 */
.keyword-tag:hover::after {
    content: none;
}

/* 暗色主题表格样式 */
.dark-descriptions {
    --el-descriptions-item-bordered-label-background: #1a1a1a;
    --el-descriptions-item-bordered-content-background: #2c2c2c;
    --el-descriptions-table-border: #2c2c2c;
    border: 1px solid #3a3a3a;
    border-radius: 0.8vh;
    overflow: hidden;
}

:deep(.el-descriptions__cell) {
    padding: 2vh !important;
}

:deep(.el-descriptions__label) {
    color: #b2b2b2 !important;
    font-size: 1.4vh;
    font-weight: normal;
}

:deep(.el-descriptions__content) {
    color: #ffffff;
}

.tempo-info {
    display: flex;
    flex-direction: column;
    gap: 1vh;
}

:deep(.dark-progress .el-progress-bar__outer) {
    background-color: #1a1a1a;
}

:deep(.el-rate__icon) {
    font-size: 1.8vh;
    margin-right: 0.6vh;
}

:deep(.el-rate__text) {
    color: #999;
}

/* 标签样式统一 */
:deep(.el-tag) {
    background-color: #2c2c2c;
    border: none;
    padding: 0.4vh 1.2vh;
}

:deep(.el-tag--danger) {
    background-color: #2c1618;
    color: #ff4757;
}

:deep(.el-tag--warning) {
    background-color: #2c2318;
    color: #ffb142;
}

:deep(.el-tag--success) {
    background-color: #182c1e;
    color: #26de81;
}

:deep(.el-tag--info) {
    background-color: #1f2937;
    color: #7f8c8d;
}
:deep(tr) {
    background-color: #3a3a3a;
}
</style>