import { Song } from "@/interface/song";
import { analyze as analyzeBPM } from 'web-audio-beat-detector';

export interface AnalysisResult {
    keywords: string[];
    tempo: number;
    mood: string;
    genre: string;
    prompt: string;
    features: {
        rms: number;
        centroid: number;
        fluctuation: number;
        highFreqRatio: number;
    };
}

// 音乐特征映射配置
const MOOD_THRESHOLDS = {
    ENERGETIC: { tempo: 128, rms: 0.15, centroid: 0.4 },
    HAPPY: { tempo: 100, centroid: 0.35 },
    MELANCHOLY: { tempo: 80, rms: 0.08, centroid: 0.25 }
};

const GENRE_FEATURES = {
    ELECTRONIC: { minTempo: 120, centroid: 0.35, fluctuation: 0.2 },
    ROCK: { tempoRange: [90, 140], attack: 0.3 },
    JAZZ: { maxTempo: 120, centroid: 0.3, fluctuation: 0.4 }
};

export async function analyzeSong(audioBlob: Blob): Promise<AnalysisResult> {
    try {
        const audioContext = new AudioContext();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const chunkResults = await processLongAudio(arrayBuffer, audioContext);

        const tempo = Math.round(average(chunkResults.map(r => r.tempo)));
        const mood = analyzeMoodFromChunks(chunkResults);
        const genre = analyzeGenreFromChunks(chunkResults);
        const features = {
            rms: average(chunkResults.map(r => r.features.rms)),
            centroid: average(chunkResults.map(r => r.features.centroid)),
            fluctuation: average(chunkResults.map(r => r.features.fluctuation)),
            highFreqRatio: average(chunkResults.map(r => r.features.highFreqRatio))
        };

        return {
            tempo,
            mood,
            genre,
            keywords: generateKeywords(tempo, features),
            features,
            prompt: generatePrompt({ 
                tempo, 
                mood, 
                genre, 
                features,
                keywords: generateKeywords(tempo, features),
                prompt: ''
            })
        };
    } catch (error) {
        console.error('分析失败:', error);
        return defaultAnalysisResult();
    }
}

// 核心分块处理器
async function processLongAudio(arrayBuffer: ArrayBuffer, context: AudioContext) {
    const MAX_CHUNK_SIZE = 30 * context.sampleRate;
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    const totalSamples = audioBuffer.length;
    const chunkCount = Math.ceil(totalSamples / MAX_CHUNK_SIZE);
    const results: AnalysisResult[] = [];

    for (let i = 0; i < chunkCount; i++) {
        const start = i * MAX_CHUNK_SIZE;
        const end = Math.min(start + MAX_CHUNK_SIZE, totalSamples);

        const chunkBuffer = context.createBuffer(
            audioBuffer.numberOfChannels,
            end - start,
            audioBuffer.sampleRate
        );

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            chunkBuffer.getChannelData(channel)
                .set(audioBuffer.getChannelData(channel).subarray(start, end));
        }

        results.push(await analyzeAudioChunk(chunkBuffer));
    }

    return results;
}

async function analyzeAudioChunk(buffer: AudioBuffer): Promise<AnalysisResult> {
    const [tempo, features] = await Promise.all([
        analyzeTempo(buffer),
        analyzeAudioFeatures(buffer)
    ]);

    return {
        tempo,
        mood: analyzeMood(tempo, features),
        genre: analyzeGenre(tempo, features),
        keywords: generateKeywords(tempo, features),
        features,
        prompt: ''
    };
}

// 辅助函数
function analyzeMoodFromChunks(results: AnalysisResult[]): string {
    const moods = results.map(r => r.mood);
    return mode(moods) || '中性';
}

function analyzeGenreFromChunks(results: AnalysisResult[]): string {
    const genres = results.map(r => r.genre);
    return mode(genres) || '流行';
}

