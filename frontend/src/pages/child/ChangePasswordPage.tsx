import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, KeyRound } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import InputField from '../../components/common/InputField';
import { useAuth } from '../../contexts/AuthContext';

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, changePassword } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      nextErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      nextErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      nextErrors.newPassword = 'New password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      nextErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await changePassword(formData.currentPassword, formData.newPassword);
      toast.success('Password updated successfully');
      navigate('/child');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to update password';
      toast.error(message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Change Password" />

      <div className="container-responsive py-8">
        <div className="max-w-xl mx-auto card">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Your Account</h1>
            <p className="text-gray-600">
              {user?.mustChangePassword
                ? 'You must change your temporary password before continuing.'
                : 'You can update your password any time.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <InputField
              label="Current Password"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Enter current password"
              error={errors.currentPassword}
              required
            />

            <InputField
              label="New Password"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
              placeholder="At least 6 characters"
              error={errors.newPassword}
              required
            />

            <InputField
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Retype new password"
              error={errors.confirmPassword}
              required
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary inline-flex items-center gap-2"
              >
                <KeyRound size={18} />
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>

              {!user?.mustChangePassword && (
                <button
                  type="button"
                  className="btn-secondary inline-flex items-center gap-2"
                  onClick={() => navigate('/child')}
                >
                  <Lock size={18} />
                  Back to Dashboard
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
