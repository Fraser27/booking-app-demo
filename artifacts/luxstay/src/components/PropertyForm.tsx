import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { fetchAuthSession } from 'aws-amplify/auth';
import config from '../config.json';
import '../styles/LuxstayTheme.css';

const { Option } = Select;
const { TextArea } = Input;

interface PropertyFormData {
  title: string;
  description: string;
  location: string;
  price_per_night: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  image_url?: string;
}

const PropertyForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const onFinish = async (values: PropertyFormData) => {
    setLoading(true);
    try {
      const { tokens } = await fetchAuthSession();
      const token = tokens?.idToken?.toString() || '';
      
      if (!token) {
        message.error('Authentication required');
        return;
      }
      
      const response = await fetch(`${config.apiUrl}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(values)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create property');
      }
      
      message.success('Property created successfully');
      form.resetFields();
      setFileList([]);
    } catch (error) {
      message.error('Failed to create property');
      console.error('Error creating property:', error);
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ amenities: [] }}
      style={{ maxWidth: '100%' }}
    >
      <Form.Item
        name="title"
        label="Property Title"
        rules={[{ required: true, message: 'Please enter the property title' }]}
      >
        <Input placeholder="Enter a descriptive title" size="large" />
      </Form.Item>
      
      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'Please enter a description' }]}
      >
        <TextArea 
          placeholder="Describe the property in detail" 
          rows={4}
          showCount
          maxLength={500}
        />
      </Form.Item>
      
      <Form.Item
        name="location"
        label="Location"
        rules={[{ required: true, message: 'Please select a location' }]}
      >
        <Select placeholder="Select location" size="large">
          <Option value="Maldives">Maldives</Option>
          <Option value="Bali">Bali</Option>
          <Option value="Mauritius">Mauritius</Option>
          <Option value="Santorini">Santorini</Option>
          <Option value="Amalfi Coast">Amalfi Coast</Option>
        </Select>
      </Form.Item>
      
      <Form.Item
        name="price_per_night"
        label="Price per Night ($)"
        rules={[{ required: true, message: 'Please enter the price per night' }]}
      >
        <InputNumber 
          min={1} 
          placeholder="Enter price" 
          style={{ width: '100%' }}
          size="large"
        />
      </Form.Item>
      
      <Form.Item
        name="bedrooms"
        label="Number of Bedrooms"
        rules={[{ required: true, message: 'Please enter the number of bedrooms' }]}
      >
        <InputNumber 
          min={1} 
          max={10} 
          placeholder="Enter number of bedrooms" 
          style={{ width: '100%' }}
          size="large"
        />
      </Form.Item>
      
      <Form.Item
        name="bathrooms"
        label="Number of Bathrooms"
        rules={[{ required: true, message: 'Please enter the number of bathrooms' }]}
      >
        <InputNumber 
          min={1} 
          max={10} 
          placeholder="Enter number of bathrooms" 
          style={{ width: '100%' }}
          size="large"
        />
      </Form.Item>
      
      <Form.Item
        name="amenities"
        label="Amenities"
        rules={[{ required: true, message: 'Please select at least one amenity' }]}
      >
        <Select 
          mode="multiple" 
          placeholder="Select amenities"
          size="large"
        >
          <Option value="pool">Pool</Option>
          <Option value="wifi">WiFi</Option>
          <Option value="parking">Parking</Option>
          <Option value="gym">Gym</Option>
          <Option value="spa">Spa</Option>
          <Option value="beach_access">Beach Access</Option>
          <Option value="air_conditioning">Air Conditioning</Option>
          <Option value="kitchen">Kitchen</Option>
        </Select>
      </Form.Item>
      
      <Form.Item
        name="image_url"
        label="Image URL"
        rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
      >
        <Input placeholder="Enter image URL" size="large" />
      </Form.Item>
      
      <Form.Item
        name="image"
        label="Or Upload Image"
        valuePropName="fileList"
        getValueFromEvent={normFile}
      >
        <Upload
          listType="picture"
          maxCount={1}
          fileList={fileList}
          beforeUpload={(file) => {
            setFileList([file]);
            return false;
          }}
          onRemove={() => setFileList([])}
        >
          <Button icon={<UploadOutlined />}>Select Image</Button>
        </Upload>
      </Form.Item>
      
      <Form.Item style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading}
          className="luxstay-button"
          size="large"
        >
          Create Property
        </Button>
      </Form.Item>
    </Form>
  );
};

export default PropertyForm;