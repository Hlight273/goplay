export interface Result<T> {
    success: boolean;               // 操作是否成功
    code: number;                   // 返回的状态码
    message: string;                // 提示信息
    data: T;                        // 泛型数据
    oData: T;                        // 泛型数据
}