import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSignups, adminLogin, isAdminLoggedIn, adminLogout } from '../services/api';

function Admin() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  const [signups, setSignups] = useState([]);
  const [filteredSignups, setFilteredSignups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAdminLoggedIn()) {
      setIsLoggedIn(true);
      fetchSignups();
    }
  }, []);

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
                placeholder="admin@drumlatch.com"
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
          </form>
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
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition"
          >
            Logout
          </button>
        </div>

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
