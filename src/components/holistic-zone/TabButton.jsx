
import React from 'react';

const TabButton = ({ label, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(label)}
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
      activeTab === label
        ? 'bg-brand-primary text-white shadow-md'
        : 'bg-brand-background text-brand-secondary hover:bg-brand-accent/30'
    }`}
  >
    {label}
  </button>
);

export default TabButton;
