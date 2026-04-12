import { useState } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface ReportFormProps {
  onReport: (reportData: any) => void;
  isPending: boolean;
}

export function ReportForm({ onReport, isPending }: ReportFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    house_number: '',
    street: '',
    borough: 'Manhattan',
    user_id: 'user_' + Math.random().toString(36).substr(2, 9),
    status: 'DOWN'
  });

  const statuses = [
    { value: 'UP', label: 'status_up', variant: 'success' },
    { value: 'DOWN', label: 'status_down', variant: 'danger' },
    { value: 'TRAPPED', label: 'status_trapped', variant: 'dark' },
    { value: 'SLOW', label: 'status_slow', variant: 'warning' },
    { value: 'UNSAFE', label: 'status_unsafe', variant: 'warning' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReport(formData);
  };

  return (
    <Card className="mb-4 shadow-sm border-0">
      <Card.Body className="p-4">
        <Form onSubmit={handleSubmit}>
          <h4 className="mb-4 text-primary fw-bold">{t('report_outage')}</h4>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold">{t('house_number')}</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={formData.house_number}
                  onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold">{t('street')}</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold">{t('borough')}</Form.Label>
                <Form.Select
                  value={formData.borough}
                  onChange={(e) => setFormData({ ...formData, borough: e.target.value })}
                >
                  <option value="Manhattan">Manhattan</option>
                  <option value="Bronx">Bronx</option>
                  <option value="Brooklyn">Brooklyn</option>
                  <option value="Queens">Queens</option>
                  <option value="Staten Island">Staten Island</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <h6 className="mb-3 fw-bold">{t('status')}</h6>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {statuses.map((s) => (
              <Button
                key={s.value}
                variant={formData.status === s.value ? s.variant : `outline-${s.variant}`}
                className="flex-grow-1"
                onClick={() => setFormData({ ...formData, status: s.value })}
                aria-pressed={formData.status === s.value}
              >
                {t(s.label)}
              </Button>
            ))}
          </div>

          <Button 
            variant="primary" 
            type="submit" 
            disabled={isPending} 
            className="w-100 py-3 fw-bold text-uppercase"
            aria-live="polite"
          >
            {isPending ? t('syncing') : t('submit')}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
