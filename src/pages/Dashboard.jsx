import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [editId, setEditId] = useState(null);
  const user = auth.currentUser;

  // 🔹 Fetch transactions in real-time
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(data);
      setFilteredData(data);
    });
    return unsubscribe;
  }, [user]);

  // 🔹 Add or Update transaction
  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!category || !amount) return alert("Please fill all fields");

    try {
      if (editId) {
        // ✅ Update existing transaction
        const ref = doc(db, "users", user.uid, "transactions", editId);
        await updateDoc(ref, {
          type,
          category,
          amount: Number(amount),
        });
        setEditId(null);
      } else {
        // ✅ Add new transaction
        await addDoc(collection(db, "users", user.uid, "transactions"), {
          type,
          category,
          amount: Number(amount),
          date: new Date().toISOString(),
        });
      }
      setCategory("");
      setAmount("");
    } catch (err) {
      alert(err.message);
    }
  };

  // 🔹 Start editing
  const handleEdit = (tx) => {
    setEditId(tx.id);
    setType(tx.type);
    setCategory(tx.category);
    setAmount(tx.amount);
  };

  // 🔹 Delete transaction
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await deleteDoc(doc(db, "users", user.uid, "transactions", id));
  };

  // 🔹 Apply filters
  const handleApplyFilter = () => {
    let filtered = [...transactions];
    if (selectedMonth) {
      filtered = filtered.filter(
        (tx) => new Date(tx.date).getMonth() + 1 === Number(selectedMonth)
      );
    }
    if (selectedYear) {
      filtered = filtered.filter(
        (tx) => new Date(tx.date).getFullYear() === Number(selectedYear)
      );
    }
    setFilteredData(filtered);
  };

  // 🔹 Clear filters
  const handleClearFilter = () => {
    setSelectedMonth("");
    setSelectedYear("");
    setFilteredData(transactions);
  };

  // 🔹 Totals
  const totalIncome = filteredData
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = filteredData
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const remaining = totalIncome - totalExpense;

  // 🔹 Chart Data
  const expenseData = filteredData.filter((tx) => tx.type === "expense");
  const incomeData = filteredData.filter((tx) => tx.type === "income");

  const expenseChartData = Object.values(
    expenseData.reduce((acc, tx) => {
      if (!acc[tx.category]) acc[tx.category] = { name: tx.category, value: 0 };
      acc[tx.category].value += tx.amount;
      return acc;
    }, {})
  );

  const incomeChartData = Object.values(
    incomeData.reduce((acc, tx) => {
      if (!acc[tx.category]) acc[tx.category] = { name: tx.category, value: 0 };
      acc[tx.category].value += tx.amount;
      return acc;
    }, {})
  );

  // 🔹 Helper: Year options (only current & past)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= currentYear - 3; y--) {
    years.push(y);
  }

  // 🔹 Months
  const months = [
    { num: 1, name: "January" },
    { num: 2, name: "February" },
    { num: 3, name: "March" },
    { num: 4, name: "April" },
    { num: 5, name: "May" },
    { num: 6, name: "June" },
    { num: 7, name: "July" },
    { num: 8, name: "August" },
    { num: 9, name: "September" },
    { num: 10, name: "October" },
    { num: 11, name: "November" },
    { num: 12, name: "December" },
  ];

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="dashboard" style={styles.dashboard}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Finance Dashboard</h1>
            <p style={styles.subtitle}>Welcome back, {user?.email}</p>
          </div>
          <button style={styles.logoutBtn} onClick={() => signOut(auth)}>
            <span>Logout</span>
            <svg style={styles.logoutIcon} viewBox="0 0 24 24" fill="none">
              <path d="M17 16L21 12M21 12L17 8M21 12H9M9 6H7C5.89543 6 5 6.89543 5 8V16C5 17.1046 5.89543 18 7 18H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.cardHeader}>
            <div style={{...styles.cardIcon, backgroundColor: '#dbeafe'}}>
              <svg viewBox="0 0 24 24" fill="none" style={styles.icon}>
                <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={styles.cardLabel}>Total Income</span>
          </div>
          <div style={styles.cardAmount}>₹{totalIncome.toLocaleString()}</div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.cardHeader}>
            <div style={{...styles.cardIcon, backgroundColor: '#fef3c7'}}>
              <svg viewBox="0 0 24 24" fill="none" style={styles.icon}>
                <path d="M12 2V22M7 5H14.5C15.4283 5 16.3185 5.36875 16.9749 6.02513C17.6313 6.6815 18 7.57174 18 8.5C18 9.42826 17.6313 10.3185 16.9749 10.9749C16.3185 11.6313 15.4283 12 14.5 12H9.5C8.57174 12 7.6815 12.3687 7.02513 13.0251C6.36875 13.6815 6 14.5717 6 15.5C6 16.4283 6.36875 17.3185 7.02513 17.9749C7.6815 18.6313 8.57174 19 9.5 19H18" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={styles.cardLabel}>Total Expense</span>
          </div>
          <div style={styles.cardAmount}>₹{totalExpense.toLocaleString()}</div>
        </div>

        <div style={{
          ...styles.summaryCard,
          ...(remaining < 0 ? styles.negativeCard : styles.positiveCard)
        }}>
          <div style={styles.cardHeader}>
            <div style={{
              ...styles.cardIcon, 
              backgroundColor: remaining < 0 ? '#fef2f2' : '#f0fdf4'
            }}>
              <svg viewBox="0 0 24 24" fill="none" style={styles.icon}>
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                  stroke={remaining < 0 ? '#ef4444' : '#10b981'} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span style={styles.cardLabel}>Remaining Balance</span>
          </div>
          <div style={styles.cardAmount}>₹{remaining.toLocaleString()}</div>
        </div>
      </div>

      {remaining < 0 && (
        <div style={styles.alert}>
          <div style={styles.alertIcon}>⚠️</div>
          <div>
            <div style={styles.alertTitle}>Budget Alert</div>
            <div style={styles.alertMessage}>You've spent more than your income this period</div>
          </div>
        </div>
      )}

      <div style={styles.contentGrid}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Transaction Form */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              {editId ? 'Edit Transaction' : 'Add Transaction'}
            </h3>
            <form onSubmit={handleAddOrUpdate} style={styles.form}>
              <div style={styles.formGrid}>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  style={styles.select}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>

                <input
                  type="text"
                  placeholder="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={styles.input}
                />

                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formActions}>
                <button type="submit" style={styles.primaryBtn}>
                  {editId ? 'Update' : 'Add Transaction'}
                </button>
                {editId && (
                  <button 
                    type="button" 
                    onClick={() => setEditId(null)}
                    style={styles.secondaryBtn}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Transactions List - SCROLLABLE SECTION */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                Recent Transactions ({filteredData.length})
              </h3>
              <div style={styles.filterControls}>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="">All Months</option>
                  {months.map((m) => (
                    <option key={m.num} value={m.num}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="">All Years</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <button onClick={handleApplyFilter} style={styles.filterBtn}>
                  Apply
                </button>
                <button onClick={handleClearFilter} style={styles.secondaryBtn}>
                  Clear
                </button>
              </div>
            </div>

            {/* Scrollable Transactions Container */}
            <div style={styles.transactionsContainer}>
              <div style={styles.transactions}>
                {filteredData.map((tx) => (
                  <div key={tx.id} style={styles.transaction}>
                    <div style={styles.transactionMain}>
                      <div style={styles.transactionCategory}>{tx.category}</div>
                      <div style={{
                        ...styles.transactionAmount,
                        color: tx.type === 'income' ? '#10b981' : '#ef4444'
                      }}>
                        ₹{tx.amount.toLocaleString()}
                      </div>
                    </div>
                    <div style={styles.transactionMeta}>
                      <span style={styles.transactionType}>{tx.type}</span>
                      <div style={styles.transactionActions}>
                        <button 
                          onClick={() => handleEdit(tx)}
                          style={styles.actionBtn}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(tx.id)}
                          style={{...styles.actionBtn, ...styles.deleteBtn}}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredData.length === 0 && (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>💸</div>
                    <div style={styles.emptyText}>No transactions found</div>
                    <div style={styles.emptySubtext}>Add a transaction to get started</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Charts */}
        <div style={styles.rightColumn}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Expense Analysis</h3>
            <div style={styles.chart}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {expenseChartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Income Overview</h3>
            <div style={styles.chart}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  dashboard: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '32px',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    padding: '10px 16px',
    borderRadius: '8px',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  logoutIcon: {
    width: '16px',
    height: '16px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
    maxWidth: '1200px',
    margin: '0 auto 24px auto',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #f1f5f9',
  },
  positiveCard: {
    borderLeft: '4px solid #10b981',
  },
  negativeCard: {
    borderLeft: '4px solid #ef4444',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  cardIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: '24px',
    height: '24px',
  },
  cardLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  cardAmount: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#fef3f2',
    border: '1px solid #fed7d7',
    padding: '16px 20px',
    borderRadius: '8px',
    marginBottom: '24px',
    maxWidth: '1200px',
    margin: '0 auto 24px auto',
  },
  alertIcon: {
    fontSize: '20px',
  },
  alertTitle: {
    fontWeight: '600',
    color: '#dc2626',
    fontSize: '14px',
  },
  alertMessage: {
    color: '#991b1b',
    fontSize: '14px',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #f1f5f9',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
  },
  input: {
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterControls: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    backgroundColor: 'white',
  },
  filterBtn: {
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  // NEW: Scrollable transactions container
  transactionsContainer: {
    maxHeight: '500px', // Fixed height for scrollable area
    overflowY: 'auto',
    border: '1px solid #f1f5f9',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  transactions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '4px',
  },
  transaction: {
    padding: '16px',
    border: '1px solid #f1f5f9',
    borderRadius: '8px',
    backgroundColor: 'white',
    transition: 'background-color 0.2s',
  },
  transactionMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  transactionCategory: {
    fontWeight: '500',
    color: '#1e293b',
  },
  transactionAmount: {
    fontWeight: '600',
    fontSize: '16px',
  },
  transactionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionType: {
    fontSize: '12px',
    color: '#64748b',
    textTransform: 'capitalize',
    padding: '4px 8px',
    backgroundColor: '#f8fafc',
    borderRadius: '4px',
  },
  transactionActions: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteBtn: {
    color: '#ef4444',
    borderColor: '#fecaca',
  },
  // Empty state styles
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#64748b',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '500',
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#94a3b8',
  },
  chart: {
    marginTop: '16px',
  },
};