// FilterButton.js
import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Check, ChevronDown, X } from 'lucide-react';
import './FilterButton.css';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';

const FilterButton = ({ onApplyFilters }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [selectedFields, setSelectedFields] = useState([]);
  const [selectedCourtTypes, setSelectedCourtTypes] = useState([]);
  const [fieldsDropdownOpen, setFieldsDropdownOpen] = useState(false);
  const [courtTypesDropdownOpen, setCourtTypesDropdownOpen] = useState(false);
  
  // เพิ่ม state เพื่อเก็บข้อมูลที่ดึงมาจาก Firebase
  const [availableFields, setAvailableFields] = useState([]);
  const [availableCourtTypes, setAvailableCourtTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ดึงข้อมูลจาก Firebase เมื่อ component ถูกโหลด
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        
        // 1. ดึงข้อมูลการจองทั้งหมดโดยกรองเฉพาะของ user ปัจจุบัน
        const bookingsCollection = collection(db, 'Booking');
        const bookingsQuery = query(
          bookingsCollection,
          where('user_id', '==', 'USR0001') // ใช้ user_id ที่ login อยู่
        );
        
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        // สร้าง Set ของ court_id จากการจองเพื่อลดความซ้ำซ้อน
        const courtIds = new Set();
        bookingsSnapshot.forEach(doc => {
          const booking = doc.data();
          if (booking.court_id) {
            courtIds.add(booking.court_id);
          }
        });
        
        // 2. ดึงข้อมูลสนามทั้งหมด
        const courtsCollection = collection(db, 'Court');
        const courtsSnapshot = await getDocs(courtsCollection);
        
        // เก็บค่า unique ของ field และ court_type เฉพาะจากสนามที่มีการจอง
        const fields = new Set();
        const courtTypes = new Set();
        
        courtsSnapshot.forEach((doc) => {
          const court = doc.data();
          
          // ถ้าเลือกแสดงเฉพาะสนามที่มีการจอง
          // if (courtIds.has(court.court_id)) {
          //   if (court.field) fields.add(court.field);
          //   if (court.court_type) courtTypes.add(court.court_type);
          // }
          
          // หรือถ้าต้องการแสดงทุกสนาม
          if (court.field) fields.add(court.field);
          if (court.court_type) courtTypes.add(court.court_type);
        });
        
        // แปลง Set เป็น Array และเรียงลำดับตามตัวอักษร
        setAvailableFields(Array.from(fields).sort());
        setAvailableCourtTypes(Array.from(courtTypes).sort());
        setLoading(false);
        
        console.log("Available fields:", Array.from(fields));
        console.log("Available court types:", Array.from(courtTypes));
      } catch (error) {
        console.error('Error fetching filter options:', error);
        setLoading(false);
      }
    };
    
    fetchFilterOptions();
  }, []);
  
  const togglePanel = () => {
    setShowPanel(!showPanel);
    // เมื่อปิด panel ให้ปิด dropdown ด้วย
    if (showPanel) {
      setFieldsDropdownOpen(false);
      setCourtTypesDropdownOpen(false);
    }
  };
  
  const toggleFieldsDropdown = () => {
    setFieldsDropdownOpen(!fieldsDropdownOpen);
    setCourtTypesDropdownOpen(false); // ปิด dropdown อื่นเมื่อเปิด fields
  };
  
  const toggleCourtTypesDropdown = () => {
    setCourtTypesDropdownOpen(!courtTypesDropdownOpen);
    setFieldsDropdownOpen(false); // ปิด dropdown อื่นเมื่อเปิด court types
  };
  
  const toggleFieldSelection = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };
  
  const toggleCourtTypeSelection = (courtType) => {
    if (selectedCourtTypes.includes(courtType)) {
      setSelectedCourtTypes(selectedCourtTypes.filter(ct => ct !== courtType));
    } else {
      setSelectedCourtTypes([...selectedCourtTypes, courtType]);
    }
  };
  
  const resetFields = () => {
    setSelectedFields([]);
    // เพิ่มการเรียก callback เมื่อมีการ reset
    if (onApplyFilters) {
      onApplyFilters([], selectedCourtTypes);
    }
  };
  
  const resetCourtTypes = () => {
    setSelectedCourtTypes([]);
    // เพิ่มการเรียก callback เมื่อมีการ reset
    if (onApplyFilters) {
      onApplyFilters(selectedFields, []);
    }
  };
  
  const resetAll = () => {
    resetFields();
    resetCourtTypes();
    // เพิ่มการเรียก callback เมื่อมีการ reset ทั้งหมด
    if (onApplyFilters) {
      onApplyFilters([], []);
    }
    // ปิด panel หลังจาก reset
    setShowPanel(false);
  };
  
  const applyFilters = () => {
    console.log('Applied filters in FilterButton:', { fields: selectedFields, courtTypes: selectedCourtTypes });
    // เรียกใช้ callback function เพื่อส่งข้อมูลตัวกรองกลับไปยัง parent component
    if (onApplyFilters) {
      onApplyFilters(selectedFields, selectedCourtTypes);
    }
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
            <div className="dropdown-selector" onClick={toggleFieldsDropdown}>
              <span>
                {selectedFields.length > 0 
                  ? `${selectedFields.length} Selected` 
                  : 'Select Fields'}
              </span>
              <ChevronDown size={16} />
            </div>
            
            {fieldsDropdownOpen && (
              <div className="dropdown-options">
                {loading ? (
                  <div className="loading-text">Loading fields...</div>
                ) : availableFields.length > 0 ? (
                  availableFields.map((field, index) => (
                    <div 
                      key={index} 
                      className={`dropdown-option ${selectedFields.includes(field) ? 'selected' : ''}`}
                      onClick={() => toggleFieldSelection(field)}
                    >
                      <span>{field}</span>
                      {selectedFields.includes(field) && <Check size={16} />}
                    </div>
                  ))
                ) : (
                  <div className="no-data-text">No fields available</div>
                )}
              </div>
            )}
          </div>
          
          {/* Court Type Filter */}
          <div className="filter-group">
            <div className="filter-header">
              <span className="filter-label">Court Type</span>
              <button className="reset-button" onClick={resetCourtTypes}>
                Reset
              </button>
            </div>
            <div className="dropdown-selector" onClick={toggleCourtTypesDropdown}>
              <span>
                {selectedCourtTypes.length > 0 
                  ? `${selectedCourtTypes.length} Selected` 
                  : 'Select Court Types'}
              </span>
              <ChevronDown size={16} />
            </div>
            
            {courtTypesDropdownOpen && (
              <div className="dropdown-options">
                {loading ? (
                  <div className="loading-text">Loading court types...</div>
                ) : availableCourtTypes.length > 0 ? (
                  availableCourtTypes.map((courtType, index) => (
                    <div 
                      key={index} 
                      className={`dropdown-option ${selectedCourtTypes.includes(courtType) ? 'selected' : ''}`}
                      onClick={() => toggleCourtTypeSelection(courtType)}
                    >
                      <span>{courtType}</span>
                      {selectedCourtTypes.includes(courtType) && <Check size={16} />}
                    </div>
                  ))
                ) : (
                  <div className="no-data-text">No court types available</div>
                )}
              </div>
            )}
          </div>
          
          {/* Selected Tags Display */}
          {(selectedFields.length > 0 || selectedCourtTypes.length > 0) && (
            <div className="selected-tags">
              {selectedFields.map((field, index) => (
                <div key={`field-${index}`} className="tag">
                  <span>{field}</span>
                  <X 
                    size={14} 
                    className="tag-remove" 
                    onClick={() => toggleFieldSelection(field)} 
                  />
                </div>
              ))}
              
              {selectedCourtTypes.map((courtType, index) => (
                <div key={`court-${index}`} className="tag">
                  <span>{courtType}</span>
                  <X 
                    size={14} 
                    className="tag-remove" 
                    onClick={() => toggleCourtTypeSelection(courtType)} 
                  />
                </div>
              ))}
            </div>
          )}
          
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