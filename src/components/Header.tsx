import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <div className="logo-squares">
            <div className="square green"></div>
            <div className="square pink"></div>
            <div className="square blue"></div>
          </div>
          <h1>미래엔영어 네이버플레이스 점검 도구</h1>
        </div>
      </div>
    </header>
  );
};

export default Header; 