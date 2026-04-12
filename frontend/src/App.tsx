import { useState, useOptimistic, useTransition, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Row, Col, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { ReportForm } from './components/ReportForm';

function App() {
  const { t, i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [reports, setReports] = useState<any[]>([]);

  // Fetch building status
  const fetchStatus = async (bin: string) => {
    const res = await fetch(`/api/buildings/${bin}/status/`);
    return res.json();
  };

  const [optimisticReports, addOptimisticReport] = useOptimistic(
    reports,
    (state, newReport: any) => [{ ...newReport, pending: true }, ...state]
  );

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en');
  };

  const handleReport = (formData: any) => {
    startTransition(async () => {
      const tempReport = { id: Date.now(), status: formData.status, time: new Date().toLocaleTimeString() };
      addOptimisticReport(tempReport);

      try {
        const response = await fetch('/api/reports/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const data = await response.json();
          setReports(prev => [{ ...data, id: data.reported_at }, ...prev]);
        }
      } catch (error) {
        console.error("API Error:", error);
      }
    });
  };

  return (
    <Container fluid className="p-0">
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
            <ReportForm onReport={handleReport} isPending={isPending} />

            <div className="mt-4">
              {optimisticReports.length === 0 ? (
                <Alert variant="info" role="alert">{t('no_outages')}</Alert>
              ) : (
                optimisticReports.map((report: any) => (
                  <div key={report.id || report.reported_at} className={`card mb-3 ${report.pending ? 'border-warning animate-pulse' : 'border-success'}`}>
                    <div className="card-body">
                      <h5 className="card-title">
                        {report.pending ? t('verification_pending') : t('verified_status')}
                      </h5>
                      <p className="card-text">
                        {report.status} - {report.reported_at || report.time}
                      </p>
                      {report.pending && (
                        <div className="text-warning small" aria-hidden="true">
                          ● {t('syncing')}
                        </div>
                      )}
                    </div>
                  </div>
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
