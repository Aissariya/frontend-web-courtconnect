import { useState } from "react";
import { auth } from "../../firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import "./ForgotPasswordPage.css"; 
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi"; // ไอคอนย้อนกลับ
import { MdFingerprint } from "react-icons/md"; // ไอคอนลายนิ้วมือ

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Check your email for reset instructions.");
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <MdFingerprint className="fingerprint-icon" />
        <h2>Forgot Password?</h2>
        <p>No worries, We’ll send you reset instructions.</p>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleResetPassword}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Reset Password</button>
        </form>

        <Link to="/login" className="back-to-signin">
          <FiArrowLeft className="back-icon" /> Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;