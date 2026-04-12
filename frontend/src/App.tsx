import { useState, useOptimistic, useTransition } from 'react';
import { Container, Navbar, Nav, Button, Row, Col, Alert, Form, Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { ReportForm } from './components/ReportForm';
import { BuildingDetail } from './components/BuildingDetail';
import { BuildingsMap } from './components/BuildingsMap';
import { SignupForm } from './components/AuthForms';
import { ConfirmEmail } from './components/ConfirmEmail';

function MainDashboard() {
  const { t, i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchData, setSearchData] = useState({
    house_number: '',
    street: '',
    borough: 'Manhattan'
  });
  const [activeBuilding, setActiveBuilding] = useState<any>(null);

  const handleSearch = async (e?: React.FormEvent, bin?: string) => {
    if (e) e.preventDefault();
    
    startTransition(async () => {
      try {
        let response;
        if (bin) {
          response = await fetch(`/api/buildings/${bin}/`);
        } else {
          const { house_number, street, borough } = searchData;
          if (!house_number || !street) return;
          const query = new URLSearchParams({ house_number, street, borough }).toString();
          response = await fetch(`/api/buildings/lookup/?${query}`);
        }

        if (response.ok) {
          const data = await response.json();
          setActiveBuilding(data);
        } else {
          alert("Building not found. Double-check your search.");
        }
      } catch (error) {
        console.error("Search Error:", error);
      }
    });
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
          if (activeBuilding && activeBuilding.bin === data.building) {
             handleSearch(undefined, activeBuilding.bin);
          }
        } else if (response.status === 403) {
          alert(t('login_required'));
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("API Error:", error);
      }
    });
  };

  return (
    <Container fluid className="p-0">
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand href="/" className="fw-bold text-uppercase">Elevator Advocacy</Navbar.Brand>
          <Nav className="ms-auto align-items-center">
            <Button variant="outline-light" size="sm" onClick={toggleLanguage} aria-label="Toggle Language" className="me-3">
              {i18n.language === 'en' ? 'ES' : 'EN'}
            </Button>
            {!isLoggedIn && (
              <Badge bg="warning" text="dark" className="p-2">{t('login_required')}</Badge>
            )}
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Row>
          <Col lg={6} className="mb-4">
            {isLoggedIn ? (
              <ReportForm onReport={handleReport} isPending={isPending} />
            ) : (
              <SignupForm onSuccess={() => setIsLoggedIn(true)} />
            )}
            
            <Form onSubmit={handleSearch} className="mb-5 p-4 border rounded bg-white shadow-sm">
              <h5 className="mb-4 text-primary">{t('search_address')}</h5>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">{t('house_number')}</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder="e.g., 280"
                      value={searchData.house_number}
                      onChange={(e) => setSearchData({ ...searchData, house_number: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">{t('street')}</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder="e.g., Broadway"
                      value={searchData.street}
                      onChange={(e) => setSearchData({ ...searchData, street: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">{t('borough')}</Form.Label>
                    <Form.Select
                      value={searchData.borough}
                      onChange={(e) => setSearchData({ ...searchData, borough: e.target.value })}
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
                variant="primary" 
                type="submit" 
                className="w-100 mt-2"
                disabled={isPending}
              >
                {isPending ? t('syncing') : t('submit')}
              </Button>
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
            <BuildingsMap onBuildingSelect={(bin) => handleSearch(undefined, bin)} />

            {activeBuilding ? (
              <BuildingDetail buildingData={activeBuilding} />
            ) : (
              <div className="p-5 text-center text-muted bg-light rounded shadow-sm border">
                <h3>{t('building_details')}</h3>
                <p>Find your building on the map or search by address to view detailed service metrics.</p>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainDashboard />} />
        <Route path="/confirm/:uid/:token" element={<ConfirmEmail />} />
      </Routes>
    </Router>
  );
}

export default App;
