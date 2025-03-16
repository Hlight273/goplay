<template>
    <div class="mock-pay-container">
      <!-- 订单创建区 -->
      <el-card v-if="!prepayId" class="create-card">
        <template #header>
          <div class="card-header">
            <span class="title">创建支付订单</span>
          </div>
        </template>
        
        <div class="create-form">
          <el-input 
            v-model.number="amount"
            type="number"
            placeholder="请输入充值金额"
            step="0.01"
            style="width: 240px"
            :class="{ 'input-error': canRecharge(amount) }"
          >
            <template #append>元</template>
          </el-input>
          
          <el-button 
            type="primary" 
            :loading="loading" 
            @click="handleCreate"
            class="super_submit"
          >
            {{ loading ? '订单生成中...' : '立即充值' }}
          </el-button>
          
          <div v-if="canRecharge(amount)" class="error-tip">
            <el-icon><warning /></el-icon>
            金额必须大于1
          </div>
          <div class="error-tip" style="color: gray;">
            <el-icon><warning /></el-icon>
            {{RECHARGE_HPOINTS_RULE}}
          </div>
        </div>
      </el-card>
  
      <!-- 支付交互区 -->
      <el-card v-else class="payment-card">
        <template #header>
          <div class="card-header">
            <span class="title">支付订单 #{{ prepayId }}</span>
            <el-tag :type="countdown > 60 ? 'success' : 'danger'">
              剩余支付时间: {{ formatTime(countdown) }}
            </el-tag>
          </div>
        </template>
  
        <div class="payment-content">
          <div class="qr-section">
            <div class="qr-box">
              <img :src="qrUrl" alt="支付二维码" class="qr-image">
              <div class="scan-tip">请使用手机扫码支付</div>
            </div>
            
            <div class="action-buttons">
              <el-button 
                type="success" 
                icon="check" 
                @click="simulateSuccess"
                class="pay-btn"
              >
                模拟支付成功
              </el-button>
              <el-button 
                type="danger" 
                icon="close" 
                @click="simulateFailure"
                class="pay-btn"
              >
                模拟支付失败
              </el-button>
            </div>
          </div>
  
          <el-divider>支付结果</el-divider>
  
          <div v-if="paid" class="result-section">
            <el-alert 
              :title="paymentResult" 
              :type="resultType"
              show-icon
              :closable="false"
              class="result-alert"
            />
            <div class="amount-display">
              <el-statistic 
                :value="paidAmount" 
                precision="2"
                title="实付金额"
              >
                <template #suffix>元</template>
              </el-statistic>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onBeforeUnmount, computed } from 'vue';
  import { createPaymentOrder, queryPaymentStatus,confirmMockPayment, } from '@/api/pay';
  import { OrderStatus, ResultCode } from '@/util/webConst';
  import { ElMessage } from 'element-plus';
  import { CAN_PAY_TIME_LIMIT, canRecharge, formatTime, POLLING_INTERVAL, RECHARGE_HPOINTS_RULE } from '@/util/payUtil';

  import { useCommonStore } from "@/store/commonStore";
  const commonStore = useCommonStore();
  
  const amount = ref(0);
  const prepayId = ref('');
  const qrUrl = ref('');
  const countdown = ref(CAN_PAY_TIME_LIMIT); // 5分钟倒计时
  const paid = ref(false);
  const paymentResult = ref('');
  const paidAmount = ref(0);
  const loading = ref(false);
  let pollingTimer: number;
  let countdownTimer:number;

  // 创建订单
  const handleCreate = async () => {
    loading.value = true;
    try {
      const res = await createPaymentOrder(amount.value);
      if (res.code === ResultCode.SUCCESS) {
        prepayId.value = res.oData.prepayId;
        qrUrl.value = res.oData.qrUrl;
        startPolling();
        startCountdown(); // 启动倒计时
      }
    } finally {
      loading.value = false;
    }
  };
  
  // 启动轮询
  const startPolling = () => {
    pollingTimer = window.setInterval(async () => {
      const res = await queryPaymentStatus(prepayId.value);
      if (res.code === ResultCode.SUCCESS) {
        clearTimers();
        paid.value = true;
        paidAmount.value = res.oData.paidAmount;
        if (res.oData.status === OrderStatus.PAID) { //支付成功后需要更新全局myUserInfo
          paymentResult.value = '支付成功';
          commonStore.updateMyUserInfo();
        } else if (res.oData.status === OrderStatus.FAILED) {
          paymentResult.value = '支付失败';
        }else if (res.oData.status === OrderStatus.EXPIRED) {
          paymentResult.value = '订单已过期';
        }
      } else if (res.code === ResultCode.ERROR) { 
        clearTimers();
        paid.value = true;
        paymentResult.value = '订单异常！';
      }
    }, POLLING_INTERVAL); // 每5秒轮询一次
  };
  
  // 启动倒计时
  const startCountdown = () => {
    countdownTimer = window.setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearTimers();
        // 倒计时结束，通知后端订单失败
        ElMessage.warning('订单已过期！')
      }
    }, 1000); // 每秒减1
  };
  
  // 模拟支付成功
  const simulateSuccess = () => {
    confirmMockPayment(prepayId.value, true).then(() => {
      paymentResult.value = '支付成功';
    });
  };
  
  // 模拟支付失败
  const simulateFailure = () => {
    confirmMockPayment(prepayId.value, false).then(() => {
      paymentResult.value = '支付失败';
    });
  };
  
  const clearTimers = ()=>{
    clearInterval(pollingTimer);
    clearInterval(countdownTimer);
  }

  onBeforeUnmount(() => clearTimers());
  // 在组件卸载时清理定时器




