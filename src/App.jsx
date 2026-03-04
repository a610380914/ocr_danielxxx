import React, { useState, useEffect } from 'react';
import { Upload, Button, Progress, message, Card, List, Typography, Alert, Space, Input, Divider, Radio } from 'antd';
import { UploadOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, SaveOutlined, KeyOutlined } from '@ant-design/icons';
import ocrService from './services/ocrService';

const { Title, Text } = Typography;

function App() {
  const [idCardFileList, setIdCardFileList] = useState([]);
  const [bankCardFileList, setBankCardFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [accessKeyId, setAccessKeyId] = useState('');
  const [accessKeySecret, setAccessKeySecret] = useState('');
  const [configSaved, setConfigSaved] = useState(false);
  const [ocrType, setOcrType] = useState('idCard'); // idCard 或 bankCard

  // 从localStorage加载已保存的配置
  useEffect(() => {
    const savedAccessKeyId = localStorage.getItem('ALIYUN_ACCESS_KEY_ID');
    const savedAccessKeySecret = localStorage.getItem('ALIYUN_ACCESS_KEY_SECRET');
    if (savedAccessKeyId) {
      setAccessKeyId(savedAccessKeyId);
    }
    if (savedAccessKeySecret) {
      setAccessKeySecret(savedAccessKeySecret);
    }
  }, []);

  const handleSaveConfig = () => {
    if (!accessKeyId || !accessKeySecret) {
      message.error('请输入完整的阿里云OCR密钥');
      return;
    }
    
    // 保存到localStorage
    localStorage.setItem('ALIYUN_ACCESS_KEY_ID', accessKeyId);
    localStorage.setItem('ALIYUN_ACCESS_KEY_SECRET', accessKeySecret);
    setConfigSaved(true);
    message.success('配置保存成功');
    
    // 3秒后重置保存状态
    setTimeout(() => {
      setConfigSaved(false);
    }, 3000);
  };

  const handleIdCardChange = (info) => {
    // 过滤有效的图片文件
    const validFiles = info.fileList.filter(file => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJpgOrPng) {
        message.error('只能上传JPG/PNG文件!');
        return false;
      }
      if (!isLt2M) {
        message.error('文件大小不能超过2MB!');
        return false;
      }
      return true;
    });
    setIdCardFileList(validFiles);
    // 清空银行卡文件列表
    setBankCardFileList([]);
    setOcrType('idCard');
  };

  const handleBankCardChange = (info) => {
    // 过滤有效的图片文件
    const validFiles = info.fileList.filter(file => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJpgOrPng) {
        message.error('只能上传JPG/PNG文件!');
        return false;
      }
      if (!isLt2M) {
        message.error('文件大小不能超过2MB!');
        return false;
      }
      return true;
    });
    setBankCardFileList(validFiles);
    // 清空身份证文件列表
    setIdCardFileList([]);
    setOcrType('bankCard');
  };

  const handleUpload = async () => {
    let fileList = [];
    if (ocrType === 'idCard') {
      fileList = idCardFileList;
    } else {
      fileList = bankCardFileList;
    }

    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    // 检查是否配置了阿里云OCR密钥
    const savedAccessKeyId = localStorage.getItem('ALIYUN_ACCESS_KEY_ID');
    const savedAccessKeySecret = localStorage.getItem('ALIYUN_ACCESS_KEY_SECRET');
    if (!savedAccessKeyId || !savedAccessKeySecret) {
      message.error('请先配置阿里云OCR密钥');
      return;
    }

    setUploading(true);
    setProgress(0);
    const newResults = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i].originFileObj;
      const reader = new FileReader();

      try {
        // 读取文件为ArrayBuffer
        const buffer = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });

        // 更新进度
        setProgress(Math.round(((i + 1) / fileList.length) * 100));

        // 根据选择的类型进行识别
        let recognitionResult;
        if (ocrType === 'idCard') {
          recognitionResult = await ocrService.recognizeIDCard(buffer);
        } else {
          recognitionResult = await ocrService.recognizeBankCard(buffer);
        }

        newResults.push({
          fileName: file.name,
          type: ocrType === 'idCard' ? '身份证' : '银行卡',
          success: true,
          data: recognitionResult.Data,
          error: null
        });
      } catch (error) {
        // 检查是否是认证错误
        let errorMessage = '处理文件时出错';
        if (error.message) {
          if (error.message.includes('InvalidAccessKeyId') || error.message.includes('SignatureDoesNotMatch')) {
            errorMessage = '阿里云OCR密钥配置错误，请检查AccessKey ID和AccessKey Secret';
          } else if (error.message.includes('ServiceUnavailable')) {
            errorMessage = '阿里云OCR服务暂时不可用，请稍后重试';
          } else {
            errorMessage = error.message;
          }
        }
        newResults.push({
          fileName: file.name,
          type: ocrType === 'idCard' ? '身份证' : '银行卡',
          success: false,
          data: null,
          error: errorMessage
        });
      }
    }

    setResults(newResults);
    setUploading(false);
    message.success('识别完成');
  };

  const getResultContent = (result) => {
    if (!result.success) {
      return (
        <Alert
          message="识别失败"
          description={result.error}
          type="error"
          showIcon
        />
      );
    }

    if (result.type === '身份证') {
      const idCardData = result.data;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>姓名:</strong></span>
            <span>{idCardData.Name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>身份证号:</strong></span>
            <span>{idCardData.IDNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>性别:</strong></span>
            <span>{idCardData.Gender}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>民族:</strong></span>
            <span>{idCardData.Nationality}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>出生日期:</strong></span>
            <span>{idCardData.BirthDate}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>地址:</strong></span>
            <span style={{ flex: 1, marginLeft: '10px' }}>{idCardData.Address}</span>
          </div>
        </div>
      );
    }

    if (result.type === '银行卡') {
      const bankCardData = result.data;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>卡号:</strong></span>
            <span>{bankCardData.Number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>开户行:</strong></span>
            <span>{bankCardData.Issuer}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>卡类型:</strong></span>
            <span>{bankCardData.Type}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>OCR识别系统</Title>
      
      <Card
        title={<Space><KeyOutlined /> 阿里云OCR配置</Space>}
        style={{ marginBottom: '20px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="请输入AccessKey ID"
            value={accessKeyId}
            onChange={(e) => setAccessKeyId(e.target.value)}
            style={{ width: '100%' }}
          />
          <Input.Password
            placeholder="请输入AccessKey Secret"
            value={accessKeySecret}
            onChange={(e) => setAccessKeySecret(e.target.value)}
            style={{ width: '100%' }}
          />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveConfig}
            style={{ alignSelf: 'flex-start' }}
          >
            {configSaved ? '已保存' : '保存配置'}
          </Button>
          <Text type="secondary">
            配置将保存在浏览器本地，刷新页面后仍然有效
          </Text>
        </Space>
      </Card>
      
      <Divider />
      
      <Card
        title="上传文件"
        extra={<Text type="secondary">支持JPG、PNG格式，单个文件不超过2MB</Text>}
        style={{ marginBottom: '20px' }}
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: '20px' }}>
          <Radio.Group value={ocrType} onChange={(e) => setOcrType(e.target.value)}>
            <Radio value="idCard">身份证识别</Radio>
            <Radio value="bankCard">银行卡识别</Radio>
          </Radio.Group>
        </Space>
        
        {ocrType === 'idCard' ? (
          <Upload
            name="idCardFiles"
            multiple
            fileList={idCardFileList}
            onChange={handleIdCardChange}
            beforeUpload={() => false} // 阻止自动上传
            listType="picture"
            maxCount={10}
          >
            <Button icon={<UploadOutlined />} disabled={uploading}>
              选择身份证照片
            </Button>
          </Upload>
        ) : (
          <Upload
            name="bankCardFiles"
            multiple
            fileList={bankCardFileList}
            onChange={handleBankCardChange}
            beforeUpload={() => false} // 阻止自动上传
            listType="picture"
            maxCount={10}
          >
            <Button icon={<UploadOutlined />} disabled={uploading}>
              选择银行卡照片
            </Button>
          </Upload>
        )}
        
        {uploading && (
          <Progress
            percent={progress}
            status="active"
            style={{ marginTop: '20px' }}
          />
        )}
        
        <Space style={{ marginTop: '20px' }}>
          <Button
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={(idCardFileList.length === 0 && bankCardFileList.length === 0) || uploading}
          >
            {uploading ? '识别中...' : '开始识别'}
          </Button>
          <Button
            onClick={() => {
              setIdCardFileList([]);
              setBankCardFileList([]);
            }}
            disabled={uploading}
          >
            清空
          </Button>
        </Space>
      </Card>

      {results.length > 0 && (
        <Card title="识别结果" style={{ marginBottom: '20px' }}>
          <List
            dataSource={results}
            renderItem={(result) => (
              <List.Item
                actions={[
                  result.success ? (
                    <CheckCircleOutlined key="success" style={{ color: 'green' }} />
                  ) : (
                    <CloseCircleOutlined key="error" style={{ color: 'red' }} />
                  )
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{result.fileName}</Text>
                      <Text type="secondary">({result.type})</Text>
                    </Space>
                  }
                  description={getResultContent(result)}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}

export default App;