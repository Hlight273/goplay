import * as THREE from 'three'

export interface ActionFrame {
  start: number
  end: number
}

export interface AnimationConfig {
  actionFrames: Record<string, ActionFrame>
  actionSequence: string[]
}

export class AnimationController {
  private mixer: THREE.AnimationMixer
  private model: THREE.Group
  private animations: THREE.AnimationClip[] = []
  private currentAnimation: THREE.AnimationAction | null = null
  private currentAnimationName: string | null = null
  private currentFrame: number = 0
  private absoluteFrame: number = 0
  private animationTime: number = 0
  private transitionDuration: number = 0.5
  private playbackSpeed: number = 1.0
  private currentActionIndex: number = 0
  private isPlayingReverse: boolean = false
  private config: AnimationConfig

  // 回调函数，用于更新UI状态
  private onAnimationUpdate: (data: {
    currentAnimationName: string | null
    currentFrame: number
    absoluteFrame: number
    animationTime: number
  }) => void

  constructor(
    model: THREE.Group,
    animations: THREE.AnimationClip[],
    config: AnimationConfig,
    onAnimationUpdate: (data: any) => void
  ) {
    this.model = model
    this.animations = animations
    this.mixer = new THREE.AnimationMixer(model)
    this.config = config
    this.onAnimationUpdate = onAnimationUpdate

    // 初始化动画 - 直接设置为第一个动作的结束帧
    this.jumpToActionEnd(config.actionSequence[0])
    this.currentActionIndex = 0
    this.isPlayingReverse = false
  }

  // 动画更新方法，需要在渲染循环中调用
  update() {
    if (this.mixer) {
      const deltaTime = 0.016 * this.playbackSpeed
      this.mixer.update(deltaTime)
      
      if (this.currentAnimation && this.currentAnimationName) {
        // 更新当前帧和时间信息
        this.animationTime = this.currentAnimation.time
        const fps = 30
        this.currentFrame = Math.floor(this.currentAnimation.time * fps)
        
        // 计算绝对帧位置
        const frames = this.config.actionFrames[this.currentAnimationName]
        if (frames) {
          this.absoluteFrame = frames.start + this.currentFrame
        }

        // 调用回调函数更新UI
        this.onAnimationUpdate({
          currentAnimationName: this.currentAnimationName,
          currentFrame: this.currentFrame,
          absoluteFrame: this.absoluteFrame,
          animationTime: this.animationTime
        })
      }
    }
  }

  // 播放动画
  playAnimation(animationName: string, reverse = false) {
    if (!this.mixer || !this.animations || this.animations.length === 0) return
    
    // 获取动作帧范围
    const frames = this.config.actionFrames[animationName]
    if (!frames) return
    
    // 获取主动画
    const clip = this.animations[0] // 假设只有一个动画 Armature
    if (!clip) return
    
    // 停止当前动画（如果有）
    if (this.currentAnimation) {
      this.currentAnimation.stop()
    }
    
    // 创建一个新的动画片段，只包含指定的帧范围
    const subClip = THREE.AnimationUtils.subclip(clip, animationName, frames.start, frames.end)
    
    // 创建新的动画动作
    const newAction = this.mixer.clipAction(subClip)
    
    // 设置动画循环模式和结束行为
    newAction.loop = THREE.LoopOnce // 只播放一次
    newAction.clampWhenFinished = true // 播放结束后保持最后一帧
    
    // 记录当前动画名称
    this.currentAnimationName = animationName
    this.currentAnimation = newAction
    
    // 设置播放方向
    if (reverse) {
      newAction.timeScale = -1 * this.playbackSpeed // 反向播放
      newAction.time = subClip.duration // 从结尾开始
    } else {
      newAction.timeScale = this.playbackSpeed // 正向播放
      newAction.time = 0 // 从开头开始
    }
    
    // 播放动画
    newAction.play()
    
    // 更新混合器，使动画立即生效
    this.mixer.update(0)
  }

