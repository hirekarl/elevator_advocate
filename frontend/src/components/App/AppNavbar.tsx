import { Navbar, Container, Button, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AppNavbarProps {
  isLoggedIn: boolean;
  username: string;
  onLogout: () => void;
  onShowAuthModal: () => void;
  onShowGuide: () => void;
  toggleLanguage: () => void;
}

export function AppNavbar({
  isLoggedIn,
  username,
  onLogout,
  onShowAuthModal,
  onShowGuide,
  toggleLanguage
}: AppNavbarProps) {
  const { t, i18n } = useTranslation();

  return (
    <Navbar variant="dark" expand="lg" className="shadow-sm sticky-top py-2 py-lg-3 app-navbar" aria-label={t('guide_modal_label')}>
      <Container>
        <Navbar.Brand
          as={Link}
          to="/"
          className="d-flex align-items-center gap-2"
        >
          <span className="brand-mark" aria-hidden="true">▲</span>
          ELEVATOR ADVOCATE
        </Navbar.Brand>
        <div className="d-flex align-items-center ms-auto">
          <Link
            to="/data"
            className="ds-nav-link me-2 me-md-3 fs-7"
          >
            {t('nav_data')}
          </Link>
          <Button
            variant="link"
            className="text-info text-decoration-none fw-bold me-2 me-md-3 p-0 fs-7 fs-md-6"
            onClick={onShowGuide}
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
                <Dropdown.Item onClick={onLogout}>{t('log_out')}</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="fw-bold px-3 rounded-pill"
              onClick={onShowAuthModal}
            >
              {t('login_button')}
            </Button>
          )}
        </div>
      </Container>
    </Navbar>
  );
}
