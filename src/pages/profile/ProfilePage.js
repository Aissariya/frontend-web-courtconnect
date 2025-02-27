import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import './Profile.css';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const Profile = () => {
  // State to store user profile data
  const [profileData, setProfileData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '-',
    profilePicture: null
  });
  
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true);
  
  // State for error handling
  const [error, setError] = useState(null);

  // Firebase instances
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  // Fetch user profile data from Firebase
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        
        // Ensure user is authenticated
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('User not authenticated');
        }

        // Get user document from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          throw new Error('User profile not found');
        }
        
        const userData = userDoc.data();
        
        // Use the fields from Firestore that match our original format
        setProfileData({
          name: userData.name || '',
          surname: userData.surname || '',
          email: userData.email || currentUser.email || '',
          phone: userData.phone || '-',
          profilePicture: userData.profilePicture || null
        });
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [auth, db]);

  // Handle profile picture change
  const handleChangePicture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Create a reference for the profile picture in Firebase Storage
      const profilePicRef = ref(storage, `profilePictures/${currentUser.uid}`);
      
      // Upload the file
      await uploadBytes(profilePicRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(profilePicRef);
      
      // Update user document with new profile picture URL
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        profilePicture: downloadURL
      });

      // Update state
      setProfileData(prev => ({
        ...prev,
        profilePicture: downloadURL
      }));

    } catch (err) {
      console.error('Error uploading profile picture:', err);
      alert('Failed to upload profile picture. Please try again.');
    }
  };

  // Handle profile picture deletion
  const handleDeletePicture = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Only attempt to delete from storage if there is an existing profile picture
      if (profileData.profilePicture) {
        // Create a reference to the file to delete
        const profilePicRef = ref(storage, `profilePictures/${currentUser.uid}`);
        await deleteObject(profilePicRef);
      }
      
      // Update user document to remove profile picture reference
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        profilePicture: null
      });

      // Update state
      setProfileData(prev => ({
        ...prev,
        profilePicture: null
      }));

    } catch (err) {
      console.error('Error deleting profile picture:', err);
      alert('Failed to delete profile picture. Please try again.');
    }
  };

  // Navigate to edit profile page
  const navigateToEditProfile = () => {
    window.location.href = '/edit-profile';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="profile-container">
        <div className="error-message">
          Error loading profile: {error}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-header">
          <div className="profile-icon-small"></div>
          <span>Profile</span>
        </div>

        <div className="profile-grid">
          {/* Profile Picture Section */}
          <div className="profile-card">
            <div 
              className="profile-picture" 
              style={profileData.profilePicture ? { backgroundImage: `url(${profileData.profilePicture})` } : {}}
            ></div>
            <div className="profile-name">{`${profileData.name} ${profileData.surname}`}</div>
            <div className="button-group">
              <button className="btn-secondary" onClick={handleDeletePicture}>Delete Picture</button>
              <label className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer' }}>
                Change Picture
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleChangePicture}
                />
              </label>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Personal Information</h2>
              <button className="edit-button" onClick={navigateToEditProfile}>
                <Pencil className="edit-icon" />
                <span>Edit</span>
              </button>
            </div>

            <div className="personal-info">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">First Name</div>
                  <div className="info-value">{profileData.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Last Name</div>
                  <div className="info-value">{profileData.surname}</div>
                </div>
              </div>

              <div className="info-item">
                <div className="info-label">Email Address</div>
                <div className="info-value">{profileData.email}</div>
              </div>

              <div className="info-item">
                <div className="info-label">Phone</div>
                <div className="info-value">{profileData.phone}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;