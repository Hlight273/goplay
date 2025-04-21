const CAN_PAY_AMOUNT_MIN:number = 1;//1元以上才能充值
export const POLLING_INTERVAL:number = 5000;//5s一次轮询
export const CAN_PAY_TIME_LIMIT:number = 60*5//支付限时5min

export const RECHARGE_HPOINTS_RULE:string = "1元=100积分,累计充值达到6/30/128元后vip等级提升(积分用于分享音乐)"

export const canRecharge = (amount:number):boolean=>{
    return amount < CAN_PAY_AMOUNT_MIN;
}

export const formatTime = (seconds: number):string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}