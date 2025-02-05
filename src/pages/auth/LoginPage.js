import React from "react";
import './Login.css';  // Assuming the CSS is in the same directory
import logo from './images/logo.png';
import backgroundimage from './images/field.jpg';

const Login = () => {
  return (
    <div className="login-container">
      {/* Sidebar (Left) */}
      <div className="sidebar">
        <img src={logo} alt="Logo" className="logo" />
        <input
          type="email"
          placeholder="Enter your email"
          className="input"
        />
        <input
          type="password"
          placeholder="Enter your password"
          className="input"
        />
        <button className="sign-in-button">
          Sign In
        </button>
        <p className="forgot-password">Forgot your password?</p>
        <p className="create-account">
          new to CourtConnect?{" "}
          <span className="create-account-link">
            create an account here!
          </span>
        </p>
      </div>

      {/* Main Section (Right) */}
      <div className="main-section">
        <img
          src={backgroundimage}
          alt="bg"
          className="backgroundimage"
        />
         {/*
        <div className="overlay">
         <h1 className="title">COURTCONNECT</h1>
        </div>
         */}
      </div>

    </div>
  );
};

export default Login;