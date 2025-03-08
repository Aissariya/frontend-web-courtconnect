import React, { useState } from 'react';
import Swal from 'sweetalert2';
import './AddCourtForm.css';

function AddCourtForm({ onBack }) {
  // Sample existing fields for the dropdown
  const existingFields = [
    "Alpha Court TH",
    "Beta Court TH",
    "Gamma Court TH",
    "Lion Singto",
    "Football Club"
  ];

  const [formData, setFormData] = useState({
    name: '',
    isNewField: false,
    newFieldName: '',
    type: '',
    capacity: '',
    availableDays: {
      Mon: false,
      Tue: false,
      Wed: false,
      Thu: false,
      Fri: false,
      Sat: false,
      Sun: false
    },
    openingHours: '',
    bookingSlots: '',
    status: '',
    address: '',
    price: ''
  });

  const [profileImage, setProfileImage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value === 'new') {
      setFormData({
        ...formData,
        name: '',
        isNewField: true,
        newFieldName: ''
      });
    } else {
      setFormData({
        ...formData,
        name: value,
        isNewField: false,
        newFieldName: ''
      });
    }
  };

  const handleNewFieldNameChange = (e) => {
    setFormData({
      ...formData,
      newFieldName: e.target.value
    });
  };

  const handleDayToggle = (day) => {
    setFormData({
      ...formData,
      availableDays: {
        ...formData.availableDays,
        [day]: !formData.availableDays[day]
      }
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form validation
    const fieldName = formData.isNewField ? formData.newFieldName : formData.name;
    
    if (!fieldName || !formData.type) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in all required fields',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#A2F193'
      });
      return;
    }
    
    // Form submission success
    Swal.fire({
      title: 'Success!',
      text: 'Court has been added successfully',
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#A2F193'
    }).then(() => {
      onBack();
    });
  };

  const handleCancel = () => {
    onBack();
  };

  return (
    <div className="add-court-form-container">
      <div className="rectangle-23">
        <div className="back-navigation" onClick={onBack}>
          <div className="lucide-chevron-down">
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 16L7 10.5L13 5" stroke="rgba(54, 54, 54, 0.5)" strokeWidth="2" />
            </svg>
          </div>
          <div className="card-topic">
            <span className="my-court">Back to My Court</span>
          </div>
        </div>
        
        <div className="form-sections">
          <div className="rectangle-133">
            <div className="card-topic profile-topic-left">
              <span className="profile-text">Field Information</span>
            </div>
            
            <div className="text-normal name-label">
              <span className="regular">Name</span>
            </div>
            
            <div className="selection name-selection">
              <select 
                className="hug-content" 
                name="name"
                value={formData.isNewField ? 'new' : formData.name}
                onChange={handleNameChange}
              >
                <option value="">Please select a field</option>
                {existingFields.map((field, index) => (
                  <option key={index} value={field}>{field}</option>
                ))}
                <option value="new">Or create new field</option>
              </select>
              <div className="lucide-chevron-down-dropdown">
                <svg width="16" height="16" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.25 8.75L10.5 14L15.75 8.75" stroke="rgba(54, 54, 54, 0.5)" strokeWidth="2" />
                </svg>
              </div>
            </div>
            
            {formData.isNewField && (
              <div className="new-field-container">
                <div className="text-normal new-field-label">
                  <span className="regular">Name</span>
                </div>
                <div className="selection new-field-selection">
                  <input 
                    type="text" 
                    className="hug-content" 
                    name="newFieldName"
                    value={formData.newFieldName}
                    onChange={handleNewFieldNameChange}
                    placeholder="Enter new field name"
                  />
                </div>
              </div>
            )}
            
            <div className="text-normal address-label">
              <span className="regular">Address</span>
            </div>
            
            <div className="input textarea-container">
              <textarea 
                className="krittin-textarea" 
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter field address"
              ></textarea>
            </div>
          </div>
          
          <div className="rectangle-130">
            <div className="card-topic profile-topic-right">
              <span className="profile-text">Court Information</span>
            </div>
            
            <div className="text-normal type-label">
              <span className="regular">Court Type</span>
            </div>
            
            <div className="selection type-selection">
              <select 
                className="hug-content" 
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="">Please select a court type</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Tennis">Tennis</option>
                <option value="Badminton">Badminton</option>
                <option value="Swim">Swim</option>
                <option value="Yoga">Yoga</option>
              </select>
              <div className="lucide-chevron-down-dropdown">
                <svg width="16" height="16" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.25 8.75L10.5 14L15.75 8.75" stroke="rgba(54, 54, 54, 0.5)" strokeWidth="2" />
                </svg>
              </div>
            </div>
            
            <div className="text-normal capacity-label">
              <span className="regular">Capacity (people)</span>
            </div>
            
            <div className="selection capacity-selection">
              <input 
                type="number" 
                className="hug-content" 
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="Enter capacity"
              />
            </div>
            
            <div className="text-normal days-label">
              <span className="regular">Available Hours</span>
            </div>
            
            <div className="text-normal days-sublabel">
              <span className="regular">Days</span>
            </div>
            
            <div className="days-container">
              <div 
                className={`day-button ${formData.availableDays.Mon ? 'active' : ''}`} 
                onClick={() => handleDayToggle('Mon')}
              >
                <span className="day-text">Mon</span>
              </div>
              <div 
                className={`day-button ${formData.availableDays.Tue ? 'active' : ''}`} 
                onClick={() => handleDayToggle('Tue')}
              >
                <span className="day-text">Tue</span>
              </div>
              <div 
                className={`day-button ${formData.availableDays.Wed ? 'active' : ''}`} 
                onClick={() => handleDayToggle('Wed')}
              >
                <span className="day-text">Wed</span>
              </div>
              <div 
                className={`day-button ${formData.availableDays.Thu ? 'active' : ''}`} 
                onClick={() => handleDayToggle('Thu')}
              >
                <span className="day-text">Thu</span>
              </div>
              <div 
                className={`day-button ${formData.availableDays.Fri ? 'active' : ''}`} 
                onClick={() => handleDayToggle('Fri')}
              >
                <span className="day-text">Fri</span>
              </div>
              <div 
                className={`day-button ${formData.availableDays.Sat ? 'active' : ''}`} 
                onClick={() => handleDayToggle('Sat')}
              >
                <span className="day-text">Sat</span>
              </div>
              <div 
                className={`day-button ${formData.availableDays.Sun ? 'active' : ''}`} 
                onClick={() => handleDayToggle('Sun')}
              >
                <span className="day-text">Sun</span>
              </div>
            </div>
            
            <div className="time-container">
              <div className="time-field">
                <div className="text-normal time-label">
                  <span className="regular">Start Time</span>
                </div>
                <div className="selection time-selection">
                  <select 
                    className="hug-content" 
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                  >
                    <option value="">09:00</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                  </select>
                  <div className="lucide-chevron-down-dropdown">
                    <svg width="16" height="16" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.25 8.75L10.5 14L15.75 8.75" stroke="rgba(54, 54, 54, 0.5)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="time-field">
                <div className="text-normal time-label">
                  <span className="regular">End Time</span>
                </div>
                <div className="selection time-selection">
                  <select 
                    className="hug-content" 
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                  >
                    <option value="">23:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="20:00">20:00</option>
                    <option value="23:00">23:00</option>
                  </select>
                  <div className="lucide-chevron-down-dropdown">
                    <svg width="16" height="16" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.25 8.75L10.5 14L15.75 8.75" stroke="rgba(54, 54, 54, 0.5)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-normal booking-details-label">
              <span className="regular">Booking Details</span>
            </div>
            
            <div className="booking-details-container">
              <div className="booking-field">
                <div className="text-normal booking-slots-label">
                  <span className="regular">Booking Slots</span>
                </div>
                <div className="selection booking-slots-selection">
                  <select 
                    className="hug-content" 
                    name="bookingSlots"
                    value={formData.bookingSlots}
                    onChange={handleInputChange}
                  >
                    <option value="">Hourly</option>
                    <option value="Hourly">Hourly</option>
                    <option value="30 minutes">30 minutes</option>
                    <option value="2 hours">2 hours</option>
                  </select>
                  <div className="lucide-chevron-down-dropdown">
                    <svg width="16" height="16" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.25 8.75L10.5 14L15.75 8.75" stroke="rgba(54, 54, 54, 0.5)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="booking-field">
                <div className="text-normal price-label">
                  <span className="regular">Price per Slot (Baht)</span>
                </div>
                <div className="selection price-selection">
                  <input 
                    type="number" 
                    className="hug-content" 
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Enter price"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rectangle-media">
          <div className="card-topic media-topic">
            <span className="media-text">Picture</span>
          </div>
          
          <div className="text-normal upload-label">
            <span className="regular">(Up to 7 pictures)</span>
          </div>
          
          <div className="image">
            <div className="rectangle-152">
              <input 
                type="file" 
                id="court-image" 
                accept="image/*" 
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="court-image" className="image-upload-label">
                {profileImage ? (
                  <img src={profileImage || "/placeholder.svg"} alt="Court preview" className="image-preview" />
                ) : (
                  <div className="lucide-image-plus">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 6V12M12 12V18M12 12H18M12 12H6" stroke="#9A9A9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="button-action" onClick={handleCancel}>
            <span className="reject-text">Cancel</span>
          </button>
          <button className="button" onClick={handleSubmit}>
            <span className="dashboard-text">Add Court</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddCourtForm;