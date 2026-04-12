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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReport(formData);
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>{t('house_number')}</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={formData.house_number}
                  onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t('street')}</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>{t('borough')}</Form.Label>
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
          <Button 
            variant="danger" 
            type="submit" 
            disabled={isPending} 
            className="w-100"
            aria-live="polite"
          >
            {isPending ? t('syncing') : t('report_outage')}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
