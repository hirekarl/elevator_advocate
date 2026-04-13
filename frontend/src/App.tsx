import { useState, useOptimistic, useTransition, useEffect, useCallback } from 'react';
import { Container, Navbar, Button, Row, Col, Alert, Badge, Dropdown, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';

import type { Building, OptimisticReport, AuthSuccessData } from './types';
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
  const [reports, setReports] = useState<OptimisticReport[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [primaryBuildingBin, setPrimaryBuildingBin] = useState<string | null>(localStorage.getItem('primary_building_bin'));
  const [searchData, setSearchData] = useState({
    house_number: '',
    street: '',
    borough: 'Manhattan'
  });
  const [activeBuilding, setActiveBuilding] = useState<Building | null>(null);
  const [searchError, setSearchError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const fetchBuilding = useCallback((binId: string) => {
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
  }, [navigate, startTransition]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('primary_building_bin');
    setIsLoggedIn(false);
    setUsername('');
    setPrimaryBuildingBin(null);
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('http://localhost:8000/api/auth/whoami/', {
            headers: { 'Authorization': `Token ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setIsLoggedIn(true);
            setUsername(data.username);

            if (data.primary_building) {
              const currentBinInStorage = localStorage.getItem('primary_building_bin');
              if (currentBinInStorage !== data.primary_building.bin) {
                localStorage.setItem('primary_building_bin', data.primary_building.bin);
              }
              setPrimaryBuildingBin(data.primary_building.bin);
            } else {
              setPrimaryBuildingBin(null);
            }
          } else if (response.status === 401) {
            handleLogout();
          }
        } catch (error) {
          console.error("Auth sync error:", error);
        }
      }
    };

    fetchUser();
  }, [bin, navigate, handleLogout]);

  useEffect(() => {
    if (bin) {
      fetchBuilding(bin);
    } else {
      setActiveBuilding(null);
    }
  }, [bin, fetchBuilding]);

  // Seed the building feed from the current building's tenant reports.
  useEffect(() => {
    if (activeBuilding) {
      const tenantReports: OptimisticReport[] = (activeBuilding.recent_reports || [])
        .filter(r => !r.is_official)
        .map(r => ({ id: r.id, status: r.status, reported_at: r.reported_at, pending: false }));
      setReports(tenantReports);
    } else {
      setReports([]);
    }
  }, [activeBuilding]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError('');

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
          setSearchError(t('building_not_found'));
        }
      } catch (error) {
        console.error("Search Error:", error);
        setSearchError(t('building_not_found'));
      }
    });
  };

  const [optimisticReports, addOptimisticReport] = useOptimistic(
    reports,
    (state: OptimisticReport[], newReport: OptimisticReport) => [{ ...newReport, pending: true }, ...state]
  );

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en');
  };

  const handleAuthSuccess = (data: AuthSuccessData) => {
    setIsLoggedIn(true);
    setUsername(data.username);
    setShowAuthModal(false);
    if (data.primary_building) {
      localStorage.setItem('primary_building_bin', data.primary_building.bin);
      setPrimaryBuildingBin(data.primary_building.bin);
      navigate(`/building/${data.primary_building.bin}`);
    }
  };

  return (
    <Container fluid className="p-0 bg-light min-vh-100">
      <header>
        <h1 className="visually-hidden">Elevator Advocacy Platform</h1>
      </header>
      <a
        href="#main-content"
        className="visually-hidden-focusable position-absolute top-0 start-0 p-2 bg-white text-primary fw-bold"
        style={{ zIndex: 9999 }}
      >
        {t('skip_to_main')}
      </a>

      <Navbar variant="dark" expand="lg" className="shadow-sm sticky-top py-2 py-lg-3 app-navbar" aria-label={t('guide_modal_label')}>
        <Container>
          <Navbar.Brand
            as={Link}
            to="/"
            className="d-flex align-items-center gap-2"
          >
            <span className="brand-mark" aria-hidden="true">▲</span>
            ELEVATOR ADVOCACY
          </Navbar.Brand>
          <div className="d-flex align-items-center ms-auto">
            <Button
              variant="link"
              className="text-info text-decoration-none fw-bold me-2 me-md-3 p-0 fs-7 fs-md-6"
              onClick={() => setShowGuide(true)}
            >
              <span aria-hidden="true">❓</span> {t('how_to_use')}
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              onClick={toggleLanguage}
              aria-label={t('toggle_language')}
              className="me-2 me-md-3 border-0 fw-bold"
            >
              <span aria-hidden="true">🌐</span> {i18n.language === 'en' ? 'ES' : 'EN'}
            </Button>
            {isLoggedIn ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-info" size="sm" className="fw-bold px-3">
                  <span className="d-none d-md-inline">{username}</span>
                  <span className="d-md-none" aria-hidden="true">👤</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={handleLogout}>{t('log_out')}</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="fw-bold px-3 rounded-pill"
                onClick={() => setShowAuthModal(true)}
              >
                {t('login_button')}
              </Button>
            )}
          </div>
        </Container>
      </Navbar>

      {/* Global Auth Modal */}
      <Modal
        show={showAuthModal}
        onHide={() => setShowAuthModal(false)}
        centered
        aria-label={t('auth_modal_label')}
      >
        <Modal.Header closeButton className="border-0 pb-0" />
        <Modal.Body className="pt-0">
          <SignupForm onSuccess={handleAuthSuccess} />
        </Modal.Body>
      </Modal>

      {/* User Guide Modal */}
      <Modal
        show={showGuide}
        onHide={() => setShowGuide(false)}
        centered
        aria-labelledby="guide-modal-title"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title id="guide-modal-title" className="fw-bold text-primary fs-4">
            {t('user_guide_title')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 pt-3">
          <div className="user-guide-steps">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="d-flex align-items-center mb-4">
                <div
                  className="bg-light rounded-circle shadow-sm p-2 d-flex align-items-center justify-content-center border me-3"
                  style={{ width: '56px', height: '56px', minWidth: '56px' }}
                >
                  <span className="fs-3" aria-hidden="true">
                    {num === 1 ? '🏢' : num === 2 ? '🔘' : num === 3 ? '📞' : '📝'}
                  </span>
                </div>
                <p className="mb-0 fs-5 text-dark fw-medium leading-tight">
                  {t(`guide_step_${num}` as 'guide_step_1').replace(/^\d\.\s/, '')}
                </p>
              </div>
            ))}
          </div>
          <Button
            variant="primary"
            className="w-100 py-3 fw-bold rounded-pill shadow-sm mt-3 fs-5"
            onClick={() => setShowGuide(false)}
          >
            {t('got_it')}
          </Button>
        </Modal.Body>
      </Modal>

      <main id="main-content">
        {!bin ? (
          <>
            <HeroSearch
              onSearch={handleSearch}
              searchData={searchData}
              setSearchData={setSearchData}
              isPending={isPending}
            />
            <div className="container pb-5 px-3">
              {searchError && (
                <Alert variant="danger" className="mt-3" role="alert">
                  {searchError}
                </Alert>
              )}

              {/* State C: logged in + primary building set */}
              {isLoggedIn && primaryBuildingBin && (
                <div
                  className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mt-4 p-4 rounded-4 shadow-sm"
                  style={{ backgroundColor: '#0d1b2a' }}
                >
                  <div>
                    <div className="fw-bold text-white fs-5" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
                      {t('welcome_back')}, {username}
                    </div>
                    <div className="text-white mt-1" style={{ opacity: 0.72, fontSize: '0.9rem' }}>
                      {t('your_home_building_prompt')}
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/building/${primaryBuildingBin}`)}
                    className="fw-bold rounded-pill px-4 py-2 flex-shrink-0"
                    style={{ backgroundColor: '#e8920a', borderColor: '#e8920a', color: '#0d1b2a', fontFamily: 'Syne, sans-serif' }}
                  >
                    {t('go_to_my_building')} →
                  </Button>
                </div>
              )}

              {/* State B: logged in, no primary building */}
              {isLoggedIn && !primaryBuildingBin && (
                <Alert variant="info" className="mt-4 rounded-4 border-0 shadow-sm" style={{ backgroundColor: '#e8eef5', color: '#0d1b2a' }}>
                  <strong>{t('welcome_back')}, {username}.</strong> {t('set_primary_prompt')}
                </Alert>
              )}

              <Row className="mt-4 mt-md-5">
                <Col md={12} lg={10} className="mx-auto text-center mb-5">
                  <h2 className="fw-bold mb-4 px-3 fs-3 fs-md-2">{t('explore_outages')}</h2>
                  <div className="px-1 px-md-2">
                    <BuildingsMap onBuildingSelect={(binId) => navigate(`/building/${binId}`)} />
                  </div>
                </Col>
              </Row>
            </div>
          </>
        ) : (
          <Container className="mt-3 mt-md-4 pb-5 px-3">
            <Button
              variant="link"
              className="text-decoration-none mb-3 p-0 d-flex align-items-center text-muted fw-bold"
              onClick={() => navigate('/')}
            >
              <span className="me-2" aria-hidden="true">←</span> {t('search_address')}
            </Button>

            {activeBuilding && (
              <Row className="g-4">
                <Col lg={7}>
                  <BuildingDetail
                    buildingData={activeBuilding}
                    isLoggedIn={isLoggedIn}
                    onShowAuth={() => setShowAuthModal(true)}
                    onReportOptimistic={(report) => addOptimisticReport(report)}
                    refreshBuilding={() => fetchBuilding(activeBuilding.bin)}
                  />
                </Col>
                <Col lg={5}>
                  <div className="sticky-lg-top" style={{ top: '100px', zIndex: 10 }}>
                    {!isLoggedIn && (
                      <SignupForm onSuccess={(data) => {
                        setIsLoggedIn(true);
                        setUsername(data.username);
                        if (data.primary_building) {
                          localStorage.setItem('primary_building_bin', data.primary_building.bin);
                          navigate(`/building/${data.primary_building.bin}`);
                        }
                      }} />
                    )}

                    <div className={`p-4 bg-white border rounded shadow-sm ${!isLoggedIn ? 'mt-4' : ''}`}>
                      <h2 className="mb-3 d-flex justify-content-between align-items-center fs-5">
                        {t('building_feed')}
                        {optimisticReports.length > 0 && (
                          <Badge bg="primary" pill>{optimisticReports.length}</Badge>
                        )}
                      </h2>
                      {optimisticReports.length === 0 ? (
                        <Alert variant="light" className="text-muted border border-secondary border-opacity-25 border-dashed">
                          {t('no_recent_activity')}
                        </Alert>
                      ) : (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="pe-2">
                          {optimisticReports.map((report) => (
                            <div
                              key={report.id}
                              className={`card mb-3 shadow-sm ${report.pending ? 'border-warning animate-pulse' : 'border-success'}`}
                            >
                              <div className="card-body p-3">
                                <h6 className="card-title small fw-bold mb-1">
                                  {report.pending ? t('verification_pending') : t('verified_status')}
                                </h6>
                                <p className="card-text small mb-0">
                                  {report.status} — {report.reported_at || report.time}
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
      </main>
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
