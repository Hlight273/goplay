const CAN_PAY_AMOUNT_MIN = 1;//1元以上才能充值
export const POLLING_INTERVAL = 5000;//5s一次轮询
export const CAN_PAY_TIME_LIMIT = 60*5//支付限时5min

export const canRecharge = (amount:number):boolean=>{
    return amount < CAN_PAY_AMOUNT_MIN;
}

export const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}