import React from 'react';
import { Pencil } from 'lucide-react';
import './Profile.css';

const Profile = () => {
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
            <div className="profile-picture"></div>
            <div className="profile-name">Krittin Wongchanloy</div>
            <div className="button-group">
              <button className="btn-secondary">Delete Picture</button>
              <button className="btn-primary">Change Picture</button>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Personal Information</h2>
              <button className="edit-button">
                <Pencil className="edit-icon" />
                <span>Edit</span>
              </button>
            </div>

            <div className="personal-info">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Firstname</div>
                  <div className="info-value">Krittin</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Lastname</div>
                  <div className="info-value">Wongchanloy</div>
                </div>
              </div>

              <div className="info-item">
                <div className="info-label">Email Address</div>
                <div className="info-value">kwongchanloy@ku.th</div>
              </div>

              <div className="info-item">
                <div className="info-label">Phone</div>
                <div className="info-value">-</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;