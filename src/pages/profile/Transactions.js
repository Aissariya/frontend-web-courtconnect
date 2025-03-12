import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import './Profile.css';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';

const Transactions = () => {
  // State for transactions data
  const [transactions, setTransactions] = useState([]);
  
  // State for wallet ID
  const [walletId, setWalletId] = useState(null);
  
  // State for balance
  const [totalBalance, setTotalBalance] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // เพิ่มจำนวนรายการต่อหน้าเป็น 10
  const [totalItems, setTotalItems] = useState(0);
  
  // Firebase instances
  const auth = getAuth();
  const db = getFirestore();
  
  // Fetch wallet ID for current user
  useEffect(() => {
    const fetchWalletId = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        
        // Get the user document from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          throw new Error('User profile not found');
        }
        
        // Get the wallet ID directly from the user document
        const userData = userDoc.data();
        if (userData.wallet_id) {
          setWalletId(userData.wallet_id);
          console.log('Wallet ID retrieved:', userData.wallet_id);
        } else {
          throw new Error('No wallet found for this user');
        }
      } catch (err) {
        console.error('Error fetching wallet ID:', err);
      }
    };
    
    fetchWalletId();
  }, [auth, db]);
  
  // Fetch transactions data when wallet ID is available
  useEffect(() => {
    if (!walletId) return;
    
    const fetchTransactions = async () => {
      try {
        console.log('Fetching transactions for wallet:', walletId);
        
        // Query the transactions collection
        const transactionsRef = collection(db, 'Wallet');
        
        // ดึงเอกสารทั้งหมดในคอลเลกชัน Wallet
        const querySnapshot = await getDocs(transactionsRef);
        
        if (querySnapshot.empty) {
          console.log('No transactions found');
          setTransactions([]);
          setTotalBalance(0);
          return;
        }
        
        // จัดเก็บข้อมูลธุรกรรมทั้งหมดที่มี wallet_id ตรงกับผู้ใช้
        let walletTransactions = [];
        
        // วนลูปตรวจสอบแต่ละเอกสาร
        querySnapshot.forEach((docSnap) => {
          const docData = docSnap.data();
          
          // ตรวจสอบว่าเอกสารนี้เป็นของ wallet_id ที่ต้องการหรือไม่
          if (docData.wallet_id === walletId) {
            console.log('Found transaction for wallet:', docData);
            
            // แปลงค่า amount เป็นตัวเลข
            const amountValue = typeof docData.amount === 'string' 
              ? parseFloat(docData.amount) 
              : (typeof docData.amount === 'number' ? docData.amount : 0);
            
            // กำหนด source ตาม status
            const source = docData.status === 'tranfer_in' ? 'Booking Request' : 'Refund Request';
            
            // สร้างข้อมูลธุรกรรมสำหรับแสดงผล
            const transactionData = {
              id: docSnap.id,
              source: source,
              date: docData.create_at ? new Date(docData.create_at.toDate()).toLocaleString() : '-',
              amount: amountValue,
              status: docData.status || '-',
              createDate: docData.create_at ? new Date(docData.create_at.toDate()) : new Date(0) // เก็บวันที่สำหรับเรียงลำดับ
            };
            
            walletTransactions.push(transactionData);
          }
        });
        
        // เรียงลำดับตามวันที่เก่าไปใหม่ เพื่อคำนวณยอดคงเหลือตามลำดับเวลา
        walletTransactions.sort((a, b) => a.createDate - b.createDate);
        
        console.log('Sorted transactions:', walletTransactions);
        
        // คำนวณยอดคงเหลือสะสม
        let runningBalance = 0;
        for (let i = 0; i < walletTransactions.length; i++) {
          const transaction = walletTransactions[i];
          
          if (transaction.status === 'tranfer_in') {
            runningBalance += transaction.amount;
          } else if (transaction.status === 'tranfer_out') {
            runningBalance -= transaction.amount;
          }
          
          // เก็บยอดคงเหลือสะสมในแต่ละรายการ
          transaction.runningBalance = runningBalance;
          
          // อัพเดทค่า balance ในฐานข้อมูล Firebase ให้เป็นยอดคงเหลือสะสม
          const docRef = doc(transactionsRef, transaction.id);
          
          console.log(`Updating transaction ${transaction.id} with running balance ${runningBalance}`);
          updateDoc(docRef, {
            balance: runningBalance
          });
        }
        
        // เรียงลำดับใหม่ตามวันที่ล่าสุดก่อน สำหรับการแสดงผล
        walletTransactions.sort((a, b) => b.createDate - a.createDate);
        
        console.log('Final transactions data with running balance:', walletTransactions);
        console.log('Final balance:', runningBalance);
        
        setTotalItems(walletTransactions.length);
        setTotalBalance(runningBalance);
        
        // คำนวณข้อมูลที่จะแสดงในหน้าปัจจุบัน
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = walletTransactions.slice(indexOfFirstItem, indexOfLastItem);
        
        setTransactions(currentItems);
        
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setTransactions([]);
        setTotalBalance(0);
      }
    };
    
    fetchTransactions();
  }, [db, walletId, currentPage, itemsPerPage]);

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generate pagination links
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = [];
  
  // Show limited page numbers
  const maxDisplayedPages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
  let endPage = Math.min(totalPages, startPage + maxDisplayedPages - 1);
  
  if (endPage - startPage + 1 < maxDisplayedPages && startPage > 1) {
    startPage = Math.max(1, endPage - maxDisplayedPages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="profile-section transactions-section">
      <div className="profile-header">
        <div className="profile-icon-small">
          <CreditCard size={24} color="#6b7280" />
        </div>
        <span>Transactions</span>
      </div>

      <div className="transactions-grid">
        {/* Total Balance Card */}
        <div className="transactions-card balance-card">
          <div className="total-balance-label">Total Balance</div>
          <div className="total-balance-amount">฿{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>

        {/* Transactions List */}
        <div className="transactions-card transactions-list">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Datetime</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <div className="transaction-user">
                        <span>{transaction.source}</span>
                      </div>
                    </td>
                    <td>{transaction.date}</td>
                    <td className={transaction.status === 'tranfer_in' ? 'amount-positive' : 'amount-negative'}>
                      {transaction.status === 'tranfer_in' ? '+' : '-'}฿{transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <div className="balance-info">Balance: ฿{transaction.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="no-transactions">No transaction</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalItems > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {transactions.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} from {totalItems} data
              </div>
              <div className="pagination-controls">
                <button 
                  className="pagination-arrow"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  &lt;
                </button>
                
                {pageNumbers.map(number => (
                  <button
                    key={number}
                    className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                    onClick={() => handlePageChange(number)}
                  >
                    {number}
                  </button>
                ))}
                
                <button 
                  className="pagination-arrow"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;