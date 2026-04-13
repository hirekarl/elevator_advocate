import { useState, useEffect } from 'react';
import { Card, ProgressBar, ListGroup, Badge, Alert, Row, Col, Button, Toast, ToastContainer, Modal, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import type { Building, AdvocacyScript, ExecutiveSummary, OptimisticReport } from '../types';

interface BuildingDetailProps {
  buildingData: Building;
  isLoggedIn?: boolean;
  onShowAuth?: () => void;
  onReportOptimistic?: (report: OptimisticReport) => void;
  refreshBuilding?: () => void;
}

export function BuildingDetail({ buildingData, isLoggedIn = false, onShowAuth, onReportOptimistic, refreshBuilding }: BuildingDetailProps) {
  const { t, i18n } = useTranslation();
  const [advocacyScript, setAdvocacyScript] = useState<AdvocacyScript | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('primary');

  // Advocacy modal state
  const [showAdvocacyModal, setShowAdvocacyModal] = useState(false);
  const [advocacyFormData, setAdvocacyFormData] = useState({ sr_number: '', description: '' });
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  const triggerToast = (msg: string, variant: string = 'primary') => {
    setToastMessage(msg);
    setToastVariant(variant);
    setShowToast(true);
  };

  useEffect(() => {
    if (buildingData?.bin) {
      fetchAdvocacyScript();
      fetchExecutiveSummary();
    }
  }, [buildingData?.bin, i18n.language]);

  const fetchAdvocacyScript = async () => {
    setIsLoadingScript(true);
    try {
      const response = await fetch(`http://localhost:8000/api/buildings/${buildingData.bin}/advocacy_script/?lang=${i18n.language}`);
      if (response.ok) {
        const data = await response.json();
        setAdvocacyScript(data);
      }
    } catch (error) {
      console.error("Error fetching advocacy script:", error);
    } finally {
      setIsLoadingScript(false);
    }
  };

  const fetchExecutiveSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await fetch(`http://localhost:8000/api/buildings/${buildingData.bin}/advocacy_summary/?lang=${i18n.language}`);
      if (response.ok) {
        const data = await response.json();
        setExecutiveSummary(data);
      }
    } catch (error) {
      console.error("Error fetching executive summary:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  if (!buildingData) return null;

  const tenantReports = buildingData.recent_reports?.filter(r => !r.is_official) || [];
  const officialReports = buildingData.recent_reports?.filter(r => r.is_official) || [];
  const advocacyLogs = buildingData.advocacy_logs || [];

  const handleReport = async (status: string) => {
    const token = localStorage.getItem('token');
    if (!token) return triggerToast(t('login_required'), 'warning');

    setIsReporting(true);

    if (onReportOptimistic) {
      onReportOptimistic({
        id: Date.now(),
        status,
        time: new Date().toLocaleTimeString(),
        pending: true,
      });
    }

    try {
      const res = await fetch(`http://localhost:8000/api/buildings/${buildingData.bin}/report_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        triggerToast(t('report_status_success'), 'success');
        if (refreshBuilding) refreshBuilding();
      } else {
        const errorData = await res.json();
        triggerToast(errorData.error || t('error_sending_report'), 'danger');
      }
    } catch {
      triggerToast(t('error_sending_report'), 'danger');
    } finally {
      setIsReporting(false);
    }
  };

  const handleLogAdvocacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLog(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:8000/api/buildings/${buildingData.bin}/log_advocacy_action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(advocacyFormData)
      });
      if (res.ok) {
        triggerToast(t('complaint_logged'), 'success');
        setShowAdvocacyModal(false);
        setAdvocacyFormData({ sr_number: '', description: '' });
        if (refreshBuilding) refreshBuilding();
      } else {
        const data = await res.json();
        triggerToast(data.error || t('error_sending_report'), 'danger');
      }
    } catch {
      triggerToast(t('network_error'), 'danger');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleRefreshNews = async () => {
    const token = localStorage.getItem('token');
    if (!token) return triggerToast(t('login_required'), 'warning');
    setIsRefreshingNews(true);
    try {
      const res = await fetch(`http://localhost:8000/api/buildings/${buildingData.bin}/refresh_news/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) {
        triggerToast(t('news_sync_started'), 'success');
      } else {
        triggerToast(t('error_syncing_news'), 'danger');
      }
    } catch {
      triggerToast(t('error_syncing_news'), 'danger');
    } finally {
      setIsRefreshingNews(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'DOWN': return 'danger';
      case 'UNVERIFIED': return 'warning';
      default: return 'success';
    }
  };

  const lossOfService = buildingData.loss_of_service_30d;
  const uptimePct = lossOfService != null ? 100 - lossOfService : null;
  const riskScore = buildingData.failure_risk?.risk_score ?? null;

  return (
    <div className="building-action-center pb-safe">
      {/* Mock Data Warning */}
      {buildingData.is_mocked && (
        <Alert variant="warning" className="border-0 rounded-0 mb-0 py-2 text-center fw-bold small shadow-sm animate-pulse">
          <span aria-hidden="true">🧪</span> {t('dev_mode_mock_data')}
        </Alert>
      )}

      {/* 311 Log Modal */}
      <Modal
        show={showAdvocacyModal}
        onHide={() => setShowAdvocacyModal(false)}
        centered
        aria-labelledby="advocacy-modal-title"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title id="advocacy-modal-title" className="fw-bold">{t('log_311_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <p className="text-secondary small mb-4">{t('log_311_help')}</p>
          <Form onSubmit={handleLogAdvocacy}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">{t('sr_number_label')}</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. 1-1-7654321"
                required
                value={advocacyFormData.sr_number}
                onChange={(e) => setAdvocacyFormData({ ...advocacyFormData, sr_number: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small">{t('notes_label')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="e.g. Spoke to operator 42, they said 3 days."
                value={advocacyFormData.description}
                onChange={(e) => setAdvocacyFormData({ ...advocacyFormData, description: e.target.value })}
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 fw-bold py-2" disabled={isSubmittingLog}>
              {isSubmittingLog ? t('saving') : t('save_history')}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
          bg={toastVariant}
          className={toastVariant === 'light' ? 'text-dark' : 'text-white'}
          aria-live={toastVariant === 'danger' || toastVariant === 'warning' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          <Toast.Body className="fw-medium">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* ZONE 1: Identity & Live Status */}
      <Card className="border-0 shadow mb-4 overflow-hidden">
        <div className={`bg-${getStatusVariant(buildingData.verified_status)} py-2 px-4 text-white fw-bold small text-uppercase`}>
          {buildingData.verified_status === 'UNVERIFIED' ? (
            <><span aria-hidden="true">⚠️</span> {t('verification_pending')} ({buildingData.verification_countdown}m)</>
          ) : (
            <><span aria-hidden="true">✅</span> {t('current_status')}: {buildingData.verified_status}</>
          )}
        </div>
        <Card.Body className="p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-4 gap-3">
            <div>
              <h2 className="fw-bold mb-1 text-primary fs-3 fs-md-2">{buildingData.address}</h2>
              <p className="text-muted mb-0 small">{buildingData.borough} • BIN {buildingData.bin}</p>
            </div>
            {isLoggedIn && (
              <Button
                variant="outline-primary"
                size="sm"
                className="rounded-pill px-3 fw-bold"
                onClick={async () => {
                  try {
                    const res = await fetch('http://localhost:8000/api/auth/set_primary_building/', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({ bin: buildingData.bin })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      localStorage.setItem('primary_building_bin', buildingData.bin);
                      triggerToast(data.message, 'success');
                    }
                  } catch { triggerToast(t('error_setting_home'), 'danger'); }
                }}
              >
                {t('set_as_home')}
              </Button>
            )}
          </div>

          <div className="p-3 bg-light rounded-4 border border-primary border-opacity-10 mb-2">
            <h6 className="fw-bold mb-3 text-secondary text-uppercase small">{t('quick_report_title')}</h6>
            <Row className="g-2 align-items-stretch">
              <Col xs={4} className="d-flex">
                <Button
                  variant="success"
                  disabled={isReporting}
                  aria-label={t('status_up')}
                  className="w-100 py-3 fw-bold shadow-sm d-flex flex-column align-items-center justify-content-center h-100 border-0"
                  onClick={() => handleReport('UP')}
                >
                  <div className="bg-white rounded-circle p-1 mb-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <span className="fs-5" aria-hidden="true">✅</span>
                  </div>
                  <span className="small">{t('status_up').split(' / ')[0].toUpperCase()}</span>
                </Button>
              </Col>
              <Col xs={4} className="d-flex">
                <Button
                  variant="danger"
                  disabled={isReporting}
                  aria-label={t('status_down')}
                  className="w-100 py-3 fw-bold shadow-sm d-flex flex-column align-items-center justify-content-center h-100 border-0"
                  onClick={() => handleReport('DOWN')}
                >
                  <div className="bg-white rounded-circle p-1 mb-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <span className="fs-5" aria-hidden="true">❌</span>
                  </div>
                  <span className="small">{t('status_down').split(' / ')[0].toUpperCase()}</span>
                </Button>
              </Col>
              <Col xs={4} className="d-flex">
                <Button
                  variant="warning"
                  disabled={isReporting}
                  aria-label={t('status_slow')}
                  className="w-100 py-3 fw-bold shadow-sm text-dark d-flex flex-column align-items-center justify-content-center h-100 border-0"
                  onClick={() => handleReport('SLOW')}
                >
                  <div className="bg-dark rounded-circle p-1 mb-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <span className="fs-5" aria-hidden="true">⚠️</span>
                  </div>
                  <span className="small">{t('status_slow').split(' / ')[0].toUpperCase()}</span>
                </Button>
              </Col>
            </Row>
            <p className="mb-0 mt-3 text-muted small">{t('quick_report_help')}</p>
            <p className="mb-0 mt-1 text-muted small">{t('verification_explainer')}</p>

            {/* Emergency reports */}
            <div className="mt-3 pt-3 border-top border-danger border-opacity-25">
              <h6 className="fw-bold small text-danger text-uppercase mb-2">
                <span aria-hidden="true">🚨</span> {t('emergency_reports')}
              </h6>
              <Row className="g-2">
                <Col xs={12} sm={6} className="d-flex">
                  <Button
                    variant="danger"
                    disabled={isReporting}
                    aria-label={t('status_trapped')}
                    className="w-100 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 border-0"
                    onClick={() => handleReport('TRAPPED')}
                  >
                    <span aria-hidden="true">🆘</span>
                    <span>{t('status_trapped_label')}</span>
                  </Button>
                </Col>
                <Col xs={12} sm={6} className="d-flex">
                  <Button
                    variant="outline-danger"
                    disabled={isReporting}
                    aria-label={t('status_unsafe')}
                    className="w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                    onClick={() => handleReport('UNSAFE')}
                  >
                    <span aria-hidden="true">⚠️</span>
                    <span>{t('status_unsafe_label')}</span>
                  </Button>
                </Col>
              </Row>
              <p className="mb-0 mt-2 text-danger small">{t('emergency_reports_note')}</p>
            </div>

            {/* Logged-out inline CTA */}
            {!isLoggedIn && (
              <div className="mt-3 pt-3 border-top d-flex align-items-center justify-content-between gap-3 flex-wrap">
                <small className="text-muted">{t('report_login_cta')}</small>
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-pill px-3 fw-bold flex-shrink-0"
                  onClick={onShowAuth}
                >
                  {t('sign_in')}
                </Button>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* ZONE 2: Insights */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={6}>
          <div className="p-3 bg-white shadow-sm rounded-4 border h-100">
            <h6 className="text-uppercase fw-bold text-muted small mb-3">{t('loss_of_service')}</h6>
            <div className="d-flex align-items-end mb-2">
              <span className="display-6 fw-bold me-2 fs-2">
                {uptimePct != null ? `${uptimePct}%` : '—'}
              </span>
              <span className="text-muted mb-1 pb-1 small">{t('uptime_30d')}</span>
            </div>
            {uptimePct != null && (
              <ProgressBar
                now={uptimePct}
                variant={lossOfService! > 10 ? 'warning' : 'success'}
                style={{ height: '8px' }}
                aria-label={`${uptimePct}% uptime over the last 30 days`}
              />
            )}
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="p-3 bg-white shadow-sm rounded-4 border h-100">
            <h6 className="text-uppercase fw-bold text-muted small mb-3">{t('maintenance_forecast')}</h6>
            <div className="d-flex align-items-end mb-2">
              <span className="display-6 fw-bold me-2 fs-2">
                {riskScore != null ? `${riskScore}%` : '—'}
              </span>
              <span className="text-muted mb-1 pb-1 small">{t('risk_level')}</span>
            </div>
            {riskScore != null && (
              <ProgressBar
                now={riskScore}
                variant={riskScore > 60 ? 'danger' : 'warning'}
                style={{ height: '8px' }}
                aria-label={`${riskScore}% predicted failure risk over the next 7 days`}
              />
            )}
          </div>
        </Col>
      </Row>

      {/* ZONE 2.5: AI Executive Summary */}
      {(isLoadingSummary || executiveSummary) && (
        <Card className="border-0 shadow-sm mb-4 rounded-4 overflow-hidden border-start border-primary border-5">
          <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0">
              <span className="me-2" aria-hidden="true">🧠</span> {t('executive_summary_title')}
            </h5>
            {executiveSummary && (
              <Badge bg={executiveSummary.risk_level === 'Critical' ? 'danger' : 'warning'} className="px-3 py-2 rounded-pill">
                {t('risk_level_label')}: {executiveSummary.risk_level}
              </Badge>
            )}
          </Card.Header>
          <Card.Body className="px-4 pb-4">
            {isLoadingSummary ? (
              <div className="py-4 text-center">
                <div
                  className="spinner-border text-primary mb-2"
                  role="status"
                  aria-label={t('generating_summary')}
                />
                <p className="text-muted small mb-0" aria-hidden="true">{t('generating_summary')}</p>
              </div>
            ) : executiveSummary && (
              <Row className="g-4">
                <Col md={6}>
                  <h6 className="fw-bold text-uppercase small text-muted mb-2">{t('historical_patterns_title')}</h6>
                  <p className="small mb-0">{executiveSummary.historical_patterns}</p>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold text-uppercase small text-muted mb-2">{t('community_sentiment_title')}</h6>
                  <p className="small mb-0">{executiveSummary.community_sentiment}</p>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold text-uppercase small text-muted mb-2">{t('legal_standing_title')}</h6>
                  <p className="small mb-0">{executiveSummary.legal_standing}</p>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold text-uppercase small text-muted mb-2">{t('recommended_action_title')}</h6>
                  <p className="small fw-bold text-primary mb-0">{executiveSummary.recommended_action}</p>
                </Col>
                <Col xs={12} className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                  <small className="text-muted">{t('confidence_label')}: {(executiveSummary.confidence_score * 100).toFixed(0)}%</small>
                  <Button variant="link" size="sm" className="p-0 text-decoration-none small" onClick={fetchExecutiveSummary}>
                    <span aria-hidden="true">🔄</span> {t('refresh_analysis')}
                  </Button>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>
      )}

      {/* ZONE 3: Advocacy Center */}
      <h4 className="fw-bold mb-3 mt-5 d-flex align-items-center">
        <span className="me-2" aria-hidden="true">📢</span> {t('advocacy_center')}
      </h4>

      {/* Call 311 Now */}
      <a
        href="tel:311"
        className="d-flex align-items-center justify-content-between p-3 mb-3 bg-danger text-white rounded-4 text-decoration-none fw-bold shadow-sm"
        aria-label={`${t('call_311_now')} — ${t('call_311_number')}`}
      >
        <div>
          <div className="fs-6"><span aria-hidden="true">📞</span> {t('call_311_now')}</div>
          <small className="fw-normal opacity-75">{t('call_311_desc')}</small>
        </div>
        <div className="text-end">
          <div className="fw-bold">{t('call_311_number')}</div>
          <small className="fw-normal opacity-75">{t('or_dial_311')}</small>
        </div>
      </a>

      {/* AI Advocacy Script */}
      <Card className="border-0 shadow-sm bg-primary text-white mb-4 overflow-hidden rounded-4">
        <Card.Body className="p-4">
          {isLoadingScript ? (
            <div className="py-2 d-flex align-items-center gap-3">
              <div
                className="spinner-border spinner-border-sm text-white"
                role="status"
                aria-label={t('generating_strategy')}
              />
              <span className="text-white-50 small" aria-hidden="true">{t('generating_strategy')}</span>
            </div>
          ) : advocacyScript ? (
            <>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h6 className="fw-bold text-info mb-0">{advocacyScript.headline}</h6>
                {isLoggedIn && (
                  <Button
                    variant="info"
                    size="sm"
                    className="rounded-pill px-3 fw-bold text-white shadow-sm"
                    onClick={() => setShowAdvocacyModal(true)}
                  >
                    <span aria-hidden="true">📝</span> {t('log_this_call')}
                  </Button>
                )}
              </div>
              <div className="p-3 bg-white text-dark rounded-3 border-start border-info border-5 mb-3 shadow-sm">
                <div className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>
                  {advocacyScript.script}
                </div>
              </div>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                <small className="text-white-50">Legal: {advocacyScript.legal_reference}</small>
                <Button
                  variant="light"
                  size="sm"
                  className="rounded-pill px-4 fw-bold shadow-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(advocacyScript.script);
                    triggerToast(t('script_copied'), 'info');
                  }}
                >
                  {t('copy_script')}
                </Button>
              </div>
            </>
          ) : (
            <p className="mb-0 text-white-50">{t('no_strategy_available')}</p>
          )}
        </Card.Body>
      </Card>

      {/* ZONE 4: Advocacy Paper Trail */}
      <Card className="border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
        <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">
            <span className="me-2" aria-hidden="true">📜</span> {t('paper_trail_title')}
          </h5>
          {isLoggedIn && (
            <Button
              variant="primary"
              size="sm"
              className="rounded-pill px-3 fw-bold shadow-sm"
              onClick={() => setShowAdvocacyModal(true)}
            >
              + {t('log_311_title')}
            </Button>
          )}
        </Card.Header>
        <Card.Body className="px-4 pb-4">
          <Row className="g-4">
            <Col lg={12}>
              <h6 className="fw-bold mb-3 text-primary small text-uppercase">{t('my_personal_trail')}</h6>
              {advocacyLogs.length > 0 ? (
                <ListGroup variant="flush">
                  {advocacyLogs.map((log, idx) => (
                    <ListGroup.Item key={idx} className="px-0 py-3 border-light">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <span className="badge bg-primary-subtle text-primary mb-2 me-2">SR {log.sr_number}</span>
                          <span className={`badge ${log.outcome === 'Pending' ? 'bg-secondary' : 'bg-info'} mb-2`}>{log.outcome}</span>
                          <p className="mb-1 fw-bold small">{log.description || "311 Complaint Filed"}</p>
                          <small className="text-secondary">{new Date(log.created_at).toLocaleString()}</small>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <Alert variant="light" className="border-dashed py-4 text-center">
                  <small className="text-muted fst-italic">{t('no_personal_logs')}</small>
                </Alert>
              )}
            </Col>

            <Col md={6}>
              <h6 className="fw-bold mb-3 text-success small text-uppercase">{t('community_reports')}</h6>
              <ListGroup variant="flush" className="border rounded bg-light p-2">
                {tenantReports.length > 0 ? (
                  tenantReports.slice(0, 5).map((report, idx) => (
                    <ListGroup.Item key={idx} className="bg-transparent px-2 py-2 border-light small">
                      <Badge bg={report.status === 'UP' ? 'success' : 'danger'} className="me-2">{report.status}</Badge>
                      <span className="text-muted">{new Date(report.reported_at).toLocaleDateString()}</span>
                    </ListGroup.Item>
                  ))
                ) : (
                  <div className="p-3 text-center small text-muted">{t('no_community_reports')}</div>
                )}
              </ListGroup>
            </Col>

            <Col md={6}>
              <h6 className="fw-bold mb-3 text-info small text-uppercase">{t('official_history')}</h6>
              <ListGroup variant="flush" className="border rounded bg-light p-2">
                {officialReports.length > 0 ? (
                  officialReports.slice(0, 5).map((report, idx) => (
                    <ListGroup.Item key={idx} className="bg-transparent px-2 py-2 border-light small">
                      <Badge bg="info" className="me-2">DOB</Badge>
                      <span className="text-muted">{new Date(report.reported_at).toLocaleDateString()}</span>
                    </ListGroup.Item>
                  ))
                ) : (
                  <div className="p-3 text-center small text-muted">{t('no_official_data')}</div>
                )}
              </ListGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Share / Advocacy */}
      <Card className="border-0 shadow-sm mb-5 bg-white rounded-4">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h5 className="fw-bold mb-2">{t('help_advocate_title')}</h5>
              <p className="text-secondary mb-0 small">{t('help_advocate_desc')}</p>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <Button
                variant="outline-primary"
                className="fw-bold rounded-pill px-4 w-100 w-md-auto mb-2"
                onClick={() => {
                  const summary = `Elevator Advocacy Report: ${buildingData.address}\n` +
                    `- 30-Day Service Loss: ${lossOfService != null ? `${lossOfService}%` : '—'}\n` +
                    `- Current Status: ${buildingData.verified_status}\n` +
                    `- Active Complaints: ${advocacyLogs.length}`;
                  navigator.clipboard.writeText(summary);
                  triggerToast(t('summary_copied'), 'success');
                }}
              >
                {t('copy_summary')}
              </Button>
              <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Elevator Advocacy Report: ${buildingData.address}\n- 30-Day Service Loss: ${lossOfService != null ? `${lossOfService}%` : '—'}\n- Current Status: ${buildingData.verified_status}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge bg-dark px-3 py-2 fw-medium rounded-pill text-decoration-none"
                  aria-label="Share building status via WhatsApp"
                >
                  Share via WhatsApp
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(`Elevator Issue: ${buildingData.address}`)}&body=${encodeURIComponent(`Elevator Advocacy Report: ${buildingData.address}\n- 30-Day Service Loss: ${lossOfService != null ? `${lossOfService}%` : '—'}\n- Current Status: ${buildingData.verified_status}`)}`}
                  className="badge bg-dark px-3 py-2 fw-medium rounded-pill text-decoration-none"
                  aria-label="Email building status to a representative"
                >
                  Email Representative
                </a>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* News */}
      <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
        <h4 className="fw-bold mb-0">
          <span aria-hidden="true">📰</span> {t('news_section')}
        </h4>
        <Button
          variant="outline-secondary"
          size="sm"
          className="rounded-pill px-3 fw-bold"
          aria-label={`${t('refresh')} ${t('news_section')}`}
          disabled={isRefreshingNews}
          onClick={handleRefreshNews}
        >
          {isRefreshingNews ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
              {t('syncing')}
            </>
          ) : t('refresh')}
        </Button>
      </div>

      <Row className="g-3">
        {buildingData.news_articles && buildingData.news_articles.length > 0 ? (
          buildingData.news_articles.map((article, idx) => (
            <Col md={6} key={idx}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <small className="text-primary fw-bold text-uppercase fs-8">{article.source}</small>
                      {article.is_mocked && (
                        <Badge bg="secondary" className="fs-10 text-uppercase fw-bold opacity-75">Mock</Badge>
                      )}
                    </div>
                    <small className="text-muted fs-8">{article.published_date}</small>
                  </div>
                  <h6 className="fw-bold mb-2">{article.title}</h6>
                  <p className="text-muted fs-8 mb-3">{article.summary}</p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-link p-0 fs-8 fw-bold"
                    aria-label={`${t('read_full_story')}: ${article.title}`}
                  >
                    {t('read_full_story')} →
                  </a>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <Alert variant="light" className="border-dashed py-4 text-center text-muted small">
              {t('no_media_mentions')}
            </Alert>
          </Col>
        )}
      </Row>
    </div>
  );
}
