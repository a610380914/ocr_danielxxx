class OCRService {
  constructor() {
    // 从localStorage读取配置
    this.accessKeyId = null;
    this.accessKeySecret = null;
  }

  // 加载配置
  _loadConfig() {
    this.accessKeyId = localStorage.getItem('ALIYUN_ACCESS_KEY_ID') || import.meta.env.VITE_ALIYUN_ACCESS_KEY_ID;
    this.accessKeySecret = localStorage.getItem('ALIYUN_ACCESS_KEY_SECRET') || import.meta.env.VITE_ALIYUN_ACCESS_KEY_SECRET;
  }

  // 将ArrayBuffer转换为base64
  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // 生成签名（简化版，实际使用时需要根据阿里云文档实现完整的签名算法）
  _generateSignature() {
    // 这里使用简化的签名方式，实际使用时需要根据阿里云文档实现完整的签名算法
    // 由于浏览器环境限制，我们使用fetch API直接调用，阿里云会处理签名
    return '';
  }

  async recognizeIDCard(imageBuffer) {
    this._loadConfig();
    
    if (!this.accessKeyId || !this.accessKeySecret) {
      throw new Error('请先配置阿里云OCR密钥');
    }

    const imageBase64 = this._arrayBufferToBase64(imageBuffer);
    
    // 由于浏览器环境限制，我们使用fetch API直接调用阿里云OCR API
    // 注意：这种方式在浏览器中可能会遇到CORS问题
    // 推荐的做法是在后端实现OCR调用，前端通过API接口调用
    throw new Error('浏览器环境下暂不支持直接调用阿里云OCR API，请在后端实现OCR调用');
  }

  async recognizeBankCard(imageBuffer) {
    this._loadConfig();
    
    if (!this.accessKeyId || !this.accessKeySecret) {
      throw new Error('请先配置阿里云OCR密钥');
    }

    const imageBase64 = this._arrayBufferToBase64(imageBuffer);
    
    // 由于浏览器环境限制，我们使用fetch API直接调用阿里云OCR API
    // 注意：这种方式在浏览器中可能会遇到CORS问题
    // 推荐的做法是在后端实现OCR调用，前端通过API接口调用
    throw new Error('浏览器环境下暂不支持直接调用阿里云OCR API，请在后端实现OCR调用');
  }
}

export default new OCRService();