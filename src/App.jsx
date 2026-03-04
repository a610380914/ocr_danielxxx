import React, { useState, useEffect } from 'react';
import { Upload, Button, Progress, message, Card, List, Typography, Alert, Space, Input, Divider } from 'antd';
import { UploadOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, SaveOutlined, KeyOutlined } from '@ant-design/icons';
import ocrService from './services/ocrService';

const { Title, Text } = Typography;

function App() {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [accessKeyId, setAccessKeyId] = useState('');
  const [accessKeySecret, setAccessKeySecret] = useState('');
  const [configSaved, setConfigSaved] = useState(false);

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

  const handleUpload = async () => {
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

        // 尝试识别身份证
        try {
          const idCardResult = await ocrService.recognizeIDCard(buffer);
          newResults.push({
            fileName: file.name,
            type: '身份证',
            success: true,
            data: idCardResult.Data,
            error: null
          });
        } catch (idCardError) {
          // 尝试识别银行卡
          try {
            const bankCardResult = await ocrService.recognizeBankCard(buffer);
            newResults.push({
              fileName: file.name,
              type: '银行卡',
              success: true,
              data: bankCardResult.Data,
              error: null
            });
          } catch (bankCardError) {
            // 检查是否是认证错误
            if (bankCardError.message && (bankCardError.message.includes('InvalidAccessKeyId') || bankCardError.message.includes('SignatureDoesNotMatch'))) {
              newResults.push({
                fileName: file.name,
                type: '未知',
                success: false,
                data: null,
                error: '阿里云OCR密钥配置错误，请检查AccessKey ID和AccessKey Secret'
              });
            } else if (bankCardError.message && bankCardError.message.includes('ServiceUnavailable')) {
              newResults.push({
                fileName: file.name,
                type: '未知',
                success: false,
                data: null,
                error: '阿里云OCR服务暂时不可用，请稍后重试'
              });
            } else {
              newResults.push({
                fileName: file.name,
                type: '未知',
                success: false,
                data: null,
                error: '无法识别，请确保上传的是清晰的身份证或银行卡照片'
              });
            }
          }
        }
      } catch (error) {
        newResults.push({
          fileName: file.name,
          type: '未知',
          success: false,
          data: null,
          error: '处理文件时出错: ' + (error.message || '未知错误')
        });
      }
    }

    setResults(newResults);
    setUploading(false);
    message.success('识别完成');
  };

  const handleChange = (info) => {
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
    setFileList(validFiles);
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
        <div>
          <p><strong>姓名:</strong> {idCardData.Name}</p>
          <p><strong>身份证号:</strong> {idCardData.IDNumber}</p>
          <p><strong>性别:</strong> {idCardData.Gender}</p>
          <p><strong>民族:</strong> {idCardData.Nationality}</p>
          <p><strong>出生日期:</strong> {idCardData.BirthDate}</p>
          <p><strong>地址:</strong> {idCardData.Address}</p>
        </div>
      );
    }

    if (result.type === '银行卡') {
      const bankCardData = result.data;
      return (
        <div>
          <p><strong>卡号:</strong> {bankCardData.Number}</p>
          <p><strong>开户行:</strong> {bankCardData.Issuer}</p>
          <p><strong>卡类型:</strong> {bankCardData.Type}</p>
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
        <Upload
          name="files"
          multiple
          fileList={fileList}
          onChange={handleChange}
          beforeUpload={() => false} // 阻止自动上传
          listType="picture"
          maxCount={10}
        >
          <Button icon={<UploadOutlined />} disabled={uploading}>
            选择文件
          </Button>
        </Upload>
        
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
            disabled={fileList.length === 0 || uploading}
          >
            {uploading ? '识别中...' : '开始识别'}
          </Button>
          <Button
            onClick={() => setFileList([])}
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