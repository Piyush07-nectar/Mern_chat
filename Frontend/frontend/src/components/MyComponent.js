import React from 'react';
import { Person, PersonFill } from 'react-bootstrap-icons';

const MyComponent = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <Person size={20} />
        <PersonFill size={20} />
      </div>
      <span>Team Members</span>
    </div>
  );
};

export default MyComponent;
