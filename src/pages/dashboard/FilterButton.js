// FilterButton.js
import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Check, ChevronDown, X } from 'lucide-react';
import './FilterButton.css';
import { collection, getDocs, getFirestore, query, where, doc, getDoc } from 'firebase/firestore';
import useAuth from '../../hooks/useAuth'; // เพิ่ม import สำหรับ useAuth hook

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
  
  // ใช้ useAuth hook เพื่อดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
  const { user } = useAuth();
  
  // ดึงข้อมูลจาก Firebase เมื่อ component ถูกโหลด
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        if (!user) {
          console.log('No user found in FilterButton');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        const db = getFirestore();
        
        // ดึงข้อมูล user จาก users collection
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          console.log('User document not found');
          setLoading(false);
          return;
        }
        
        const userData = userDocSnap.data();
        const userIdForQuery = userData.user_id;
        
        console.log('Using user_id for filter query:', userIdForQuery);
        
        // วิธีที่ 1: ดึงสนามโดยตรงที่มี user_id ตรงกับผู้ใช้
        const courtsCollection = collection(db, 'Court');
        const userCourtsQuery = query(
          courtsCollection,
          where('user_id', '==', userIdForQuery)
        );
        
        const courtsSnapshot = await getDocs(userCourtsQuery);
        
        console.log('Found courts for user:', courtsSnapshot.size);
        
        // เก็บค่า unique ของ field และ court_type
        const fields = new Set();
        const courtTypes = new Set();
        
        courtsSnapshot.forEach((doc) => {
          const court = doc.data();
          if (court.field) fields.add(court.field);
          if (court.court_type) courtTypes.add(court.court_type);
        });
        
        // ถ้าไม่พบสนามจากการค้นหาโดยตรง ให้ลองวิธีที่ 2
        if (fields.size === 0) {
          console.log('No courts found directly, trying bookings method...');
          
          // วิธีที่ 2: ดึงการจองแล้วหาสนามที่เกี่ยวข้อง
          const bookingsCollection = collection(db, 'Booking');
          const bookingsQuery = query(
            bookingsCollection,
            where('user_id', '==', userIdForQuery)
          );
          
          const bookingsSnapshot = await getDocs(bookingsQuery);
          
          // สร้าง Set ของ court_id จากการจอง
          const courtIds = new Set();
          bookingsSnapshot.forEach(doc => {
            const booking = doc.data();
            if (booking.court_id) {
              courtIds.add(booking.court_id);
            }
          });
          
          console.log('Found court IDs from bookings:', Array.from(courtIds));
          
          // ดึงข้อมูลสนามทั้งหมด
          const allCourtsSnapshot = await getDocs(collection(db, 'Court'));
          
          allCourtsSnapshot.forEach((doc) => {
            const court = doc.data();
            
            // แสดงเฉพาะสนามที่มีการจองโดยผู้ใช้ปัจจุบัน
            if (courtIds.has(court.court_id)) {
              if (court.field) fields.add(court.field);
              if (court.court_type) courtTypes.add(court.court_type);
            }
          });
        }
        
        // แปลง Set เป็น Array และเรียงลำดับตามตัวอักษร
        setAvailableFields(Array.from(fields).sort());
        setAvailableCourtTypes(Array.from(courtTypes).sort());
        setLoading(false);
        
        console.log("Available fields for current user:", Array.from(fields));
        console.log("Available court types for current user:", Array.from(courtTypes));
      } catch (error) {
        console.error('Error fetching filter options:', error);
        setLoading(false);
      }
    };
    
    fetchFilterOptions();
  }, [user]); // เพิ่ม user เป็น dependency
  
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