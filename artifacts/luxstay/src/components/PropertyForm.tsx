import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Space, Upload, message, Card } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import config from '../config.json';
import { fetchAuthSession } from 'aws-amplify/auth';

const { TextArea } = Input;
const { Option } = Select;

interface PropertyFormData {
  title: string;
  description: string;
  location: string;
  price_per_night: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
}

const PropertyForm: React.FC = () => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  const getAuthToken = async () => {
    const { tokens } = await fetchAuthSession();
    return tokens?.idToken?.toString() || '';
  };

  const handleSubmit = async (values: PropertyFormData) => {
    setLoading(true);
    try {
      const propertyData = {
        title: values.title,
        description: values.description,
        location: values.location,
        price_per_night: values.price_per_night,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        amenities: values.amenities,
        images: [] as { content: string }[]
      };

      // Convert images to base64
      for (const file of fileList) {
        if (file.originFileObj) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file.originFileObj as File);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });
          propertyData.images.push({ content: base64.split(',')[1] });
        }
      }

      const response = await fetch(`${config.apiUrl}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': await getAuthToken()
        },
        body: JSON.stringify({ property: propertyData })
      });

      if (!response.ok) {
        throw new Error('Failed to create property');
      }

      const result = await response.json();
      message.success('Property created successfully');
      form.resetFields();
      setFileList([]);
    } catch (error) {
      message.error('Failed to create property');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      style={{ 
        maxWidth: 800, 
        margin: '0 auto',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px'
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ padding: '24px' }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 600, 
            color: '#1a1a1a',
            marginBottom: '8px'
          }}>
            Add New Property
          </h2>
          <p style={{ color: '#666' }}>
            Fill in the details to list your property
          </p>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Form.Item
            name="title"
            label={<span style={{ fontWeight: 500 }}>Property Title</span>}
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input size="large" placeholder="Enter property title" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 500 }}>Description</span>}
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <TextArea rows={4} placeholder="Describe your property" />
          </Form.Item>

          <Form.Item
            name="location"
            label={<span style={{ fontWeight: 500 }}>Location</span>}
            rules={[{ required: true, message: 'Please enter a location' }]}
          >
            <Input size="large" placeholder="Enter property location" />
          </Form.Item>

          <Space direction="horizontal" size="large" style={{ width: '100%' }}>
            <Form.Item
              name="price_per_night"
              label={<span style={{ fontWeight: 500 }}>Price per Night</span>}
              rules={[{ required: true, message: 'Please enter a price' }]}
              style={{ flex: 1 }}
            >
              <InputNumber 
                min={0} 
                style={{ width: '100%' }} 
                size="large"
                prefix="₹"
                placeholder="Enter price"
              />
            </Form.Item>

            <Form.Item
              name="bedrooms"
              label={<span style={{ fontWeight: 500 }}>Bedrooms</span>}
              rules={[{ required: true, message: 'Please enter number of bedrooms' }]}
              style={{ flex: 1 }}
            >
              <InputNumber 
                min={1} 
                style={{ width: '100%' }} 
                size="large"
                placeholder="No. of bedrooms"
              />
            </Form.Item>

            <Form.Item
              name="bathrooms"
              label={<span style={{ fontWeight: 500 }}>Bathrooms</span>}
              rules={[{ required: true, message: 'Please enter number of bathrooms' }]}
              style={{ flex: 1 }}
            >
              <InputNumber 
                min={1} 
                style={{ width: '100%' }} 
                size="large"
                placeholder="No. of bathrooms"
              />
            </Form.Item>
          </Space>

          <Form.Item
            name="amenities"
            label={<span style={{ fontWeight: 500 }}>Amenities</span>}
            rules={[{ required: true, message: 'Please select amenities' }]}
          >
            <Select 
              mode="multiple" 
              size="large"
              placeholder="Select amenities"
              style={{ width: '100%' }}
            >
              <Option value="pool">Swimming Pool</Option>
              <Option value="wifi">WiFi</Option>
              <Option value="parking">Parking</Option>
              <Option value="gym">Gym</Option>
              <Option value="spa">Spa</Option>
              <Option value="ac">Air Conditioning</Option>
              <Option value="kitchen">Kitchen</Option>
              <Option value="tv">TV</Option>
              <Option value="bbq">BBQ</Option>
              <Option value="garden">Garden</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: 500 }}>Property Images</span>}
            rules={[{ required: true, message: 'Please upload at least one image' }]}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList([...fileList, file]);
                return false;
              }}
              onRemove={(file) => {
                const index = fileList.indexOf(file);
                const newFileList = fileList.slice();
                newFileList.splice(index, 1);
                setFileList(newFileList);
              }}
              accept="image/*"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              style={{ 
                width: '100%',
                height: '48px',
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              Create Property
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Card>
  );
};

export default PropertyForm; 