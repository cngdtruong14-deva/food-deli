import React from 'react';
import './Skeleton.css';

const Skeleton = ({ type = "text", width, height, style }) => {
  const styles = {
    width: width,
    height: height,
    ...style
  };

  return (
    <div className={`skeleton skeleton-${type}`} style={styles}></div>
  );
};

export default Skeleton;
