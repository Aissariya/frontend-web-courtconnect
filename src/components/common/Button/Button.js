import React from 'react';

// สร้าง Button Component ที่ปรับแต่งได้ผ่าน props
function Button({ label, onClick, type = "button", style = {} }) {
  return (
    <button 
      type={type} 
      onClick={onClick} 
      style={{
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        ...style // สามารถเพิ่มสไตล์เพิ่มเติมผ่าน props
      }}
    >
      {label} {/* แสดงข้อความที่ส่งผ่าน props */}
    </button>
  );
}

export default Button;
