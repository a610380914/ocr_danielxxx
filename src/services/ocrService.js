const Core = require('@alicloud/pop-core');

class OCRService {
  constructor() {
    this.client = new Core({
      accessKeyId: import.meta.env.VITE_ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: import.meta.env.VITE_ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'https://ocr.cn-shanghai.aliyuncs.com',
      apiVersion: '2019-12-30'
    });
  }

  async recognizeIDCard(imageBuffer) {
    const params = {
      RegionId: 'cn-shanghai',
      Image: Buffer.from(imageBuffer).toString('base64'),
      Side: 'face'
    };

    const requestOption = {
      method: 'POST'
    };

    try {
      const response = await this.client.request('RecognizeIdCard', params, requestOption);
      return response;
    } catch (error) {
      console.error('ID card OCR error:', error);
      throw error;
    }
  }

  async recognizeBankCard(imageBuffer) {
    const params = {
      RegionId: 'cn-shanghai',
      Image: Buffer.from(imageBuffer).toString('base64')
    };

    const requestOption = {
      method: 'POST'
    };

    try {
      const response = await this.client.request('RecognizeBankCard', params, requestOption);
      return response;
    } catch (error) {
      console.error('Bank card OCR error:', error);
      throw error;
    }
  }
}

export default new OCRService();