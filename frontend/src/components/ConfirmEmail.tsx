import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Alert, Spinner, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export function ConfirmEmail() {
  const { uid, token } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const confirm = async () => {
      try {
        const response = await fetch('/api/auth/confirm_email/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, token })
        });

        if (response.ok) {
          setStatus('success');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    };
    confirm();
  }, [uid, token, navigate]);

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm border-0 p-5 text-center" style={{ maxWidth: '500px' }}>
        <Card.Body>
          {status === 'loading' && (
            <>
              <Spinner animation="border" variant="primary" className="mb-4" />
              <h4>{t('confirming_email')}</h4>
            </>
          )}
          {status === 'success' && (
            <Alert variant="success">
              <h4 className="fw-bold">{t('email_confirmed_title')}</h4>
              <p>{t('email_confirmed_message')}</p>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="danger">
              <h4 className="fw-bold">{t('email_confirm_error_title')}</h4>
              <p>{t('email_confirm_error_message')}</p>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
