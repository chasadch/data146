import { useState } from 'react';
import { submitSignup, resendWelcomeEmail } from '../services/api';

function Landing() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [demoRequest, setDemoRequest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [lastSignupEmail, setLastSignupEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowSuccess(false);
    setShowError(false);
    setEmailStatus(null);

    try {
      const result = await submitSignup(name, email, demoRequest);

      if (result.success) {
        setLastSignupEmail(email);
        if (result.emailStatus) {
          setEmailStatus(result.emailStatus);
        }
        setShowSuccess(true);
        setName('');
        setEmail('');
        setDemoRequest(false);
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }
    } catch (error) {
      console.error('Error:', error);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!lastSignupEmail) return;
    setResendLoading(true);
    setEmailStatus(null);
    setShowError(false);

    try {
      const result = await resendWelcomeEmail(lastSignupEmail);
      if (result.success) {
        setEmailStatus(result.emailStatus || { sent: true, error: null });
      } else {
        setEmailStatus({ sent: false, error: result.error || 'Failed to resend welcome email' });
        setShowError(true);
      }
    } catch (err) {
      console.error('Resend email handler error:', err);
      setEmailStatus({ sent: false, error: 'Unexpected error while resending email' });
      setShowError(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      {/* Background Blur */}
      <div className="flex justify-center">
        <div className="background-blur bg-white/30 absolute"></div>
      </div>

      {/* Logo Section */}
      <div className="logo-section">
        <img className="drumLogo1" src="/image/logo.svg" alt="DrumLatch" />
        <img className="drumLogo2" src="/image/Logo2.svg" alt="DrumLatch" />
      </div>

      {/* Main Content */}
      <div className="main-container">
        <svg className="z-[-2] lock" width="222" height="278" viewBox="0 0 222 278" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_d_77_788)">
            <path d="M158.143 168C163.144 168 167.94 169.981 171.477 173.506C175.013 177.032 177 181.814 177 186.8V243.2C177 248.186 175.013 252.968 171.477 256.494C167.94 260.019 163.144 262 158.143 262H63.8571C58.8559 262 54.0595 260.019 50.5231 256.494C46.9867 252.968 45 248.186 45 243.2V186.8C45 181.814 46.9867 177.032 50.5231 173.506C54.0595 169.981 58.8559 168 63.8571 168V121C63.8571 108.535 68.824 96.5802 77.665 87.766C86.506 78.9518 98.4969 74 111 74C123.503 74 135.494 78.9518 144.335 87.766C153.176 96.5802 158.143 108.535 158.143 121V168ZM111 233.8C116.001 233.8 120.798 231.819 124.334 228.294C127.87 224.768 129.857 219.986 129.857 215C129.857 210.014 127.87 205.232 124.334 201.706C120.798 198.181 116.001 196.2 111 196.2C105.999 196.2 101.202 198.181 97.666 201.706C94.1296 205.232 92.1429 210.014 92.1429 215C92.1429 219.986 94.1296 224.768 97.666 228.294C101.202 231.819 105.999 233.8 111 233.8ZM139.286 168V121C139.286 117.297 138.554 113.63 137.133 110.208C135.711 106.787 133.628 103.678 131.001 101.06C128.374 98.441 125.256 96.3638 121.824 94.9466C118.393 93.5294 114.715 92.8 111 92.8C107.285 92.8 103.607 93.5294 100.176 94.9466C96.7437 96.3638 93.6256 98.441 90.999 101.06C88.3724 103.678 86.2889 106.787 84.8674 110.208C83.4459 113.63 82.7143 117.297 82.7143 121V168H139.286Z" fill="url(#paint0_linear_77_788)" />
          </g>
          <defs>
            <filter id="filter0_d_77_788" x="0" y="0" width="222" height="278" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
              <feOffset dy="-29" />
              <feGaussianBlur stdDeviation="22.5" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.12 0" />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_77_788" />
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_77_788" result="shape" />
            </filter>
            <linearGradient id="paint0_linear_77_788" x1="113.424" y1="74.0342" x2="110.924" y2="267.932" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="0.784859" />
            </linearGradient>
          </defs>
        </svg>

        <h1 className="main-heading space-grotesk-font">Smart Lock. QR Access.</h1>
        <h2 className="sub-heading space-grotesk-font">No More Laundry Theft.</h2>
        <h4 className="description inter-font">Patent-pending QR-secured lock for laundromats, apartments & shared laundry spaces.</h4>

        <form id="earlyAccessForm" className="flex flex-col form-align" onSubmit={handleSubmit}>
          <div className="flex flex-col space">
            <input 
              className="form-input name-input inter-font" 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Your Name" 
              autoComplete="off" 
              required 
            />

            <input 
              className="form-input inter-font" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Your Email" 
              autoComplete="off" 
              required 
            />

            <div className="flex w-[100%] items-center gap-[10px] mt-[14px] email-input">
              <div 
                className={`check ${demoRequest ? 'checked' : ''}`}
                onClick={() => setDemoRequest(!demoRequest)}
              >
                <svg className="tick" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.33334 9.33331L5.66668 11.6666L12.6667 4.33331" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <label htmlFor="demo-request" className="patent-text inter-font cursor-pointer" onClick={() => setDemoRequest(!demoRequest)}>
                I want a demo when it launches.
              </label>
            </div>

            <button type="submit" className="cta-button space-grotesk-font" disabled={loading}>
              {loading ? 'Submitting...' : 'Claim Early Access'}
            </button>
          </div>
        </form>

        {/* Success Message */}
        {showSuccess && (
          <div className="text-green-400 text-center mt-4 inter-font">
            Thank you! Your early access request has been submitted.
          </div>
        )}

        {emailStatus && (
          <div className={`text-center mt-2 inter-font ${emailStatus.sent ? 'text-green-400' : 'text-yellow-400'}`}>
            {emailStatus.sent
              ? 'A welcome email has been sent to your inbox.'
              : `Signup succeeded but email could not be sent: ${emailStatus.error}`}
          </div>
        )}

        {lastSignupEmail && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendLoading}
              className="text-sm text-blue-400 hover:text-blue-300 underline disabled:opacity-60"
            >
              {resendLoading ? 'Resending email...' : 'Resend Welcome Email'}
            </button>
          </div>
        )}

        {/* Error Message */}
        {showError && (
          <div className="text-red-400 text-center mt-4 inter-font">
            Something went wrong. Please try again.
          </div>
        )}
      </div>

      <h6 className="copyright inter-font">© 2025 Quotaquom LLC. All rights reserved.</h6>
    </>
  );
}

export default Landing;
