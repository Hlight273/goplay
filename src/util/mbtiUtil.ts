// MBTI类型定义
export interface MBTIResult {
    type: string;
    name: string;
    description: string;
    genres: string[];
}

// MBTI问题接口
interface MBTIQuestion {
    id: number;
    question: string;
    options: {
        text: string;
        dimension: string;
        value: number;
    }[];
}

// MBTI结果映射
const MBTI_TYPES: Record<string, MBTIResult> = {
    'ENFP': {
        type: 'ENFP',
        name: '音乐探索者',
        description: '你是一个充满好奇心的音乐爱好者，善于发现新的音乐类型。你的播放列表充满创意和冒险精神，喜欢尝试不同风格的音乐。你经常通过音乐来表达自己的情感和想法。',
        genres: ['独立民谣', '另类摇滚', '世界音乐', '实验电子']
    },
    'INTJ': {
        type: 'INTJ',
        name: '音乐分析家',
        description: '你对音乐有着深刻的理解和洞察力，喜欢分析音乐的结构和主题。你偏好复杂的音乐作品，享受发现音乐中的细节和层次。',
        genres: ['古典交响乐', '前卫爵士', '后摇', '氛围音乐']
    },
    'ESFP': {
        type: 'ESFP',
        name: '音乐派对者',
        description: '你是天生的表演者，热爱节奏感强的音乐。音乐对你来说是社交和表达的重要方式，你总能找到最适合当下氛围的音乐。',
        genres: ['流行舞曲', 'Hip-Hop', 'R&B', '拉丁']
    },
    'ISTJ': {
        type: 'ISTJ',
        name: '音乐守护者',
        description: '你欣赏传统和经典的音乐作品，重视音乐的质量和完整性。你的音乐品味稳定且深入，喜欢反复聆听熟悉的作品。',
        genres: ['古典室内乐', '传统爵士', '民谣', '布鲁斯']
    },
    'ENFJ': {
        type: 'ENFJ',
        name: '音乐引导者',
        description: '你善于通过音乐连接人与人之间的情感，经常为他人推荐音乐。你的音乐品味温暖人心，富有感染力。',
        genres: ['民谣摇滚', '灵魂乐', '世界音乐', '新世纪']
    },
    'ISTP': {
        type: 'ISTP',
        name: '音乐工匠',
        description: '你对音乐制作的技术层面特别感兴趣，喜欢研究音乐的制作过程。你欣赏精良制作的音乐作品。',
        genres: ['电子', 'IDM', '实验', '氛围科技']
    },
    'INFP': {
        type: 'INFP',
        name: '音乐梦想家',
        description: '你通过音乐表达内心世界，喜欢富有诗意和想象力的作品。你的音乐品味独特且富有个人色彩。',
        genres: ['独立流行', '梦幻流行', '后摇滚', '氛围民谣']
    },
    'ENTP': {
        type: 'ENTP',
        name: '音乐创新者',
        description: '你喜欢挑战传统音乐界限，欣赏创新和前卫的作品。你的音乐品味大胆且富有实验性。',
        genres: ['实验摇滚', '前卫电子', '噪音音乐', '跨界融合']
    },
    'ISFJ': {
        type: 'ISFJ',
        name: '音乐守护者',
        description: '你重视音乐的情感价值，喜欢温暖和治愈的作品。你的音乐品味细腻且富有同理心。',
        genres: ['轻音乐', '钢琴独奏', '治愈系', '民谣']
    },
    'ENTJ': {
        type: 'ENTJ',
        name: '音乐领袖',
        description: '你欣赏有力量和影响力的音乐，喜欢能够激励人心的作品。你的音乐品味大气且富有领导力。',
        genres: ['交响乐', '史诗音乐', '力量金属', '进行曲']
    }
};

// MBTI测试题目
const MBTI_QUESTIONS: MBTIQuestion[] = [
    {
        id: 1,
        question: "当你第一次听一首新歌时，你最先注意到：",
        options: [
            { text: "整体的情感氛围和感受", dimension: "N", value: 2 },
            { text: "具体的节奏和旋律细节", dimension: "S", value: 2 }
        ]
    },
    {
        id: 2,
        question: "在音乐节或演唱会上，你更倾向于：",
        options: [
            { text: "融入人群，跟着节奏互动", dimension: "E", value: 2 },
            { text: "专注地聆听，沉浸在音乐中", dimension: "I", value: 2 }
        ]
    },
    {
        id: 3,
        question: "选择播放列表时，你通常会：",
        options: [
            { text: "根据当下心情即兴选择", dimension: "P", value: 2 },
            { text: "按照预先规划好的顺序", dimension: "J", value: 2 }
        ]
    },
    {
        id: 4,
        question: "评价一首歌时，你更看重：",
        options: [
            { text: "它带给你的情感共鸣", dimension: "F", value: 2 },
            { text: "它的音乐性和创作水平", dimension: "T", value: 2 }
        ]
    },
    {
        id: 5,
        question: "发现新音乐的方式，你更喜欢：",
        options: [
            { text: "朋友推荐和社交平台分享", dimension: "E", value: 2 },
            { text: "自己探索和个性化推荐", dimension: "I", value: 2 }
        ]
    },
    {
        id: 6,
        question: "听音乐时，你更享受：",
        options: [
            { text: "探索新的音乐风格和可能性", dimension: "N", value: 2 },
            { text: "重温熟悉的经典作品", dimension: "S", value: 2 }
        ]
    },
    {
        id: 7,
        question: "创建播放列表时，你会：",
        options: [
            { text: "根据直觉和感受随意添加", dimension: "P", value: 2 },
            { text: "仔细分类和组织歌曲", dimension: "J", value: 2 }
        ]
    },
    {
        id: 8,
        question: "遇到不熟悉的音乐类型时：",
        options: [
            { text: "愿意尝试理解和欣赏", dimension: "F", value: 2 },
            { text: "先分析其音乐特点", dimension: "T", value: 2 }
        ]
    },
    {
        id: 9,
        question: "音乐对你来说是：",
        options: [
            { text: "表达和分享的媒介", dimension: "E", value: 2 },
            { text: "个人享受的方式", dimension: "I", value: 2 }
        ]
    },
    {
        id: 10,
        question: "选择音乐设备时，你更注重：",
        options: [
            { text: "声音的温暖感和音乐体验", dimension: "F", value: 2 },
            { text: "技术参数和声音还原度", dimension: "T", value: 2 }
        ]
    },
    {
        id: 11,
        question: "当你听到一首喜欢的歌时，你会：",
        options: [
            { text: "立即分享给朋友", dimension: "E", value: 2 },
            { text: "自己反复聆听", dimension: "I", value: 2 }
        ]
    },
    {
        id: 12,
        question: "对于音乐创作，你的看法是：",
        options: [
            { text: "应该打破常规，不断创新", dimension: "N", value: 2 },
            { text: "应该尊重传统，保持经典", dimension: "S", value: 2 }
        ]
    },
    {
        id: 13,
        question: "选择音乐设备时，你更注重：",
        options: [
            { text: "音质和性能参数", dimension: "T", value: 2 },
            { text: "使用体验和情感连接", dimension: "F", value: 2 }
        ]
    },
    {
        id: 14,
        question: "对于音乐收藏，你的习惯是：",
        options: [
            { text: "随性添加，不拘一格", dimension: "P", value: 2 },
            { text: "精心分类，井井有条", dimension: "J", value: 2 }
        ]
    },
    {
        id: 15,
        question: "在音乐创作中，你更看重：",
        options: [
            { text: "情感表达和故事性", dimension: "F", value: 2 },
            { text: "技术水平和创新性", dimension: "T", value: 2 }
        ]
    },
    {
        id: 16,
        question: "对于音乐节，你的态度是：",
        options: [
            { text: "积极参与，享受氛围", dimension: "E", value: 2 },
            { text: "选择性参加，注重体验", dimension: "I", value: 2 }
        ]
    },
    {
        id: 17,
        question: "评价一首歌时，你更关注：",
        options: [
            { text: "它带来的情感共鸣", dimension: "F", value: 2 },
            { text: "它的音乐性和创作水平", dimension: "T", value: 2 }
        ]
    },
    {
        id: 18,
        question: "对于音乐学习，你的方式是：",
        options: [
            { text: "系统学习，循序渐进", dimension: "J", value: 2 },
            { text: "兴趣驱动，自由探索", dimension: "P", value: 2 }
        ]
    },
    {
        id: 19,
        question: "在音乐创作中，你更倾向于：",
        options: [
            { text: "表达个人情感和经历", dimension: "F", value: 2 },
            { text: "探索音乐形式和结构", dimension: "T", value: 2 }
        ]
    },
    {
        id: 20,
        question: "对于音乐历史，你的态度是：",
        options: [
            { text: "应该了解并尊重传统", dimension: "S", value: 2 },
            { text: "应该关注当下和未来", dimension: "N", value: 2 }
        ]
    }
];

