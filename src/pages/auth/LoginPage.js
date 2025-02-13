import React, { useState } from "react";
import './Login.css';  
import logo from './images/logo.png';
import backgroundimage from './images/newbg3.png';
import { FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateField = (name, value) => {
    let error = "";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!value) {
      error = name === "email" ? "Please enter your email" : "Please enter your password";
    } else if (name === "email" && !emailRegex.test(value)) {
      error = "Email or Password is incorrect";
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (submitted) validateField(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    validateField("email", formData.email);
    validateField("password", formData.password);

    if (!errors.email && !errors.password && formData.email && formData.password) {
      alert("Email or Password is incorrect");
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-sidebar">
        <img src={logo} alt="Logo" className="login-logo" />

        <form onSubmit={handleSubmit} noValidate>
          <div className="login-input-email">
            <FaEnvelope className="login-icon" />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="login-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          {errors.email && <p className="login-error-text">{errors.email}</p>}

          <div className="login-input-password">
            <FaLock className="login-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              className="login-input"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span className="login-toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.password && <p className="login-error-text">{errors.password}</p>}

          <button 
            type="submit"
            className="login-sign-in-button"
          >
            Sign In
          </button>
        </form>

        <p className="login-forgot-password">Forgot your password?</p>
        <p className="login-create-account">
          New to CourtConnect? <span className="login-create-account-link">Create an account here!</span>
        </p>
      </div>

      <div className="login-main-section">
        <img src={backgroundimage} alt="bg" className="login-background-image" />
      </div>
    </div>
  );
};

export default Login;
