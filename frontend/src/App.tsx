import { useState, useOptimistic, useTransition } from 'react';
import { Container, Navbar, Nav, Button, Row, Col, Alert, Form, InputGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { ReportForm } from './components/ReportForm';
import { BuildingDetail } from './components/BuildingDetail';

function App() {
  const { t, i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [reports, setReports] = useState<any[]>([]);
  const [searchBin, setSearchBin] = useState('');
  const [activeBuilding, setActiveBuilding] = useState<any>(null);

  // Fetch full building details
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchBin) return;
    
    try {
      const response = await fetch(`/api/buildings/${searchBin}/`);
      if (response.ok) {
        const data = await response.json();
        setActiveBuilding(data);
      } else {
        alert("Building not found in database. Please report an outage first to register it.");
      }
    } catch (error) {
      console.error("Search Error:", error);
    }
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
          // Refresh active building if it matches
          if (activeBuilding && activeBuilding.bin === data.building) {
             const refreshRes = await fetch(`/api/buildings/${activeBuilding.bin}/`);
             if (refreshRes.ok) setActiveBuilding(await refreshRes.json());
          }
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
          <Col lg={6} className="mb-4">
            <ReportForm onReport={handleReport} isPending={isPending} />
            
            <Form onSubmit={handleSearch} className="mb-4">
              <h5 className="mb-3">{t('search_bin')}</h5>
              <InputGroup>
                <Form.Control
                  placeholder="BIN (e.g., 1001145)"
                  value={searchBin}
                  onChange={(e) => setSearchBin(e.target.value)}
                  aria-label={t('search_bin')}
                />
                <Button variant="primary" type="submit">
                  {t('submit')}
                </Button>
              </InputGroup>
            </Form>

            <div className="mt-4">
              {optimisticReports.length > 0 && <h5 className="mb-3">{t('recent_activity')}</h5>}
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
          
          <Col lg={6}>
            {activeBuilding ? (
              <BuildingDetail buildingData={activeBuilding} />
            ) : (
              <div className="p-5 text-center text-muted bg-light rounded shadow-sm border">
                <h3>{t('building_details')}</h3>
                <p>Enter a Building Identification Number (BIN) to view detailed service metrics.</p>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default App;
