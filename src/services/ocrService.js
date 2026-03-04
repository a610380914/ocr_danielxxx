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
  _generateSignature(params, method, path, date) {
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
    
    // 构造请求参数
    const params = {
      Action: 'RecognizeIdCard',
      Version: '2019-12-30',
      RegionId: 'cn-shanghai',
      Image: imageBase64,
      Side: 'face'
    };

    // 构造请求URL
    const url = new URL('https://ocr.cn-shanghai.aliyuncs.com');
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });

    try {
      // 发送请求
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'AccessKeyId': this.accessKeyId,
          'Signature': this._generateSignature(params, 'POST', '/', new Date().toISOString())
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ID card OCR error:', error);
      throw error;
    }
  }

  async recognizeBankCard(imageBuffer) {
    this._loadConfig();
    
    if (!this.accessKeyId || !this.accessKeySecret) {
      throw new Error('请先配置阿里云OCR密钥');
    }

    const imageBase64 = this._arrayBufferToBase64(imageBuffer);
    
    // 构造请求参数
    const params = {
      Action: 'RecognizeBankCard',
      Version: '2019-12-30',
      RegionId: 'cn-shanghai',
      Image: imageBase64
    };

    // 构造请求URL
    const url = new URL('https://ocr.cn-shanghai.aliyuncs.com');
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });

    try {
      // 发送请求
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'AccessKeyId': this.accessKeyId,
          'Signature': this._generateSignature(params, 'POST', '/', new Date().toISOString())
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Bank card OCR error:', error);
      throw error;
    }
  }
}

export default new OCRService();