import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSignups, adminLogin, isAdminLoggedIn, adminLogout, sendBroadcast, resetAdminPassword } from '../services/api';

function Admin() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  // Reset password UI state
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  
  const [signups, setSignups] = useState([]);
  const [filteredSignups, setFilteredSignups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Email broadcast states
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailFrom, setEmailFrom] = useState('updates@drumlatch.co');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (isAdminLoggedIn()) {
      setIsLoggedIn(true);
      fetchSignups();
    }
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    if (showEmailComposer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = original || 'auto';
    }
    return () => {
      document.body.style.overflow = original || 'auto';
    };
  }, [showEmailComposer]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = signups.filter(signup =>
        signup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        signup.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSignups(filtered);
    } else {
      setFilteredSignups(signups);
    }
  }, [searchTerm, signups]);

  const handleLogin = (e) => {
    e.preventDefault();
    const result = adminLogin(email, password);
    if (result.success) {
      setIsLoggedIn(true);
      setLoginError(false);
      fetchSignups();
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (newPwd !== confirmPwd) {
      setResetError('New password and confirm password do not match');
      return;
    }
    setResetting(true);
    const res = resetAdminPassword(oldPwd, newPwd);
    if (res.success) {
      setResetSuccess('Password updated successfully. Use the new password to sign in.');
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setShowResetPassword(false);
    } else {
      setResetError(res.error || 'Failed to reset password');
    }
    setResetting(false);
  };

  const fetchSignups = async () => {
    setLoading(true);
    setError('');
    const result = await getSignups();
    if (result.success) {
      setSignups(result.data);
      setFilteredSignups(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const getLocation = (signup) => {
    if (signup.city || signup.region || signup.country) {
      const parts = [signup.city, signup.region, signup.country].filter(Boolean);
      return parts.join(', ');
    }
    return 'N/A';
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Demo Request', 'IP Address', 'Location', 'Signup Date'];
    const rows = filteredSignups.map(signup => [
      signup.name,
      signup.email,
      signup.demo_request ? 'Yes' : 'No',
      signup.ip || 'N/A',
      getLocation(signup),
      new Date(signup.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drumlatch-signups-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getTodayCount = () => {
    const today = new Date().toDateString();
    return signups.filter(s => new Date(s.created_at).toDateString() === today).length;
  };

  const getWeekCount = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return signups.filter(s => new Date(s.created_at) >= weekAgo).length;
  };

  const handleSendBroadcast = async () => {
    if (!emailSubject || !emailMessage) {
      setEmailError('Subject and message are required');
      return;
    }

    try {
      setSendingEmail(true);
      setEmailError('');
      setEmailSuccess('');

      const result = await sendBroadcast(emailSubject, emailMessage, emailFrom);
      
      if (result.success) {
        const count = result.data?.recipientCount || result.recipientCount || signups.length;
        setEmailSuccess(`Email sent successfully to ${count} recipients!`);
        setEmailSubject('');
        setEmailMessage('');
        setTimeout(() => {
          setEmailSuccess('');
          setShowEmailComposer(false);
        }, 3000);
      } else {
        const errorMsg = result.error || result.details || 'Failed to send email';
        console.error('❌ Broadcast error:', errorMsg);
        setEmailError(errorMsg);
      }
    } catch (err) {
      console.error('❌ Unexpected broadcast error:', err);
      setEmailError(err.message || 'Unexpected error');
    } finally {
      setSendingEmail(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-900">
        <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold header-font mb-2 text-white">DrumLatch Admin</h1>
            <p className="text-gray-400">Sign in to access dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input 
                type="email" 
                id="loginEmail" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input 
                type="password" 
                id="loginPassword" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>

            {loginError && (
              <div className="mb-4 bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
                Invalid email or password
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
            >
              Sign In
            </button>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="text-sm text-blue-400 hover:text-blue-300">
                {showResetPassword ? 'Hide Reset Password' : 'Reset Password'}
              </button>
              <div className="mt-2">
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-gray-300 hover:text-white underline">
                  Forgot Password?
                </button>
              </div>
            </div>
          </form>
          {showResetPassword && (
            <div className="mt-6 bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Reset Password</h3>
              {resetSuccess && (
                <div className="mb-4 bg-green-900/20 border border-green-500 rounded-lg p-3 text-green-400 text-sm">{resetSuccess}</div>
              )}
              {resetError && (
                <div className="mb-4 bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">{resetError}</div>
              )}
              <form onSubmit={handleResetPassword}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Old Password</label>
                  <input 
                    type="password"
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter old password"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <input 
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                  <input 
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={resetting}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition"
                >
                  {resetting ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold header-font mb-2">DrumLatch Admin Dashboard</h1>
            <p className="text-gray-400">Early Access Signups</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/reset-password')}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium transition"
            >
              Reset Password
            </button>
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition"
          >
            Logout
          </button>
          </div>
        </div>

        {/* Email Broadcast Button */}
        <div className="mb-6">
          <button 
            onClick={() => setShowEmailComposer(!showEmailComposer)}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            {showEmailComposer ? 'Hide Email Composer' : 'Send Broadcast Email'}
          </button>
        </div>

        {/* Email Composer */}
        {showEmailComposer && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
            <div className="relative bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
              <button
                aria-label="Close"
                onClick={() => setShowEmailComposer(false)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
              >✕</button>
              <h2 className="text-2xl font-bold mb-2">Compose Broadcast Email</h2>
              <p className="text-gray-400 mb-6">This email will be sent to all {signups.length} signups</p>

              {/* Sending overlay */}
              {sendingEmail && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg z-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
                  <span className="ml-3 text-purple-300">Sending...</span>
                </div>
              )}
            
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">From Email</label>
                <input 
                  type="email"
                  value={emailFrom}
                  onChange={(e) => setEmailFrom(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="onboarding@resend.dev"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <input 
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter email subject..."
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Message (HTML supported)</label>
                <textarea 
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows="8"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your message... You can use HTML tags like <strong>, <p>, <br>, etc."
                  required
                />
              </div>

              {emailSuccess && (
                <div className="mb-4 bg-green-900/20 border border-green-500 rounded-lg p-3 text-green-400">
                  {emailSuccess}
                </div>
              )}

              {emailError && (
                <div className="mb-4 bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400">
                  {emailError}
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={handleSendBroadcast}
                  disabled={sendingEmail}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-medium transition"
                >
                  {sendingEmail ? 'Sending...' : `Send to ${signups.length} Recipients`}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowEmailComposer(false)}
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total Signups</h3>
            <p className="text-3xl font-bold">{signups.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Today</h3>
            <p className="text-3xl font-bold">{getTodayCount()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">This Week</h3>
            <p className="text-3xl font-bold">{getWeekCount()}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={fetchSignups}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition"
          >
            Refresh
          </button>
          <button 
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium transition"
          >
            Export CSV
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">Loading signups...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">IP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Signup Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredSignups.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-gray-400">
                        No signups found.
                      </td>
                    </tr>
                  ) : (
                    filteredSignups.map((signup, index) => (
                      <tr key={signup.id} className="hover:bg-gray-700/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{signup.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{signup.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{getLocation(signup)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{signup.ip || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(signup.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