function generateKeywordsFromChunks(results: AnalysisResult[]): string[] {
    const keywordMap = new Map<string, number>();
    
    results.forEach(result => {
        result.keywords.forEach(keyword => {
            keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
        });
    });
    
    return Array.from(keywordMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([keyword]) => keyword);
}

function mode(array: string[]): string {
    const frequency: Record<string, number> = {};
    let max = 0, result = '';
    
    array.forEach(value => {
        frequency[value] = (frequency[value] || 0) + 1;
        if (frequency[value] > max) {
            max = frequency[value];
            result = value;
        }
    });
    
    return result;
}



async function analyzeAudioFeatures(audioBuffer: AudioBuffer) {
    const [rms, centroid, fluctuation, highFreqRatio] = await Promise.all([
        calculateRMS(audioBuffer),
        calculateSpectralCentroid(audioBuffer),
        calculateDynamicFluctuation(audioBuffer),
        calculateHighFrequencyRatio(audioBuffer)
    ]);

    return {
        rms: normalize(rms, 0, 0.5),
        centroid: normalize(centroid, 0, 1),
        fluctuation: normalize(fluctuation, 0, 1),
        highFreqRatio: normalize(highFreqRatio, 0, 1)
    };
}

function generatePrompt({ tempo, mood, genre, features }: AnalysisResult): string {
    const descriptors = [];

    if (features.highFreqRatio > 0.6) descriptors.push('bright tone');
    else if (features.highFreqRatio < 0.3) descriptors.push('warm and soft tone');
    else descriptors.push('balanced tone');

    if (features.rms > 0.15) descriptors.push('powerful dynamics');

    descriptors.push(mood.toLowerCase());
    descriptors.push(genre.toLowerCase());
    descriptors.push(`${tempo}bpm`);

    return `A ${descriptors.join(', ')} style music`;
}

async function analyzeTempo(audioBuffer: AudioBuffer): Promise<number> {
    const offlineContext = new OfflineAudioContext(
        1,
        audioBuffer.length,
        audioBuffer.sampleRate
    );
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    const renderedBuffer = await offlineContext.startRendering();
    return analyzeBPM(renderedBuffer);
}

function analyzeMood(tempo: number, features: { rms: number; centroid: number }): string {
    const { rms, centroid } = features;
    
    if (tempo > MOOD_THRESHOLDS.ENERGETIC.tempo && 
        rms > MOOD_THRESHOLDS.ENERGETIC.rms &&
        centroid > MOOD_THRESHOLDS.ENERGETIC.centroid) {
        return '活力';
    }
    
    if (tempo > MOOD_THRESHOLDS.HAPPY.tempo &&
        centroid > MOOD_THRESHOLDS.HAPPY.centroid) {
        return '欢快';
    }
    
    if (tempo < MOOD_THRESHOLDS.MELANCHOLY.tempo &&
        rms < MOOD_THRESHOLDS.MELANCHOLY.rms) {
        return '忧郁';
    }
    
    return '中性';
}

function analyzeGenre(tempo: number, features: { centroid: number; fluctuation: number }): string {
    const { centroid, fluctuation } = features;
    
    if (tempo > GENRE_FEATURES.ELECTRONIC.minTempo &&
        centroid > GENRE_FEATURES.ELECTRONIC.centroid &&
        fluctuation < GENRE_FEATURES.ELECTRONIC.fluctuation) {
        return '电子';
    }
    
    if (tempo > GENRE_FEATURES.ROCK.tempoRange[0] &&
        tempo < GENRE_FEATURES.ROCK.tempoRange[1] &&
        fluctuation > GENRE_FEATURES.ROCK.attack) {
        return '摇滚';
    }
    
    if (tempo < GENRE_FEATURES.JAZZ.maxTempo &&
        fluctuation > GENRE_FEATURES.JAZZ.fluctuation) {
        return '爵士';
    }
    
    return '流行';
}

