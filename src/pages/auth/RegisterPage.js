import React, { useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import "./RegisterPage.css";
import logo from "./images/logo.png";
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Register = () => {
  const navigate = useNavigate();
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
  const [loading, setLoading] = useState(false);

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

  // Function to generate next user ID
  const generateNextUserId = async () => {
    try {
      // Query to get the latest user_id
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("user_id", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      
      let nextId = "USR0001"; // Default first ID
      
      if (!querySnapshot.empty) {
        // Get the latest user_id
        const latestUser = querySnapshot.docs[0].data();
        const latestId = latestUser.user_id;
        
        // Extract the number part and increment
        const num = parseInt(latestId.substring(3)) + 1;
        nextId = `USR${num.toString().padStart(4, '0')}`;
      }
      
      return nextId;
    } catch (error) {
      console.error("Error generating user ID:", error);
      throw error;
    }
  };

  // Function to generate next wallet ID
  const generateNextWalletId = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("wallet_id", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      let nextWalletId = "w001"; // ค่าเริ่มต้น

      if (!querySnapshot.empty) {
        const latestUser = querySnapshot.docs[0].data();
        const latestWalletId = latestUser.wallet_id;

        // แปลงตัวเลขท้าย wallet_id แล้วเพิ่มค่า +1
        const num = parseInt(latestWalletId.substring(1)) + 1;
        nextWalletId = `w${num.toString().padStart(3, "0")}`;
      }

      return nextWalletId;
    } catch (error) {
      console.error("Error generating wallet ID:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      // Generate next user ID and wallet ID
      const nextUserId = await generateNextUserId();
      const nextWalletId = await generateNextWalletId();
      
      // Create user authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Current timestamp
      const currentTimestamp = new Date();

      // Create user document
      await setDoc(doc(db, "users", user.uid), {
        user_id: nextUserId,
        wallet_id: nextWalletId,
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        createdAt: currentTimestamp,
      });

      // Create wallet document
      await setDoc(doc(db, "Wallet", nextWalletId), {
        amount: 0,
        balance: 0,
        create_at: currentTimestamp,
        status: "tranfer_in",
        user_id: nextUserId,
        wallet_id: nextWalletId
      });

      Swal.fire({
        icon: "success",
        title: "Registration Successful!",
        text: "You have successfully signed up.",
        confirmButtonText: "OK",
      }).then(() => {
        window.location.href = "/login";
      });

      setFormData({ email: "", password: "", confirmPassword: "", name: "", surname: "" });
    } catch (error) {
      console.error("Error occurred:", error);

      if (error.code === "auth/email-already-in-use") {
        Swal.fire({
          icon: "error",
          title: "Email Already in Use",
          text: "This email is already registered. Please use a different email or login.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: error.message,
        });
      }
    }
    setLoading(false);
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
              placeholder="E-mail"
              value={formData.email}
              onChange={handleChange}
              onKeyDown={(e) => e.key === " " && e.preventDefault()}
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
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onCopy={(e) => e.preventDefault()}
              onKeyDown={(e) => e.key === " " && e.preventDefault()}
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
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onKeyDown={(e) => e.key === " " && e.preventDefault()}
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
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              onKeyDown={(e) => e.key === " " && e.preventDefault()}
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
              placeholder="Surname"
              value={formData.surname}
              onChange={handleChange}
              onKeyDown={(e) => e.key === " " && e.preventDefault()}
              required
            />
          </div>
          {errors.surname && <p className="error-text">{errors.surname}</p>}

          {/* Register Button */}
          <button type="submit" className="register-button" disabled={!isFormValid || loading}>
            {loading ? "Registering..." : "Sign up as an owner"}
          </button>
        </form>

        <p className="signin-text">
          Already had an account?{" "}
          <span className="signin-link" onClick={() => navigate("/login")}>
            Sign in
          </span>
        </p>
      </div>
      <img src={logo} alt="CourtConnect Logo" className="register-logo" />
    </div>
  );
};

export default Register;