  // 直接跳到指定动作的结束帧
  jumpToActionEnd(animationName: string) {
    const frames = this.config.actionFrames[animationName]
    if (!frames || !this.animations || this.animations.length === 0) return
    
    const clip = this.animations[0]
    if (!clip) return
    
    const subClip = THREE.AnimationUtils.subclip(clip, animationName, frames.start, frames.end)
    const action = this.mixer.clipAction(subClip)
    
    // 停止当前动画（如果有）
    if (this.currentAnimation) {
      this.currentAnimation.stop()
    }
    
    // 设置新动画
    action.loop = THREE.LoopOnce
    action.clampWhenFinished = true
    this.currentAnimation = action
    this.currentAnimationName = animationName
    
    // 直接设置到结束帧
    action.time = subClip.duration
    action.play()
    this.mixer.update(0)
  }

  // 播放下一个动作
  playNextAction() {
    if (this.isPlayingReverse) {
      // 反向播放时，先更新索引再播放
      this.currentActionIndex--
      if (this.currentActionIndex < 0) {
        // 到达序列开头，改为正向播放
        this.currentActionIndex = 0
        this.isPlayingReverse = false
      }
    } else {
      // 正向播放时，先更新索引再播放
      this.currentActionIndex++
      if (this.currentActionIndex >= this.config.actionSequence.length) {
        // 到达序列末尾，改为反向播放
        this.currentActionIndex = this.config.actionSequence.length - 1
        this.isPlayingReverse = true
      }
    }
    
    // 确定当前要播放的动作
    const currentAction = this.config.actionSequence[this.currentActionIndex]
    
    // 根据播放方向决定是正向还是反向播放
    this.playAnimation(currentAction, this.isPlayingReverse)
  }

  // 跳转到动画的特定进度
  seekAnimation(progress: number) {
    if (!this.currentAnimation || !this.currentAnimationName) return
    
    const frames = this.config.actionFrames[this.currentAnimationName]
    if (!frames) return
    
    const fps = 30
    const startTime = frames.start / fps
    const endTime = frames.end / fps
    const duration = endTime - startTime
    
    // 计算目标时间
    const targetTime = startTime + (duration * (progress / 100))
    
    // 设置动画时间
    this.currentAnimation.time = targetTime
    
    // 更新混合器，使动画立即生效
    this.mixer.update(0)
  }

  // 设置动画帧
  setAnimationFrame(frame: number) {
    if (!this.currentAnimation || !this.currentAnimationName) return
    
    const frames = this.config.actionFrames[this.currentAnimationName]
    if (!frames) return
    
    const fps = 30
    const totalFrames = frames.end - frames.start
    
    // 确保帧数在有效范围内
    const clampedFrame = Math.max(0, Math.min(frame, totalFrames))
    
    // 计算目标时间
    const targetTime = clampedFrame / fps
    
    // 设置动画时间
    this.currentAnimation.time = targetTime
    
    // 更新混合器，使动画立即生效
    this.mixer.update(0)
  }

  // 设置绝对帧位置
  setAbsoluteFrame(absoluteFrameValue: number) {
    if (!this.currentAnimation || !this.currentAnimationName) return
    
    const frames = this.config.actionFrames[this.currentAnimationName]
    if (!frames) return
    
    // 确保帧数在有效范围内
    const clampedAbsoluteFrame = Math.max(frames.start, Math.min(absoluteFrameValue, frames.end))
    
    // 计算相对帧
    const relativeFrame = clampedAbsoluteFrame - frames.start
    
    // 计算目标时间
    const fps = 30
    const targetTime = relativeFrame / fps
    
    // 设置动画时间
    this.currentAnimation.time = targetTime
    
    // 更新混合器，使动画立即生效
    this.mixer.update(0)
  }

  // 更新动画过渡时间
  updateTransitionDuration(duration: number) {
    this.transitionDuration = duration
  }

  // 更新播放速度
  updatePlaybackSpeed(speed: number) {
    this.playbackSpeed = speed
    
    if (this.currentAnimation) {
      this.currentAnimation.timeScale = this.isPlayingReverse ? -speed : speed
    }
  }

  // 获取当前状态
  getState() {
    return {
      currentAnimationName: this.currentAnimationName,
      currentFrame: this.currentFrame,
      absoluteFrame: this.absoluteFrame,
      animationTime: this.animationTime
    }
  }
}