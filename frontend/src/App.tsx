import { useState, useOptimistic, useTransition, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Row, Col, Alert, Badge, Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';

import { ReportForm } from './components/ReportForm';
import { BuildingDetail } from './components/BuildingDetail';
import { BuildingsMap } from './components/BuildingsMap';
import { SignupForm } from './components/AuthForms';
import { ConfirmEmail } from './components/ConfirmEmail';
import { HeroSearch } from './components/HeroSearch';

function MainDashboard() {
  const { bin } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [searchData, setSearchData] = useState({
    house_number: '',
    street: '',
    borough: 'Manhattan'
  });
  const [activeBuilding, setActiveBuilding] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('username');
    const primaryBin = localStorage.getItem('primary_building_bin');

    if (token && storedUser) {
      setIsLoggedIn(true);
      setUsername(storedUser);
      
      // If no BIN in URL, but user has a home building, go there.
      if (!bin && primaryBin) {
        navigate(`/building/${primaryBin}`);
      }
    }
  }, [bin, navigate]);

  useEffect(() => {
    if (bin) {
      fetchBuilding(bin);
    } else {
      setActiveBuilding(null);
    }
  }, [bin]);

  const fetchBuilding = async (binId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/buildings/${binId}/`);
        if (response.ok) {
          const data = await response.json();
          setActiveBuilding(data);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('primary_building_bin');
    setIsLoggedIn(false);
    setUsername('');
    navigate('/');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    startTransition(async () => {
      try {
        const { house_number, street, borough } = searchData;
        if (!house_number || !street) return;
        const query = new URLSearchParams({ house_number, street, borough }).toString();
        const response = await fetch(`http://localhost:8000/api/buildings/lookup/?${query}`);

        if (response.ok) {
          const data = await response.json();
          navigate(`/building/${data.bin}`);
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
      const token = localStorage.getItem('token');
      
      addOptimisticReport(tempReport);

      try {
        const response = await fetch('http://localhost:8000/api/reports/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const data = await response.json();
          setReports(prev => [{ ...data, id: data.reported_at }, ...prev]);
          if (activeBuilding && activeBuilding.bin === data.building) {
             fetchBuilding(activeBuilding.bin);
          }
        } else if (response.status === 401 || response.status === 403) {
          alert(t('login_required'));
          handleLogout();
        }
      } catch (error) {
        console.error("API Error:", error);
      }
    });
  };

  return (
    <Container fluid className="p-0 bg-light min-vh-100">
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm sticky-top">
        <Container>
          <Navbar.Brand 
            as={Link} 
            to="/" 
            className="fw-bold text-uppercase d-flex align-items-center"
          >
            <span className="text-primary me-2">🏢</span> Elevator Advocacy
          </Navbar.Brand>
          <Nav className="ms-auto align-items-center">
            <Button variant="outline-light" size="sm" onClick={toggleLanguage} aria-label="Toggle Language" className="me-3 border-0">
              {i18n.language === 'en' ? 'ES' : 'EN'}
            </Button>
            {isLoggedIn ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-info" size="sm" className="fw-bold px-3">
                  {username}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={handleLogout}>Log Out</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Badge bg="warning" text="dark" className="p-2">{t('login_required')}</Badge>
            )}
          </Nav>
        </Container>
      </Navbar>

      {!bin ? (
        <div className="container mt-5 pb-5">
          <HeroSearch 
            onSearch={handleSearch} 
            searchData={searchData} 
            setSearchData={setSearchData} 
            isPending={isPending}
          />
          <Row className="mt-5">
             <Col md={10} className="mx-auto text-center mb-5">
                <h2 className="fw-bold mb-4">Explore NYC Elevator Outages</h2>
                <BuildingsMap onBuildingSelect={(binId) => navigate(`/building/${binId}`)} />
             </Col>
          </Row>
        </div>
      ) : (
        <Container className="mt-4 pb-5">
          <Button 
            variant="link" 
            className="text-decoration-none mb-3 p-0 d-flex align-items-center text-muted"
            onClick={() => navigate('/')}
          >
            <span className="me-2">←</span> Back to Search
          </Button>
          
          {activeBuilding && (
            <Row>
              <Col lg={7}>
                <BuildingDetail buildingData={activeBuilding} />
              </Col>
              <Col lg={5}>
                <div className="sticky-top" style={{ top: '80px', zIndex: 10 }}>
                  {isLoggedIn ? (
                    <ReportForm onReport={handleReport} isPending={isPending} />
                  ) : (
                    <SignupForm onSuccess={(data) => {
                      setIsLoggedIn(true);
                      setUsername(data.username);
                      if (data.primary_building) {
                        localStorage.setItem('primary_building_bin', data.primary_building.bin);
                      }
                    }} />
                  )}

                  <div className="mt-4 p-4 bg-white border rounded shadow-sm">
                    <h5 className="mb-3 d-flex justify-content-between align-items-center">
                      Building Feed
                      {optimisticReports.length > 0 && <Badge bg="primary" pill>{optimisticReports.length}</Badge>}
                    </h5>
                    {optimisticReports.length === 0 ? (
                      <Alert variant="light" className="text-muted border border-secondary border-opacity-25 border-dashed">
                        No recent tenant activity.
                      </Alert>
                    ) : (
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="pe-2">
                        {optimisticReports.map((report: any) => (
                          <div key={report.id || report.reported_at} className={`card mb-3 shadow-sm ${report.pending ? 'border-warning animate-pulse' : 'border-success'}`}>
                            <div className="card-body p-3">
                              <h6 className="card-title small fw-bold mb-1">
                                {report.pending ? t('verification_pending') : t('verified_status')}
                              </h6>
                              <p className="card-text small mb-0">
                                {report.status} - {report.reported_at || report.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Container>
      )}
    </Container>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainDashboard />} />
        <Route path="/building/:bin" element={<MainDashboard />} />
        <Route path="/confirm/:uid/:token" element={<ConfirmEmail />} />
      </Routes>
    </Router>
  );
}

export default App;
