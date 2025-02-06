import React, { useState } from "react";
import "./RegisterPage.css";
import logo from "./images/logo.png"; // แทรกรูปโลโก้ของคุณ

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="register-container">
      <div className="register-box">
        <h1 className="register-title">Sign Up</h1>

        <form className="register-form">
          {/* Email */}
          <div className="input-group">
            {/*<span className="icon">📧</span>*/}
            <input type="email" placeholder="E-mail:" required />
          </div>

          {/* Password */}
          <div className="input-group">
            {/*<span className="icon">🔒</span>*/}
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password:"
              required
            />
            {/*
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁️
            </span>
            */}
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            {/*<span className="icon">🔒</span>*/}
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password:"
              required
            />
            
            {/*
            <span
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              👁️
            </span>
            */}
            
          </div>

          {/* Name */}
          <div className="input-group">
            <input type="text" placeholder="Name:" required />
          </div>

          {/* Surname */}
          <div className="input-group">
            <input type="text" placeholder="Surname:" required />
          </div>

          {/* Register Button */}
          <button type="submit" className="register-button">
            Sign up as an owner
          </button>
        </form>

        {/* Already have an account */}
        <p className="signin-text">
          Already had an account? <span className="signin-link">Sign in</span>
        </p>
      </div>

      {/* Logo */}
      <img src={logo} alt="CourtConnect Logo" className="register-logo" />
    </div>
  );
};

export default Register;
