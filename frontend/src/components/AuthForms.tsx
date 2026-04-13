import { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import type { AuthSuccessData } from '../types';

interface AuthFormsProps {
  onSuccess: (data: AuthSuccessData) => void;
}

export function SignupForm({ onSuccess }: AuthFormsProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'danger', message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/auth/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        setStatus({ type: 'success', message: t('signup_success_check_email') });
        // onSuccess(); // Keep them on the page to read the success message
      } else {
        setStatus({ type: 'danger', message: data.error || t('signup_failed') });
      }
    } catch (error) {
      setStatus({ type: 'danger', message: t('network_error') });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        if (data.primary_building) {
          localStorage.setItem('primary_building_bin', data.primary_building.bin);
        }
        setStatus({ type: 'success', message: t('signin_success') });
        onSuccess(data as AuthSuccessData);
      } else {
        setStatus({ type: 'danger', message: data.error || t('login_failed') });
      }
    } catch (error) {
      setStatus({ type: 'danger', message: t('network_error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-0 p-4">
      <Card.Body>
        <h4 className="mb-4 fw-bold">{isLogin ? t('login_title') : t('signup_title')}</h4>
        {status && <Alert variant={status.type}>{status.message}</Alert>}
        
        <Form onSubmit={isLogin ? handleLogin : handleSignup}>
          <Form.Group className="mb-3">
            <Form.Label>{t('username')}</Form.Label>
            <Form.Control
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </Form.Group>

          {!isLogin && (
            <Form.Group className="mb-3">
              <Form.Label>{t('email')}</Form.Label>
              <Form.Control
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-4">
            <Form.Label>{t('password')}</Form.Label>
            <Form.Control
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 py-2 fw-bold mb-3"
            disabled={loading}
          >
            {loading ? t('syncing') : (isLogin ? t('login_button') : t('signup_button'))}
          </Button>

          <div className="text-center">
            <Button 
              variant="link" 
              className="text-decoration-none small"
              onClick={() => { setIsLogin(!isLogin); setStatus(null); }}
            >
              {isLogin ? t('dont_have_account') : t('already_have_account')}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
