import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const Logo: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '40px',
        height: '40px',
        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <span style={{ 
          color: 'white', 
          fontSize: '20px', 
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }}>
          L
        </span>
      </div>
      <Title level={3} style={{ 
        margin: 0, 
        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold'
      }}>
        Luxstay
      </Title>
    </div>
  );
};

export default Logo; 