const resultType = computed(() => {
  return paymentResult.value === '支付成功' ? 'success' : 
    paymentResult.value === '订单已过期' ? 'warning' : 'error'
})
  </script>

<style scoped>
.mock-pay-container {
  max-width: 80vh;
  margin: 2vh auto;
  padding: 2vh;
}

.title {
    font-size: 1.5vh;
    font-weight: 500;
    color: #606060;
}

.create-card {
  text-align: center;
  border-radius: 1vh;
  box-shadow: 0 0.2vh 1.2vh rgba(0,0,0,0.1);
}

.create-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2vh;
  padding: 2vh;
}

.input-error .el-input__wrapper {
  box-shadow: 0 0 0 0.1vh var(--el-color-danger) inset !important;
}

.error-tip {
  color: var(--el-color-danger);
  display: flex;
  align-items: center;
  gap: 0.6vh;
}

.create-btn {
  width: 16vh;
  height: 4vh;
  font-size: 1.5vh;
}

.payment-card {
  border-radius: 1vh;
  box-shadow: 0 0.2vh 1.2vh rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.6vh 2vh;
}

.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3vh;
  padding: 2vh;
}

.qr-box {
  padding: 1.5vh;
  border-radius: 1vh;
  box-shadow: 0 0.2vh 1.2vh rgba(0,0,0,0.1);
}

.qr-image {
  width: 22vh;
  height: 22vh;
  border: 0.1vh solid var(--el-border-color);
  border-radius: 0.4vh;
  transition: transform 0.3s;
}

.scan-tip {
  margin-top: 1.2vh;
  font-size: 1.2vh;
}

.action-buttons {
  display: flex;
  gap: 2vh;
}

.pay-btn {
  width: 18vh;
  padding: 1.8vh 0;
  font-size: 1.5vh;
}

@media (max-width: 768px) {
  .mock-pay-container {
    padding: 1vh;
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .pay-btn {
    width: 100% !important;
  }
}

.result-alert {
  margin: 2vh auto;
  max-width: 40vh;
}

.amount-display .el-statistic__content {
  font-size: 2.8vh;
}
</style>