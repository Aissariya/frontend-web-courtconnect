import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './AddCourtForm.css';
import { collection, getDoc, updateDoc, doc, addDoc, getFirestore, setDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from '../../firebaseConfig';
import { onSnapshot } from "firebase/firestore";
import useAuth from '../../hooks/useAuth';
import { getAuth } from 'firebase/auth';

function AddCourtForm({ onBack }) {
  // Sample existing fields for the dropdown
  const existingFields = [
  ];
  const { user } = useAuth();
  const [userId, setUserId] = useState(null);
  

  // Firebase instances
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

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
    price: '',
    startTime: '',  //  เพิ่ม startTime
    endTime: '',    //  เพิ่ม endTime
    image: []
  });
  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    const fetchUserId = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid); // 🔹 อ้างอิงเอกสารของ user ที่ล็อกอิน
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserId(userDocSnap.data().user_id); // 🔹 ดึง user_id จาก Firestore
          } else {
            console.error("No user document found!");
          }
        } catch (error) {
          console.error("Error fetching user document: ", error);
        }
      }
    };

    fetchUserId();
  }, [user]); //  เรียกใช้ useEffect เมื่อ user เปลี่ยนแปลง

  const uploadImagesToFirebase = async (images) => {
    const urls = [];
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageRef = ref(storage, `ImageCourt/${Date.now()}_${image.name}`);
      await uploadBytes(imageRef, image);
      const downloadURL = await getDownloadURL(imageRef);
      urls.push(downloadURL);
    }
    return urls;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files); //  รับไฟล์ทั้งหมดที่ผู้ใช้เลือก
    if (!e.target.files || e.target.files.length === 0) {
      console.error("No files selected!"); //  แจ้งเตือนใน console ถ้าไม่มีไฟล์
      return;
    }
  
    const file = files[0]; //  ใช้ไฟล์แรกสำหรับ Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target.result); //  แสดง Preview ของรูป
    };
    reader.readAsDataURL(file); //  แปลงเป็น Base64 เพื่อแสดงใน UI
  
    setSelectedImages(files); //  เก็บไฟล์ทั้งหมดเพื่ออัปโหลดไป Firebase
  };
  
  const generateTimeOptions = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const formattedTime = i.toString().padStart(2, '0') + ":00"; // แปลงเป็น 00:00, 01:00, ..., 23:00
      return <option key={i} value={i}>{formattedTime}</option>;
    });
  };
  

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

  const handleSubmit = async (e) => {
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
    if (selectedImages.length === 0) {  // ตรวจสอบว่ามีไฟล์ก่อนอัปโหลด
      Swal.fire({ title: 'Error!', text: 'Please select at least one image.', icon: 'error' });
      return;
    }
    const bookingSlotMap = {
      'Hourly': 60,
    };
    if (formData.startTime === '' || formData.endTime === '') {
      Swal.fire({ title: 'Error!', text: 'Please select start and end time.', icon: 'error' });
      return;
    }
    const startHour = Number(formData.startTime);
    const endHour = Number(formData.endTime);

    if (isNaN(startHour) || isNaN(endHour)) {
      Swal.fire({ title: 'Error!', text: 'Invalid time format.', icon: 'error' });
      return;
    }

    // สร้าง Date Object อย่างถูกต้อง
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);
    startDate.setHours(startHour, 0, 0, 0);
    endDate.setHours(endHour, 0, 0, 0);

    // console.log("Start Date:", startDate); //debug timestamp
    // console.log("End Date:", endDate);

    // ตรวจสอบว่า startDate และ endDate เป็น Date จริง
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("Invalid Date object");
      return;
    }

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    try {
      const imageURLs = await uploadImagesToFirebase(selectedImages);
      const courtId = doc(collection(db, "Court")).id;

      const docRef = await addDoc(collection(db, "Court"), {
        address: formData.address,
        bookingslot: bookingSlotMap[formData.bookingSlots] || 60,
        court_type: formData.type,
        field: fieldName,
        priceslot: Number(formData.price),
        user_id: userId,
        capacity: Number(formData.capacity),
        court_id: courtId,
        image: imageURLs
      });

      // ตรวจสอบค่าก่อนแปลง
      console.log("Form Data - Available Days:", formData.availableDays);

      // แปลงวันที่ให้เป็น boolean
      const availableDays = {
        Mon: formData.availableDays.Mon || false,
        Tue: formData.availableDays.Tue || false,
        Wed: formData.availableDays.Wed || false,
        Thu: formData.availableDays.Thu || false,
        Fri: formData.availableDays.Fri || false,
        Sat: formData.availableDays.Sat || false,
        Sun: formData.availableDays.Sun || false
      };
      console.log("Converted Available Days:", availableDays);

      const timeslotRef = await addDoc(collection(db, "Timeslot"), {
        available: Boolean(true),
        court_id: courtId,
        availableDays: availableDays,
        time_start: startTimestamp,
        time_end: endTimestamp
      });
      console.log("Timeslot added with ID: ", timeslotRef.id);
      Swal.fire({
        title: 'Success!',
        text: 'Court has been added successfully',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#A2F193'
      }).then(() => {
        onBack();
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to add court. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#A2F193'
      });
    }
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
                <option value="">Please Create a New Field</option>
                {existingFields.map((field, index) => (
                  <option key={index} value={field}>{field}</option>
                ))}
                <option value="new">Create New Field</option>
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
                <option value="Swimming">Swimming</option>
                <option value="Yoga">Yoga</option>
                <option value="Ping Pong">Ping Pong</option>
                <option value="Boxing">Boxing</option>
                <option value="Aerobic">Aerobic</option>
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
                    onChange={handleInputChange}>
                    <option value="">Select Start Time</option>
                    {generateTimeOptions()}
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
                    onChange={handleInputChange}>
                    <option value="">Select End Time</option>
                    {generateTimeOptions()}
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
                    <option value="">Select booking Slot</option>
                    <option value="Hourly">Hourly</option>
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
          
          {/* <div className="text-normal upload-label">
            <span className="regular">(Up to 7 pictures)</span>
          </div> */}
          
          <div className="image">
            <div className="rectangle-152">
              <input 
                type="file" 
                id="court-image" 
                multiple 
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