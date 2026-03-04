import React, { useState } from 'react';
import { Upload, Button, Progress, message, Card, List, Typography, Alert, Space } from 'antd';
import { UploadOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import ocrService from './services/ocrService';

const { Title, Text } = Typography;

function App() {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
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
            newResults.push({
              fileName: file.name,
              type: '未知',
              success: false,
              data: null,
              error: '无法识别，请确保上传的是清晰的身份证或银行卡照片'
            });
          }
        }
      } catch (error) {
        newResults.push({
          fileName: file.name,
          type: '未知',
          success: false,
          data: null,
          error: '处理文件时出错'
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