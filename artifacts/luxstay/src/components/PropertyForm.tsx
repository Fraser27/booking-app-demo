import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Space, Upload, message, Card } from 'antd';

import config from '../config.json';
import { fetchAuthSession } from 'aws-amplify/auth';
import { FileUpload } from '@cloudscape-design/components';
import axios from 'axios';

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
  const [fileList, setFileList] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const getAuthToken = async () => {
    const { tokens } = await fetchAuthSession();
    return tokens?.idToken?.toString() || '';
  };


  function build_form_data(result, formdata) {
    if ('fields' in result) {
      for (var key in result['fields']) {
        formdata.append(key, result['fields'][key])
      }
    }
    return formdata
  }

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
        image_urls: []
      };
      const params = new URLSearchParams()
      params.append('file_name', fileList[0].name)
      params.append('file_extension', fileList[0].type)
      const token = await getAuthToken()
      
      const response = await axios.get(`${config.apiUrl}/properties/upload-image?${params.toString()}`, {
        headers: {
          'Authorization': token
        }
      });

      const formData = new FormData();
      build_form_data(response.data.result, formData);
      formData.append('file', fileList[0]);
      
      await axios.post(response.data.result.url, formData);
      var key = response.data.result.fields.key
      message.success("File uploaded successfully");
      
      propertyData.image_urls.push({ content: key });
      
      await axios.post(`${config.apiUrl}/properties`, {
        property: propertyData
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });
      
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
          <FileUpload
          accept=".png,.jpg,.webp,.gif"
          onChange={({ detail }) => {
            setFileList(detail.value)
          }
          }
          value={fileList}
          i18nStrings={{
            uploadButtonText: e =>
              e ? "Choose files" : "",
            dropzoneText: e =>
              e
                ? "Drop files to upload"
                : "Drop file to upload",
            removeFileAriaLabel: e =>
              `Remove file ${e + 1}`,
            limitShowFewer: "Show fewer files",
            limitShowMore: "Show more files",
            errorIconAriaLabel: "Error"
          }}
          showFileLastModified
          showFileSize
          showFileThumbnail
        />
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