import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || 'Invalid login credentials');
      } else {
        toast.success('Welcome back to CodeCrew ERP');
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred during login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-white p-8 shadow-sm">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5">
            <span className="text-3xl font-black tracking-tight text-[#FF8C00]">Code</span>
            <span className="text-3xl font-black tracking-tight text-[#111111]">Crew</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Internal Business ERP
          </p>
          <p className="text-sm text-neutral-600">
            Sign in to manage projects, ad expenses, and client invoices.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@codecrew.lk"
            value={email}
            onChange={e => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoFocus
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="md"
            isLoading={isSubmitting}
          >
            Sign In
          </Button>
        </form>

        {/* Help footer */}
        <div className="rounded-lg bg-surface-subtle border border-border p-3 text-center text-xs text-neutral-500">
          <p className="font-semibold text-neutral-700">Team Login Portal</p>
          <p className="mt-0.5">
            No public registration. Contact your CodeCrew administrator for access.
          </p>
        </div>
      </div>
    </div>
  );
};
