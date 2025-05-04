import React from 'react';
import { Card, Rate, Typography, Avatar, Space, Divider } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import '../styles/LuxstayTheme.css';

const { Title, Text, Paragraph } = Typography;

interface Review {
  id: string;
  propertyId: string;
  propertyName: string;
  reviewerName: string;
  rating: number;
  date: string;
  review: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

const Reviews: React.FC = () => {
  // Sample reviews data
  const reviews: Review[] = [
    {
      id: '1',
      propertyId: 'p1',
      propertyName: 'Luxury Beachfront Villa',
      reviewerName: 'Sarah Johnson',
      rating: 5,
      date: '2024-03-15',
      review: 'Absolutely stunning property! The ocean view was breathtaking and the amenities were top-notch. The staff was incredibly helpful and made our stay unforgettable.',
      sentiment: 'positive'
    },
    {
      id: '2',
      propertyId: 'p2',
      propertyName: 'Modern City Apartment',
      reviewerName: 'Michael Chen',
      rating: 4,
      date: '2024-03-10',
      review: 'Great location and comfortable stay. The apartment was clean and well-maintained. The only minor issue was the noise from the street during peak hours.',
      sentiment: 'neutral'
    },
    {
      id: '3',
      propertyId: 'p3',
      propertyName: 'Mountain View Cabin',
      reviewerName: 'Emily Rodriguez',
      rating: 2,
      date: '2024-03-05',
      review: 'The property was not as described. The heating system wasn\'t working properly and the kitchen appliances were outdated. Would not recommend.',
      sentiment: 'negative'
    },
    {
      id: '4',
      propertyId: 'p1',
      propertyName: 'Luxury Beachfront Villa',
      reviewerName: 'David Wilson',
      rating: 5,
      date: '2024-02-28',
      review: 'Perfect vacation spot! The private beach access was amazing, and the villa was spacious and luxurious. Will definitely be coming back!',
      sentiment: 'positive'
    },
    {
      id: '5',
      propertyId: 'p2',
      propertyName: 'Modern City Apartment',
      reviewerName: 'Lisa Kim',
      rating: 3,
      date: '2024-02-20',
      review: 'The apartment was okay, but the check-in process was confusing. The location was convenient, but the building was a bit noisy.',
      sentiment: 'neutral'
    },
    {
      id: '6',
      propertyId: 'p3',
      propertyName: 'Mountain View Cabin',
      reviewerName: 'Robert Taylor',
      rating: 5,
      date: '2024-02-15',
      review: 'A perfect getaway! The views were spectacular, and the cabin was cozy and well-equipped. The staff was very accommodating.',
      sentiment: 'positive'
    }
  ];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '#52c41a';
      case 'negative':
        return '#ff4d4f';
      default:
        return '#faad14';
    }
  };

  return (
    <div className="luxstay-container luxstay-fade-in">
      <div className="luxstay-header">
        <Title level={2} className="luxstay-title">Property Reviews</Title>
        <Paragraph className="luxstay-subtitle">
          Read what our guests have to say about their stays
        </Paragraph>
      </div>

      <div className="luxstay-reviews-container">
        {reviews.map((review) => (
          <Card
            key={review.id}
            className="luxstay-card luxstay-review-card"
            style={{ marginBottom: '16px' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div className="luxstay-review-header">
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <div>
                    <Text strong>{review.reviewerName}</Text>
                    <br />
                    <Text type="secondary">{review.date}</Text>
                  </div>
                </Space>
                <div className="luxstay-review-rating">
                  <Rate disabled defaultValue={review.rating} />
                  <Text
                    style={{
                      color: getSentimentColor(review.sentiment),
                      marginLeft: '8px'
                    }}
                  >
                    {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                  </Text>
                </div>
              </div>
              
              <div className="luxstay-review-property">
                <Text strong>Property: </Text>
                <Text>{review.propertyName}</Text>
              </div>
              
              <Divider style={{ margin: '8px 0' }} />
              
              <Paragraph className="luxstay-review-content">
                {review.review}
              </Paragraph>
            </Space>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reviews; 