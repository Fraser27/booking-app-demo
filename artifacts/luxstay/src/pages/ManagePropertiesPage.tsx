import React, { useState } from 'react';
import { Card, Button, Space, Typography, Upload, message, Row, Col } from 'antd';
import { UploadOutlined, FileAddOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import PropertyForm from '../components/PropertyForm'
import config from '../config.json';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '../styles/LuxstayTheme.css';

const { Title, Paragraph } = Typography;

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
    <div className="luxstay-container luxstay-fade-in">
      <div className="luxstay-header">
        <Title level={2} className="luxstay-title">Manage Your Properties</Title>
        <Paragraph className="luxstay-subtitle">
          Add new properties to your portfolio or update existing ones
        </Paragraph>
      </div>
      
      <Card className="luxstay-search-container">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row justify="center" style={{ marginBottom: '24px' }}>
            <Col>
              <Space size="middle">
                <Button 
                  className={`luxstay-tab-button ${activeTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setActiveTab('upload')}
                  icon={<CloudUploadOutlined />}
                  size="large"
                >
                  Bulk Upload
                </Button>
                <Button 
                  className={`luxstay-tab-button ${activeTab === 'manual' ? 'active' : ''}`}
                  onClick={() => setActiveTab('manual')}
                  icon={<FileAddOutlined />}
                  size="large"
                >
                  Manual Entry
                </Button>
              </Space>
            </Col>
          </Row>

          {activeTab === 'upload' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Upload
                fileList={fileList}
                beforeUpload={(file) => {
                  setFileList([file]);
                  handleUpload(file);
                  return false;
                }}
                onRemove={() => setFileList([])}
                accept=".json,.csv"
                style={{ width: '100%' }}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  className="luxstay-button"
                  size="large"
                >
                  Select File to Upload
                </Button>
              </Upload>
              <Paragraph style={{ marginTop: '24px', color: '#888' }}>
                Upload a JSON or CSV file containing property details.
                <br />
                The file should include title, description, location, price, bedrooms, bathrooms, and amenities.
              </Paragraph>
            </div>
          ) : (
            <div className="luxstay-form-container">
              <PropertyForm />
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default withAuthenticator(ManagePropertiesPage);