import React from 'react';
import { Card, Typography, Space, Divider } from 'antd';
import BookingForm from './BookingForm';

const { Title, Text } = Typography;

interface PropertyDetailsProps {
  property: {
    id: string;
    title: string;
    description: string;
    location: string;
    price_per_night: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    image_url: string;
  };
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property }) => {
  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Title level={2}>{property.title}</Title>
          <Text type="secondary">{property.location}</Text>
          
          <Divider />
          
          <Space direction="vertical" size="middle">
            <Text strong>Description:</Text>
            <Text>{property.description}</Text>
            
            <Space>
              <Text strong>Bedrooms:</Text>
              <Text>{property.bedrooms}</Text>
            </Space>
            
            <Space>
              <Text strong>Bathrooms:</Text>
              <Text>{property.bathrooms}</Text>
            </Space>
            
            <Space>
              <Text strong>Price per night:</Text>
              <Text>${property.price_per_night}</Text>
            </Space>
            
            <Space direction="vertical">
              <Text strong>Amenities:</Text>
              <Text>{property.amenities.join(', ')}</Text>
            </Space>
          </Space>
        </Card>

        <BookingForm
          propertyId={property.id}
          pricePerNight={property.price_per_night}
        />
      </Space>
    </div>
  );
};

export default PropertyDetails; 