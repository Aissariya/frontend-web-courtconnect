import React, { useState, useEffect } from "react";
import './Login.css';
import logo from './images/logo.png';
import backgroundimage from './images/newbg5.png';
import { FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { auth } from "../../firebaseConfig";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = () => {
      // First check localStorage
      if (localStorage.getItem('isLoggedIn') === 'true') {
        navigate('/dashboard');
        return;
      }

      // Then check with Firebase
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in
          localStorage.setItem('isLoggedIn', 'true');
          navigate('/dashboard');
        }
      });

      // Cleanup subscription
      return () => unsubscribe();
    };

    checkAuth();
  }, [navigate]);

  const validateField = (name, value) => {
    let error = "";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!value) {
      error = name === "email" ? "Please enter your email" : "Please enter your password";
    } else if (name === "email" && !emailRegex.test(value)) {
      error = "Email or Password is incorrect";
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
    return error; // Return error for immediate use
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (submitted) validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    // Validate Email and Password fields
    const emailError = validateField("email", formData.email);
    const passwordError = validateField("password", formData.password);

    if (emailError || passwordError || !formData.email || !formData.password) {
      return; // Stop if there are errors
    }

    setLoading(true); // Set loading state
    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Save authentication state to localStorage
      localStorage.setItem('isLoggedIn', 'true');
      // For session management
      sessionStorage.setItem('sessionActive', 'true');

      // Success alert with SweetAlert2
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Welcome back!",
        confirmButtonColor: "#3085d6",
      }).then(() => {
        // Use React Router navigate instead of window.location for better performance
        navigate("/dashboard");
      });

    } catch (error) {
      console.error("Login error:", error.code, error.message);
      
      // Show error notification
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Email or Password is incorrect",
        confirmButtonColor: "#d33",
      });
      
      // Clear localStorage in case of any previous login
      localStorage.removeItem('isLoggedIn');
    }
    setLoading(false); // End loading state
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
              onKeyDown={(e) => e.key === " " && e.preventDefault()}
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
              onKeyDown={(e) => e.key === " " && e.preventDefault()}
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
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p
          className="login-forgot-password"
          onClick={() => navigate("/forgotpassword")}
          style={{ cursor: "pointer" , fontWeight: "bold"}}
        >
          Forgot your password?
        </p>

        <p className="login-create-account">
          New to CourtConnect?{" "}
          <span
            className="login-create-account-link"
            onClick={() => navigate("/register")}
            style={{ cursor: "pointer" }}
          >
            Create an account here!
          </span>
        </p>

      </div>

      <div className="login-main-section">
        <img src={backgroundimage} alt="bg" className="login-background-image" />
      </div>
    </div>
  );
};

export default Login;