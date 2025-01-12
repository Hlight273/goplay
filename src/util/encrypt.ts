import  CryptoJS  from 'crypto-js'

//设置秘钥和秘钥偏移量
const SECRET_KEY = CryptoJS.enc.Utf8.parse("114514");
const SECRET_IV = CryptoJS.enc.Utf8.parse("114514");
/**
 * 加密方法
 * @param word
 * @returns {string}
 */
function encrypt(word:string) {
  let srcs = CryptoJS.enc.Utf8.parse(word);
  let encrypted = CryptoJS.AES.encrypt(srcs, SECRET_KEY, {
      iv: SECRET_IV ,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.ZeroPadding
  })
  return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
}

export { encrypt };                        
//原文链接：https://blog.csdn.net/hou_ge/article/details/132805357