import React from 'react';
import { Card, Typography, Divider } from 'antd';
import { PhoneOutlined, MailOutlined, GlobalOutlined } from '@ant-design/icons';
import '../styles/LuxstayTheme.css';
import LuxstayLogo from './LuxstayLogo';

const { Title, Text, Paragraph } = Typography;

const CustomerSupport: React.FC = () => {
  return (
    <div className="luxstay-container">
      <div className="luxstay-support-container">
        <LuxstayLogo />
        
        <Title level={2} className="luxstay-support-header">Customer Support</Title>
        
        <Card className="luxstay-support-card">
          <Title level={3}>About Us</Title>
          <Paragraph className="luxstay-about-text">
            Luxstay is a premier property booking platform that connects travelers with unique accommodations worldwide. 
            Founded in 2024, we've quickly become a trusted name in the hospitality industry, offering a seamless booking 
            experience and exceptional customer service.
          </Paragraph>

          <Divider />

          <Title level={3}>Contact Information</Title>
          <div className="luxstay-contact-info">
            <div className="luxstay-contact-item">
              <PhoneOutlined className="luxstay-contact-icon" />
              <div>
                <Text strong>United States:</Text>
                <Text> +1 (555) 123-4567</Text>
              </div>
            </div>
            <div className="luxstay-contact-item">
              <PhoneOutlined className="luxstay-contact-icon" />
              <div>
                <Text strong>India:</Text>
                <Text> +91 98765 43210</Text>
              </div>
            </div>
            <div className="luxstay-contact-item">
              <PhoneOutlined className="luxstay-contact-icon" />
              <div>
                <Text strong>Australia:</Text>
                <Text> +61 2 9876 5432</Text>
              </div>
            </div>
            <div className="luxstay-contact-item">
              <MailOutlined className="luxstay-contact-icon" />
              <div>
                <Text strong>Email:</Text>
                <Text> support@luxstay.com</Text>
              </div>
            </div>
            <div className="luxstay-contact-item">
              <GlobalOutlined className="luxstay-contact-icon" />
              <div>
                <Text strong>Website:</Text>
                <Text> www.luxstay.com</Text>
              </div>
            </div>
          </div>

          <Divider />

          <Title level={3}>Leadership</Title>
          <div className="luxstay-leadership">
            <div className="luxstay-leader-card">
              <div className="luxstay-avatar">
                <div className="luxstay-avatar-face">
                  <div className="luxstay-avatar-eyes">
                    <div className="luxstay-avatar-eye"></div>
                    <div className="luxstay-avatar-eye"></div>
                  </div>
                  <div className="luxstay-avatar-mouth"></div>
                </div>
              </div>
              <div className="luxstay-leader-info">
                <Title level={4}>Fraser Sequeira</Title>
                <Text strong>CEO & Director</Text>
                <Paragraph>
                  Fraser Sequeira brings over 15 years of experience in the hospitality and technology sectors. 
                  As the founder and CEO of Luxstay, he has been instrumental in shaping the company's vision and 
                  driving its growth in the global property booking market.
                </Paragraph>
              </div>
            </div>
          </div>
        </Card>

        <div className="luxstay-footer">
          <Text>© 2025 Luxstay. All rights reserved.</Text>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport; 