// 计算MBTI结果
function calculateMBTIType(answers: Record<number, string>): string {
    // 初始化维度得分
    const scores = {
        E: 0, I: 0,
        N: 0, S: 0,
        T: 0, F: 0,
        J: 0, P: 0
    };

    // 每个维度的问题数量统计
    const questionCounts = {
        EI: 0, // E/I维度的总问题数
        NS: 0, // N/S维度的总问题数
        TF: 0, // T/F维度的总问题数
        JP: 0  // J/P维度的总问题数
    };

    // 遍历所有问题，统计每个维度的问题数量
    MBTI_QUESTIONS.forEach(question => {
        const dim1 = question.options[0].dimension;
        const dim2 = question.options[1].dimension;
        
        // 确定这个问题属于哪个维度对
        if (dim1 === 'E' || dim1 === 'I') questionCounts.EI++;
        if (dim1 === 'N' || dim1 === 'S') questionCounts.NS++;
        if (dim1 === 'T' || dim1 === 'F') questionCounts.TF++;
        if (dim1 === 'P' || dim1 === 'J') questionCounts.JP++;
    });

    // 计算每个选项的权重（基于问题位置）
    Object.entries(answers).forEach(([questionId, dimension]) => {
        const qIndex = parseInt(questionId) - 1;
        const questionWeight = 1 + (qIndex / MBTI_QUESTIONS.length) * 0.5; // 后面的问题权重略高
        scores[dimension as keyof typeof scores] += questionWeight;
    });

    // 计算每个维度的得分比例，考虑问题数量
    const getPreference = (score1: number, score2: number, total: number): boolean => {
        const threshold = 0.5; // 基准阈值
        const ratio = score1 / (score1 + score2);
        // 考虑答题数量对结果的影响
        const confidence = (score1 + score2) / total;
        return ratio > (threshold * confidence);
    };

    // 确定最终类型
    return [
        getPreference(scores.E, scores.I, questionCounts.EI) ? 'E' : 'I',
        getPreference(scores.N, scores.S, questionCounts.NS) ? 'N' : 'S',
        getPreference(scores.F, scores.T, questionCounts.TF) ? 'F' : 'T',
        getPreference(scores.P, scores.J, questionCounts.JP) ? 'P' : 'J'
    ].join('');
}

// 分享结果生成
function generateShareText(result: MBTIResult): string {
    return `我的音乐性格是${result.type}-${result.name}！\n${result.description}\n推荐音乐类型：${result.genres.join('、')}`;
}

// MBTI编码工具
export const MBTICodec = {
    // 将MBTI字符串编码为数字 (0-31)
    encode(mbtiType: string): number {
        const bits = [
            mbtiType[0] === 'E' ? 0 : 1,  // E/I
            mbtiType[1] === 'N' ? 0 : 1,  // N/S
            mbtiType[2] === 'F' ? 0 : 1,  // F/T
            mbtiType[3] === 'P' ? 0 : 1,  // P/J
            0  // 预留扩展位
        ];
        return bits.reduce((acc, bit, index) => acc | (bit << (4 - index)), 0);
    },

    // 将数字解码为MBTI字符串
    decode(code: number): string {
        return [
            (code & 16) ? 'I' : 'E',  // 第5位
            (code & 8) ? 'S' : 'N',   // 第4位
            (code & 4) ? 'T' : 'F',   // 第3位
            (code & 2) ? 'J' : 'P',   // 第2位
            // 第1位预留扩展
        ].join('');
    }
};

export const MBTIService = {
    getQuestions: () => MBTI_QUESTIONS,
    calculateResult: (answers: Record<number, string>): MBTIResult => {
        const type = calculateMBTIType(answers);
        return MBTI_TYPES[type] || MBTI_TYPES['ENFP']; // 默认返回ENFP
    },
    generateShareText,
    getAllTypes: () => MBTI_TYPES
};