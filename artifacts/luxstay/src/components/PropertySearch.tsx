import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Slider, Button, Space, Row, Col, Typography, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchProperties } from '../services/propertyService';
import { fetchAuthSession } from 'aws-amplify/auth';

const { Title, Text } = Typography;
const { Option } = Select;

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price_per_night: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: { content: string }[];
}

interface SearchFilters {
  query: string;
  location: string;
  priceRange: [number, number];
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
}

const PropertySearch: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string>('');
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    priceRange: [0, 2000] as [number, number],
    bedrooms: 0,
    bathrooms: 0,
    amenities: []
  });

  useEffect(() => {
    const getToken = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        if (tokens?.idToken) {
          setToken(tokens.idToken.toString());
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    };
    getToken();
  }, []);

  const handleSearch = async () => {
    if (!token) {
      message.error('Please sign in to search properties');
      return;
    }

    setLoading(true);
    try {
      const response = await searchProperties(filters.query, {
        location: filters.location,
        price_per_night: {
          min: filters.priceRange[0],
          max: filters.priceRange[1]
        },
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms,
        amenities: filters.amenities?.join(',')
      }, token);
      setProperties(response.properties);
    } catch (error) {
      message.error('Failed to search properties. Please try again.');
      console.error('Error searching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceRangeChange = (value: number | number[]) => {
    if (Array.isArray(value) && value.length === 2) {
      setFilters({ ...filters, priceRange: value as [number, number] });
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>Search Properties</Title>
          
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Input
                placeholder="Search by title, description, or location"
                prefix={<SearchOutlined />}
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                onPressEnter={handleSearch}
              />
            </Col>
            
            <Col span={12}>
              <Select
                style={{ width: '100%' }}
                placeholder="Select Location"
                value={filters.location}
                onChange={(value) => setFilters({ ...filters, location: value })}
              >
                <Option value="Maldives">Maldives</Option>
                <Option value="Bali">Bali</Option>
                <Option value="Mauritius">Mauritius</Option>
              </Select>
            </Col>
            
            <Col span={12}>
              <Text>Price Range (per night)</Text>
              <Slider
                range
                min={0}
                max={2000}
                value={filters.priceRange}
                onChange={handlePriceRangeChange}
              />
            </Col>
            
            <Col span={12}>
              <Select
                style={{ width: '100%' }}
                placeholder="Number of Bedrooms"
                value={filters.bedrooms}
                onChange={(value) => setFilters({ ...filters, bedrooms: value })}
              >
                <Option value={0}>Any</Option>
                <Option value={1}>1+</Option>
                <Option value={2}>2+</Option>
                <Option value={3}>3+</Option>
                <Option value={4}>4+</Option>
              </Select>
            </Col>
            
            <Col span={12}>
              <Select
                style={{ width: '100%' }}
                placeholder="Number of Bathrooms"
                value={filters.bathrooms}
                onChange={(value) => setFilters({ ...filters, bathrooms: value })}
              >
                <Option value={0}>Any</Option>
                <Option value={1}>1+</Option>
                <Option value={2}>2+</Option>
                <Option value={3}>3+</Option>
              </Select>
            </Col>
            
            <Col span={24}>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Select Amenities"
                value={filters.amenities}
                onChange={(value) => setFilters({ ...filters, amenities: value })}
              >
                <Option value="pool">Pool</Option>
                <Option value="wifi">WiFi</Option>
                <Option value="parking">Parking</Option>
                <Option value="gym">Gym</Option>
                <Option value="spa">Spa</Option>
              </Select>
            </Col>
            
            <Col span={24}>
              <Button type="primary" onClick={handleSearch} loading={loading}>
                Search Properties
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      <div style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          {properties.map((property) => (
            <Col span={8} key={property.id}>
              <Card
                hoverable
                cover={
                  property.images && property.images[0] ? (
                    <img
                      alt={property.title}
                      src={`data:image/jpeg;base64,${property.images[0].content}`}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  ) : null
                }
              >
                <Card.Meta
                  title={property.title}
                  description={
                    <>
                      <Text strong>${property.price_per_night}</Text> per night
                      <br />
                      <Text>{property.location}</Text>
                      <br />
                      <Text>{property.bedrooms} beds • {property.bathrooms} baths</Text>
                      <br />
                      <Text>{property.amenities.join(', ')}</Text>
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default PropertySearch; 