// FilterButton.js
import React, { useState } from 'react';
import { SlidersHorizontal, Check, ChevronDown } from 'lucide-react';
import './FilterButton.css';

const FilterButton = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [selectedFields, setSelectedFields] = useState(['Field A', 'Field B', 'Field C']);
  const [selectedCourtTypes, setSelectedCourtTypes] = useState(['Court Type A', 'Court Type B']);
  
  const togglePanel = () => {
    setShowPanel(!showPanel);
  };
  
  const resetFields = () => {
    setSelectedFields([]);
  };
  
  const resetCourtTypes = () => {
    setSelectedCourtTypes([]);
  };
  
  const resetAll = () => {
    resetFields();
    resetCourtTypes();
  };
  
  const applyFilters = () => {
    console.log('Applied filters:', { fields: selectedFields, courtTypes: selectedCourtTypes });
    setShowPanel(false);
  };
  
  return (
    <div className="filter-button-wrapper">
      <button className="filter-button" onClick={togglePanel}>
        <SlidersHorizontal size={18} />
        <span>Filter</span>
      </button>
      
      {showPanel && (
        <div className="filter-panel">
          {/* Field Filter */}
          <div className="filter-group">
            <div className="filter-header">
              <span className="filter-label">Field</span>
              <button className="reset-button" onClick={resetFields}>
                Reset
              </button>
            </div>
            <div className="dropdown-selector">
              <span>{selectedFields.length} Selected</span>
              <ChevronDown size={16} />
            </div>
          </div>
          
          {/* Court Type Filter */}
          <div className="filter-group">
            <div className="filter-header">
              <span className="filter-label">Court Type</span>
              <button className="reset-button" onClick={resetCourtTypes}>
                Reset
              </button>
            </div>
            <div className="dropdown-selector">
              <span>{selectedCourtTypes.length} Selected</span>
              <ChevronDown size={16} />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="filter-actions">
            <button className="reset-all-button" onClick={resetAll}>
              Reset All
            </button>
            <button className="apply-button" onClick={applyFilters}>
              Apply Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterButton;