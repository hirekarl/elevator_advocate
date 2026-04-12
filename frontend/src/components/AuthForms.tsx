import { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface AuthFormsProps {
  onSuccess: () => void;
}

export function SignupForm({ onSuccess }: AuthFormsProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'danger', message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        onSuccess();
      } else {
        setStatus({ type: 'danger', message: data.error || 'Signup failed.' });
      }
    } catch (error) {
      setStatus({ type: 'danger', message: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-0 p-4">
      <Card.Body>
        <h4 className="mb-4 fw-bold">{t('signup_title')}</h4>
        {status && <Alert variant={status.type}>{status.message}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>{t('username')}</Form.Label>
            <Form.Control
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('email')}</Form.Label>
            <Form.Control
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </Form.Group>

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
            className="w-100 py-2 fw-bold"
            disabled={loading}
          >
            {loading ? t('syncing') : t('signup_button')}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
