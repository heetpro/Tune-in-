import React from 'react';
import styled from 'styled-components';

export const Loader = () => {
  return (
    <StyledWrapper>
      <div className="loader" />
    </StyledWrapper>
  );
}
  const myMessageColors = [
    { bg: '#F46D38', text: '#fff' },
    { bg: '#C2F949', text: '#000' },
    { bg: '#8D50F9', text: '#fff' }
  ];

  const otherMessageColors = [
    { bg: '#FF6B9D', text: '#000' },
    { bg: '#901E3E', text: '#fff' },
    { bg: '#00CAFF', text: '#000' }
  ];

const StyledWrapper = styled.div`
  .loader {
    width: 44.8px;
    height: 44.8px;
    color: #554cb5;
    position: relative;
    background: radial-gradient(11.2px,#C2F949 94%,#0000);
  }

  .loader:before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(10.08px at bottom right,#0000 94%,#F46D38) top    left,
            radial-gradient(10.08px at bottom left ,#0000 94%,#8D50F9) top    right,
            radial-gradient(10.08px at top    right,#0000 94%,#FF6B9D) bottom left,
            radial-gradient(10.08px at top    left ,#0000 94%,#00CAFF) bottom right;
    background-size: 22.4px 22.4px;
    background-repeat: no-repeat;
    animation: loader 1.5s infinite cubic-bezier(0.3,1,0,1);
  }

  @keyframes loader {
    33% {
      inset: -11.2px;
      transform: rotate(0deg);
    }

    66% {
      inset: -11.2px;
      transform: rotate(90deg);
    }

    100% {
      inset: 0;
      transform: rotate(90deg);
    }
  }`;

export default Loader;
