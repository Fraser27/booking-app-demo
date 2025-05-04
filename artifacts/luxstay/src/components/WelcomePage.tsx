import React from 'react';
import { Typography, Button } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import './WelcomePage.css';

const { Title, Paragraph } = Typography;

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    navigate('/property-search');
  };

  return (
    <div className="welcome-container">
      <div className="welcome-header">
        <Logo />
      </div>

      <div className="hero-section">
        <div className="hero-content">
          <Title level={1} className="hero-title">
            Welcome to Luxstay
          </Title>
          <Paragraph className="hero-narrative">
            Born from a vision to transform the way we experience luxury travel, Luxstay emerged as a beacon of elegance and comfort in the hospitality industry. Our journey began with a simple yet profound belief: every traveler deserves to experience the extraordinary.
          </Paragraph>
          <Paragraph className="hero-narrative">
            In a world where travel has become more than just a journey, but a story waiting to be told, Luxstay stands as your trusted companion. We curate exceptional properties that blend modern sophistication with timeless comfort, ensuring your stay is nothing short of remarkable.
          </Paragraph>
          <Button 
            type="primary" 
            size="large" 
            className="explore-button"
            onClick={handleExploreClick}
          >
            Explore Properties <ArrowRightOutlined />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;