import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetAdminPassword } from '../services/api';

export default function ResetPassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    const res = resetAdminPassword(oldPassword, newPassword);
    setStatus({ ok: res.success, msg: res.success ? 'Password updated successfully' : res.error });
    if (res.success) {
      setTimeout(() => navigate('/admin'), 800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Reset Password</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Old password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <button type="submit" className="w-full bg-black text-white px-4 py-2 rounded">Update password</button>
        </form>
        {status && (
          <div className={status.ok ? 'text-green-600' : 'text-red-600'}>{status.msg}</div>
        )}
      </div>
    </div>
  );
}
