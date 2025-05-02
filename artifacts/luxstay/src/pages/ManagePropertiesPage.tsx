import React, { useState } from 'react';
import { Card, Button, Space, Typography, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import PropertyForm from '../components/PropertyForm'
import config from '../config.json';
import { fetchAuthSession } from 'aws-amplify/auth';

const { Title } = Typography;

const getAuthToken = async () => {
  const { tokens } = await fetchAuthSession();
  return tokens?.idToken?.toString() || '';
};

const ManagePropertiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${config.apiUrl}/properties/upload`, {
        method: 'POST',
        headers: {
          'Authorization': await getAuthToken()
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      message.success('Properties uploaded successfully');
      setFileList([]);
    } catch (error) {
      message.error('Failed to upload properties');
      console.error('Upload error:', error);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>Manage Properties</Title>
          
          <Space>
            <Button 
              type={activeTab === 'upload' ? 'primary' : 'default'}
              onClick={() => setActiveTab('upload')}
            >
              Bulk Upload
            </Button>
            <Button 
              type={activeTab === 'manual' ? 'primary' : 'default'}
              onClick={() => setActiveTab('manual')}
            >
              Manual Entry
            </Button>
          </Space>

          {activeTab === 'upload' ? (
            <Upload
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList([file]);
                handleUpload(file);
                return false;
              }}
              onRemove={() => setFileList([])}
              accept=".json,.csv"
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          ) : (
            <PropertyForm />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default ManagePropertiesPage; 