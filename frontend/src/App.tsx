import { useState, useOptimistic, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import type { OptimisticReport } from './types';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useBuildingLookup } from './hooks/useBuildingLookup';

// Sub-components
import { ConfirmEmail } from './components/ConfirmEmail';
import { NotFound } from './components/NotFound';
import { AppNavbar } from './components/App/AppNavbar';
import { AuthModal } from './components/App/AuthModal';
import { UserGuideModal } from './components/App/UserGuideModal';
import { LandingPage } from './components/App/LandingPage';
import { BuildingPage } from './components/App/BuildingPage';

function MainDashboard() {
  const { t, i18n } = useTranslation();
  
  const {
    isLoggedIn,
    username,
    primaryBuildingBin,
    showAuthModal,
    setShowAuthModal,
    showGuide,
    setShowGuide,
    handleLogout,
    handleAuthSuccess
  } = useAuth();

  const {
    bin,
    isPending,
    activeBuilding,
    buildingNotFound,
    searchError,
    searchData,
    setSearchData,
    primaryBuildingStatus,
    handleSearch,
    fetchBuilding
  } = useBuildingLookup(primaryBuildingBin);

  const [reports, setReports] = useState<OptimisticReport[]>([]);

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

  const [optimisticReports, addOptimisticReport] = useOptimistic(
    reports,
    (state: OptimisticReport[], newReport: OptimisticReport) => [{ ...newReport, pending: true }, ...state]
  );

  const getStatusPillClass = (status: string): string => {
    if (['DOWN', 'TRAPPED', 'UNSAFE'].includes(status)) return 'pill-danger';
    if (['SLOW', 'UNVERIFIED'].includes(status)) return 'pill-warning';
    return 'pill-ok';
  };

  const getStatusShortLabel = (status: string): string => {
    const labels: Record<string, string> = {
      UP: t('status_short_up'),
      DOWN: t('status_short_down'),
      TRAPPED: t('status_short_trapped'),
      UNSAFE: t('status_short_unsafe'),
      SLOW: t('status_short_slow'),
      UNVERIFIED: t('status_short_unverified'),
    };
    return labels[status] ?? status;
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(next);
    document.documentElement.lang = next;
  };

  return (
    <Container fluid className="p-0 bg-light min-vh-100">
      <header>
        <h1 className="visually-hidden">Elevator Advocate</h1>
      </header>
      <a
        href="#main-content"
        className="visually-hidden-focusable position-absolute top-0 start-0 p-2 bg-white text-primary fw-bold"
        style={{ zIndex: 9999 }}
      >
        {t('skip_to_main')}
      </a>

      <AppNavbar
        isLoggedIn={isLoggedIn}
        username={username}
        onLogout={handleLogout}
        onShowAuthModal={() => setShowAuthModal(true)}
        onShowGuide={() => setShowGuide(true)}
        toggleLanguage={toggleLanguage}
      />

      <AuthModal
        show={showAuthModal}
        onHide={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <UserGuideModal
        show={showGuide}
        onHide={() => setShowGuide(false)}
      />

      <main id="main-content">
        {!bin ? (
          <LandingPage
            onSearch={handleSearch}
            searchData={searchData}
            setSearchData={setSearchData}
            isPending={isPending}
            searchError={searchError}
            isLoggedIn={isLoggedIn}
            username={username}
            primaryBuildingBin={primaryBuildingBin}
            primaryBuildingStatus={primaryBuildingStatus}
            getStatusPillClass={getStatusPillClass}
            getStatusShortLabel={getStatusShortLabel}
          />
        ) : buildingNotFound ? (
          <div
            className="d-flex flex-column align-items-center justify-content-center text-center py-5 mt-5"
            style={{ color: 'var(--c-text)' }}
          >
            <p
              className="fw-bold mb-2"
              style={{ fontSize: '4rem', lineHeight: 1, color: 'var(--c-navy)' }}
              aria-hidden="true"
            >
              404
            </p>
            <h2 className="h3 mb-3" style={{ color: 'var(--c-navy)' }}>
              {t('building_not_found_title')}
            </h2>
            <p className="mb-4" style={{ color: 'var(--c-muted)', maxWidth: '24rem' }}>
              {t('building_not_found_detail')}
            </p>
            <Link to="/" className="btn btn-primary">
              {t('search_again')}
            </Link>
          </div>
        ) : activeBuilding && (
          <BuildingPage
            activeBuilding={activeBuilding}
            isLoggedIn={isLoggedIn}
            onShowAuthModal={() => setShowAuthModal(true)}
            onAuthSuccess={handleAuthSuccess}
            onReportOptimistic={(report) => addOptimisticReport(report)}
            onRefreshBuilding={fetchBuilding}
            optimisticReports={optimisticReports}
          />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
