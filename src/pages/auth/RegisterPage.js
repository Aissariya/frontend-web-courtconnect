import React, { useState } from "react";
import "./RegisterPage.css";
import logo from "./images/logo.png"; 
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
{/*import { UserIcon, LockClosedIcon } from "@heroicons/react/outline";*/}


const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    surname: ""
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (name, value) => {
    let error = "";
    const emailRegex = /^[a-zA-Z0-9@.]+$/;
    const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+=-]+$/;
    const nameRegex = /^[A-Za-z\u0E00-\u0E7F]+$/;
    
    switch (name) {
      case "email":
        if (!emailRegex.test(value)) {
          error = "Email can only contain English letters, numbers, and special characters (@ .)";
        }
        break;
      case "password":
        if (!passwordRegex.test(value)) {
          error = "Password can only contain English letters, numbers, and special characters";
        } else if (value.length < 8 || !/[A-Z]/.test(value) || !/\d/.test(value)) {
          error = "Password must be at least 8 characters, include a number and an uppercase letter";
        }
        break;
      case "confirmPassword":
        if (value !== formData.password) {
          error = "Passwords do not match";
        }
        break;
      case "name":
        if (!value.trim()) {
          error = "Name is required";
        } else if (!nameRegex.test(value)) {
          error = "Name can only contain English and Thai characters";
        }
        break;
      case "surname":
        if (!value.trim()) {
          error = "Surname is required";
        } else if (!nameRegex.test(value)) {
          error = "Surname can only contain English and Thai characters";
        }
        break;
      default:
        break;
    }
    
    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const isFormValid = Object.values(errors).every((error) => error === "") &&
                       Object.values(formData).every((field) => field.trim() !== "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      console.log("Form submitted successfully", formData);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
      <h1 className="register-title" style={{ fontSize: "2rem" }}>Sign Up</h1>
        <form className="register-form" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="input-group">
            <FaEnvelope className="icon" />
            <input
              type="email"
              name="email"
              placeholder="E-mail:"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          {errors.email && <p className="error-text">{errors.email}</p>}

          {/* Password */}
          <div className="input-group">
            <FaLock className="icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password:"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.password && <p className="error-text">{errors.password}</p>}

          {/* Confirm Password */}
          <div className="input-group">
            <FaLock className="icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password:"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <span className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}

          {/* Name */}
          <div className="input-group">
            <FaUser className="icon" />
            <input
              type="text"
              name="name"
              placeholder="Name:"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          {errors.name && <p className="error-text">{errors.name}</p>}

          {/* Surname */}
          <div className="input-group">
            <FaUser className="icon" />
            <input
              type="text"
              name="surname"
              placeholder="Surname:"
              value={formData.surname}
              onChange={handleChange}
              required
            />
          </div>
          {errors.surname && <p className="error-text">{errors.surname}</p>}

          {/* Register Button */}
          <button type="submit" className="register-button" disabled={!isFormValid}>
            Sign up as an owner
          </button>
        </form>

        {/* Already have an account */}
        <p className="signin-text">
          Already had an account? <span className="signin-link">Sign in</span>
        </p>
      </div>
      <img src={logo} alt="CourtConnect Logo" className="register-logo" />
    </div>
  );
};

export default Register;
