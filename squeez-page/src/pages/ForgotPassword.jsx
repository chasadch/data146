import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setStatus({ ok: false, msg: 'Email is required' });
      return;
    }
    setStatus({ ok: true, msg: 'If the email matches an account, a reset link has been sent.' });
    setTimeout(() => navigate('/reset-password'), 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Forgot Password</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <button type="submit" className="w-full bg-black text-white px-4 py-2 rounded">Send reset link</button>
        </form>
        {status && (
          <div className={status.ok ? 'text-green-600' : 'text-red-600'}>{status.msg}</div>
        )}
      </div>
    </div>
  );
}
