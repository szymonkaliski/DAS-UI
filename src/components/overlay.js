import React from 'react';

const Overlay = ({ children }) =>
  <div className="overlay">
    <div className="overlay__content">
      {children}
    </div>
  </div>;

export default Overlay;
