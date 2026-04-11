import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Copy, Check } from 'lucide-react';
import authService from '../services/authService';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validateEmail = () => {
    setError('');
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail()) return;

    try {
      setIsLoading(true);
      const result = await authService.forgotPassword(email);
      setResetToken(result.resetToken);
      toast.success('Password reset token generated!');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to generate reset token';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (resetToken) {
      navigator.clipboard.writeText(resetToken);
      setCopied(true);
      toast.success('Token copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (resetToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-nestory-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-gradient mb-2">Nestory</div>
            <p className="text-gray-600">Family Reading Platform</p>
          </div>

          {/* Token Card */}
          <div className="card shadow-lg">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Check size={24} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Token Generated</h2>
              <p className="text-gray-600 text-sm mt-2">
                Use this token to reset your password
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Your Reset Token</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={resetToken}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-900 truncate"
                  />
                  <button
                    onClick={handleCopyToken}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copy token"
                  >
                    {copied ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <Copy size={18} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Next step:</span> Use this token on the reset password page to create a new password.
                </p>
              </div>

              <Link
                to={`/reset-password?token=${resetToken}`}
                className="btn-primary w-full text-center block"
              >
                Reset Password Now
              </Link>

              <button
                onClick={() => {
                  setResetToken(null);
                  setEmail('');
                }}
                className="btn-secondary w-full"
              >
                Generate Another Token
              </button>
            </div>
          </div>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-nestory-600 font-semibold hover:text-nestory-700"
            >
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-nestory-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-gradient mb-2">Nestory</div>
          <p className="text-gray-600">Family Reading Platform</p>
        </div>

        {/* Forgot Password Card */}
        <div className="card shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Forgot Password?</h2>
            <p className="text-gray-600 text-center text-sm">
              Enter your email address and we'll help you reset your password.
            </p>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className={`input-base pl-10 ${
                    error ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating Token...' : 'Send Reset Token'}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-nestory-600 font-semibold hover:text-nestory-700"
            >
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
