import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} YoloHome - Smart Home System</p>
      </div>
    </footer>
  );
};

export default Footer;