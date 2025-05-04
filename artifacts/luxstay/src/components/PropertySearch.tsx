import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Slider, Button, Space, Row, Col, Typography, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchProperties } from '../services/propertyService';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '../styles/LuxstayTheme.css';

const { Title, Text, Paragraph } = Typography;
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
  image_url: string;
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
    <div className="luxstay-container luxstay-fade-in">
      <div className="luxstay-header">
        <Title level={2} className="luxstay-title">Find Your Perfect Luxury Stay</Title>
        <Paragraph className="luxstay-subtitle">
          Discover exceptional properties that blend modern sophistication with timeless comfort
        </Paragraph>
      </div>
      
      <Card className="luxstay-search-container">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Input
                placeholder="Search by title, description, or location"
                prefix={<SearchOutlined />}
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                onPressEnter={handleSearch}
                size="large"
                style={{ borderRadius: '6px' }}
              />
            </Col>
            
            <Col span={12}>
              <Select
                style={{ width: '100%', borderRadius: '6px' }}
                placeholder="Select Location"
                value={filters.location}
                onChange={(value) => setFilters({ ...filters, location: value })}
                size="large"
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
                style={{ width: '100%', borderRadius: '6px' }}
                placeholder="Number of Bedrooms"
                value={filters.bedrooms}
                onChange={(value) => setFilters({ ...filters, bedrooms: value })}
                size="large"
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
                style={{ width: '100%', borderRadius: '6px' }}
                placeholder="Number of Bathrooms"
                value={filters.bathrooms}
                onChange={(value) => setFilters({ ...filters, bathrooms: value })}
                size="large"
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
                style={{ width: '100%', borderRadius: '6px' }}
                placeholder="Select Amenities"
                value={filters.amenities}
                onChange={(value) => setFilters({ ...filters, amenities: value })}
                size="large"
              >
                <Option value="pool">Pool</Option>
                <Option value="wifi">WiFi</Option>
                <Option value="parking">Parking</Option>
                <Option value="gym">Gym</Option>
                <Option value="spa">Spa</Option>
              </Select>
            </Col>
            
            <Col span={24} style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button 
                className="luxstay-button"
                onClick={handleSearch} 
                loading={loading}
                size="large"
              >
                Search Properties
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      <div style={{ marginTop: '32px' }}>
        <Row gutter={[24, 24]}>
          {properties.map((property) => (
            <Col xs={24} sm={12} md={8} key={property.id}>
              <Card
                hoverable
                className="luxstay-card luxstay-property-card"
                cover={
                  property.image_url ? (
                    <img
                      alt={property.title}
                      src={property.image_url}
                      className="luxstay-property-image"
                    />
                  ) : null
                }
              >
                <Card.Meta
                  title={property.title}
                  description={
                    <>
                      <div className="luxstay-property-price">${property.price_per_night} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>per night</span></div>
                      <div className="luxstay-property-location">{property.location}</div>
                      <div className="luxstay-property-details">{property.bedrooms} beds • {property.bathrooms} baths</div>
                      <div className="luxstay-property-amenities">{property.amenities.join(', ')}</div>
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
        
        {properties.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text style={{ fontSize: '1.1rem', color: '#888' }}>
              Search for properties to see results here
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuthenticator(PropertySearch);