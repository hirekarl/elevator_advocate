import { useState, useOptimistic, useTransition } from 'react';
import { Container, Navbar, Nav, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

function App() {
  const { t, i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [reports, setReports] = useState<any[]>([]);

  // React 19 useOptimistic for instant UI feedback
  const [optimisticReports, addOptimisticReport] = useOptimistic(
    reports,
    (state, newReport: any) => [...state, { ...newReport, pending: true }]
  );

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en');
  };

  const reportOutage = () => {
    const newReport = { id: Date.now(), status: 'DOWN', time: new Date().toLocaleTimeString() };
    
    startTransition(async () => {
      addOptimisticReport(newReport);
      // TODO: Implement API call to backend/api/reports/
      await new Promise(res => setTimeout(res, 2000)); // Simulate latency
      setReports(prev => [...prev, newReport]);
    });
  };

  return (
    <Container fluid p-0>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#">Elevator Advocacy</Navbar.Brand>
          <Nav className="ms-auto">
            <Button variant="outline-light" onClick={toggleLanguage} aria-label="Toggle Language">
              {i18n.language === 'en' ? 'ES' : 'EN'}
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Row>
          <Col md={{ span: 8, offset: 2 }}>
            <Card className="text-center">
              <Card.Header as="h1">{t('report_outage')}</Card.Header>
              <Card.Body>
                <Button 
                  variant="danger" 
                  size="lg" 
                  onClick={reportOutage} 
                  disabled={isPending}
                  aria-live="polite"
                >
                  {isPending ? t('syncing') : t('report_outage')}
                </Button>
              </Card.Body>
            </Card>

            <div className="mt-4">
              {optimisticReports.length === 0 ? (
                <Alert variant="info" role="alert">{t('no_outages')}</Alert>
              ) : (
                optimisticReports.map((report: any) => (
                  <Card key={report.id} className={`mb-3 ${report.pending ? 'border-warning animate-pulse' : ''}`}>
                    <Card.Body>
                      <Card.Title>
                        {report.pending ? t('verification_pending') : t('verified_status')}
                      </Card.Title>
                      <Card.Text>
                        {report.status} - {report.time}
                      </Card.Text>
                      {report.pending && (
                        <div className="text-warning" aria-hidden="true">
                           Pulse Amber State
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default App;
