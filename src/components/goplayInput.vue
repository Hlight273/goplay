<template>
    <div class="box" ref="inputContainer">
        <input :style='`width: ${widthVH}vh;`' 
            :class="['gp_input',
                        clicked?'clicked':'' ]" 
            :type=type
            @input="handleInput"
            @click="handleClick"
            :placeholder=placeholder 
            v-model=inputValue>

        <el-button class="super_submit" @click="handleSubmit" v-show="inputed">提交</el-button>
    </div>
</template>

<script lang="ts" setup>
import { inject, ref, defineProps, withDefaults, defineEmits , onMounted, onBeforeUnmount, watch } from 'vue'
const clicked = ref(false);
const inputed = ref(false);
const inputContainer = ref<HTMLElement | null>(null);

const inputValue = ref('');//实际用的model
let oldInputValue:string = '';//如果没有提交 点别的区域需要恢复。

interface Props {
  placeholder?: string;
  modelValue?: string;
  widthVH?: number
  type: string
  onSubmit?: (value: string, callback: (text: string) => void) => void;
}
const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  modelValue: '',
  widthVH: 20,
  type: 'text'
});

//emit定义
const emit = defineEmits<{
  (e: 'submit', newValue: string, callback: (text: string) => void ): void;
  (e: 'update:modelValue', value: string): void;
}>();

const handleClick = ()=>{
    clicked.value = true;
}

//
//
//外部点击事件'@submit'功能模块
// 在点击时通过 emit 触发事件，同时传递数据，加回调函数
function handleSubmit() {
  emit('submit', inputValue.value ,(text) => {
    if (text) {
      inputed.value = false;
      isFirstChanged = true;
      inputValue.value = text;
      oldInputValue = text;
    }
  });
}

//
//
//恢复文本与提交显示功能模块
let isFirstChanged = false; //这个值是false才会改变 需要恢复的输入值
//输入后要 显示提交按钮
const handleInput = (e:Event)=>{
    inputed.value = true
    const target = e.target as HTMLInputElement
    const newValue = target.value
    // 触发 update:modelValue 事件，实现双向绑定
    emit('update:modelValue', newValue)
}
// 点了外面要恢复原来的用户名 并去掉提交按钮
const handleClickOutside = (event: MouseEvent) => {
  const container = inputContainer.value;
  if (container && !container.contains(event.target as Node)) {
    //console.log('点了外面');
    clicked.value = false;
    inputed.value = false;
    inputValue.value = oldInputValue; // 或者设置为需要的默认值
  }
}
//监听props的vmodel(输入框文本)变化
watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      // 当 myProp 更新时触发事件
      console.log(`更新，原来${oldValue}，现在${newValue}`);
      inputValue.value = newValue
      if(!isFirstChanged)
        oldInputValue = newValue
      if(oldValue!=undefined)
        isFirstChanged = true
    }
  },
  { immediate: true } // immediate: true 表示立即执行一次回调函数
);

onMounted(() => {
  document.addEventListener('click', handleClickOutside);//用原生浏览器注册click事件
});
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});



</script>

<style scoped>
.box {
    display: flex;
    align-items: center;
}
.gp_input {
    padding: 1.4vh 1.2vh;
    box-sizing: border-box;
    outline: none;
    height: 2vh;
    width: 100%;
    /* border-radius: 2vh; */
    border: none;
    font-size: 1.6vh;
    color: var(--font-dark);
    background-color: #fcfcfc;
    transition: all 0.2s ease-out;
    border-radius: 2vh;
}
input.gp_input[type="text" i],[type="password" i] {
    padding-block: 0vh;
    padding-inline: 1vh;
    color: var(--font-grey);
}
.gp_input.clicked {
    /* border-bottom: 0.1vh solid var(--border-light); */
    box-shadow: 0px 0vh .2vh 0px rgb(101 95 156 / 30%);
    background-color: #fff;
}
.btn_submit {
    background-color: var(--el-color-primary);
    box-sizing: border-box;
    color: #fff;
    font-weight: 600;
    border-radius: 4vh;
    font-size: 1.3vh;
    padding: .7vh 1.5vh;
    height: 3vh;
}
.btn_submit:hover {
    background-color: var(--el-color-primary-light-3);
    color: white;
}


</style>