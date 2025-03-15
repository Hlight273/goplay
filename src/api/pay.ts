import { Result } from "@/interface/result";
import { http } from "@/util/request";

export const createPaymentOrder = (amount: number) => {
    return http.post<Result<{
        orderNo: string;
        prepayId: string;
        qrUrl: string;
        expireTime: string;
    }>>(`/mock/pay/create/${amount}`);
}

export const queryPaymentStatus = (prepayId: string) => {
    return http.get<Result<{
        status: string;
        paidAmount: number;
        successTime?: string;
    }>>(`/mock/pay/status/${prepayId}`);
}

export const confirmMockPayment = (prepayId: string, success: boolean) => {
    return http.post<Result<boolean>>(`/mock/pay/confirm/${prepayId}/${success}`);
}