// 核心音频分析工具函数
async function calculateRMS(audioBuffer: AudioBuffer): Promise<number> {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = 4096;
    let totalSquares = 0;
    
    for (let i = 0; i < channelData.length; i += blockSize) {
        const block = channelData.slice(i, i + blockSize);
        const sum = block.reduce((acc, val) => acc + val ** 2, 0);
        totalSquares += sum / blockSize;
    }
    
    return Math.sqrt(totalSquares / (channelData.length / blockSize));
}

async function calculateSpectralCentroid(audioBuffer: AudioBuffer): Promise<number> {
    const audioContext = new AudioContext();
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    
    const dataArray = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(dataArray);
    
    let totalAmplitude = 0;
    let weightedSum = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
        const amplitude = 10 ** (dataArray[i] / 20); // 转换为线性幅度
        weightedSum += i * amplitude;
        totalAmplitude += amplitude;
    }
    
    return totalAmplitude > 0 ? weightedSum / totalAmplitude : 0;
}

async function calculateDynamicFluctuation(audioBuffer: AudioBuffer): Promise<number> {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = 44100; // 分析1秒区块
    const blocks = [];
    
    for (let i = 0; i < channelData.length; i += blockSize) {
        const block = channelData.slice(i, i + blockSize);
        const rms = Math.sqrt(block.reduce((sum, x) => sum + x*x, 0) / block.length);
        blocks.push(rms);
    }
    
    // 计算RMS值的标准差
    const mean = blocks.reduce((sum, x) => sum + x, 0) / blocks.length;
    const variance = blocks.reduce((sum, x) => sum + (x - mean)**2, 0) / blocks.length;
    return Math.sqrt(variance);
}


async function calculateHighFrequencyRatio(audioBuffer: AudioBuffer): Promise<number> {
    const context = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
    const source = context.createBufferSource();
    source.buffer = audioBuffer;

    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(context.destination);

    source.start();
    await context.startRendering();

    const spectrum = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(spectrum);

    const mid = Math.floor(spectrum.length / 2);
    const low = spectrum.slice(0, mid);
    const high = spectrum.slice(mid);

    const sumLow = low.reduce((sum, db) => sum + 10 ** (db / 20), 0);
    const sumHigh = high.reduce((sum, db) => sum + 10 ** (db / 20), 0);

    return sumHigh / (sumLow + sumHigh);
}

function generateKeywords(tempo: number, features: { rms: number; centroid: number; fluctuation: number; highFreqRatio: number }): string[] {
    const keywords = [];
    keywords.push(tempo > 120 ? '快节奏' : tempo < 90 ? '慢节奏' : '中速');
    keywords.push(`${Math.round(tempo)}BPM`);
    if (features.rms > 0.15) keywords.push('强动态');
    if (features.fluctuation > 0.6) keywords.push('多变');
    if (features.centroid > 0.6) keywords.push('明亮');
    if (features.centroid < 0.4) keywords.push('温暖');
     // 生成AI提示语
     let aiTip = '🎯建议: ';
     if (tempo > 120 && features.rms > 0.15) {
         aiTip += '这是一首充满活力的曲目，适合创作热情洋溢的画面';
     } else if (tempo < 90 && features.centroid < 0.4) {
         aiTip += '这是一首温暖舒缓的曲目，适合创作柔和静谧的场景';
     } else if (features.fluctuation > 0.6) {
         aiTip += '这是一首富有变化的曲目，适合创作丰富多样的画面层次';
     } else {
         aiTip += '这是一首平衡的曲目，适合创作自然流畅的画面';
     }
     
     keywords.push(aiTip);
    return [...new Set(keywords)];
}

function average(array: number[]): number {
    return array.reduce((sum, val) => sum + val, 0) / array.length;
}

function normalize(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
}

function defaultAnalysisResult(): AnalysisResult {
    return {
        keywords: ['流行', 'pop', 'modern'],
        tempo: 120,
        mood: '平静',
        genre: '流行',
        prompt: 'A calm, modern, balanced tone music',
        features: {
            rms: 0.5,
            centroid: 0.5,
            fluctuation: 0.5,
            highFreqRatio: 0.5
        }
    };
}
