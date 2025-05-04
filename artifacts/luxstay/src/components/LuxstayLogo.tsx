import React from 'react';
import '../styles/LuxstayTheme.css';

const LuxstayLogo: React.FC = () => {
  return (
    <div className="luxstay-logo-container">
      <div className="luxstay-logo-circle">
        <div className="luxstay-logo-inner">
          <span className="luxstay-logo-text">LS</span>
        </div>
      </div>
    </div>
  );
};

export default LuxstayLogo; 