import { useState, useEffect } from 'react';
import { Card, ProgressBar, ListGroup, Badge, Alert, Row, Col, Button, Toast, ToastContainer, Modal, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface BuildingDetailProps {
  buildingData: any;
  isLoggedIn?: boolean;
  onShowAuth?: () => void;
  onReportOptimistic?: (report: any) => void;
  refreshBuilding?: () => void;
}

export function BuildingDetail({ buildingData, isLoggedIn = false, onShowAuth, onReportOptimistic, refreshBuilding }: BuildingDetailProps) {
  const { t, i18n } = useTranslation();
  const [advocacyScript, setAdvocacyScript] = useState<any>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  
  // Toast State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('primary');

  // Advocacy Modal State
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

  if (!buildingData) return null;

  const tenantReports = buildingData.recent_reports?.filter((r: any) => !r.is_official) || [];
  const officialReports = buildingData.recent_reports?.filter((r: any) => r.is_official) || [];
  const advocacyLogs = buildingData.advocacy_logs || [];

  const handleReport = async (status: string) => {
    const token = localStorage.getItem('token');
    if (!token) return triggerToast(t('login_required'), "warning");
    
    setIsReporting(true);

    // Optimistic UI update
    if (onReportOptimistic) {
      onReportOptimistic({ 
        id: Date.now(), 
        status, 
        time: new Date().toLocaleTimeString(),
        pending: true 
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
        triggerToast(`Status reported as ${status}!`, "success");
        if (refreshBuilding) refreshBuilding();
      } else {
        const errorData = await res.json();
        triggerToast(errorData.error || "Error sending report.", "danger");
      }
    } catch (e) {
      triggerToast("Error sending report.", "danger");
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
        triggerToast("Complaint logged to your paper trail!", "success");
        setShowAdvocacyModal(false);
        setAdvocacyFormData({ sr_number: '', description: '' });
        if (refreshBuilding) refreshBuilding();
      } else {
        const data = await res.json();
        triggerToast(data.error || "Failed to log complaint.", "danger");
      }
    } catch (e) {
      triggerToast("Network error.", "danger");
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'DOWN': return 'danger';
      case 'UNVERIFIED': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div className="building-action-center pb-safe">
      {/* Modals & Toasts */}
      <Modal show={showAdvocacyModal} onHide={() => setShowAdvocacyModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{t('log_311_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <p className="text-secondary small mb-4">{t('log_311_help')}</p>
          <Form onSubmit={handleLogAdvocacy}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Service Request (SR) Number</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. 1-1-7654321" 
                required
                value={advocacyFormData.sr_number}
                onChange={(e) => setAdvocacyFormData({...advocacyFormData, sr_number: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold small">Notes (Optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                placeholder="e.g. Spoke to operator 42, they said 3 days."
                value={advocacyFormData.description}
                onChange={(e) => setAdvocacyFormData({...advocacyFormData, description: e.target.value})}
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 fw-bold py-2" disabled={isSubmittingLog}>
              {isSubmittingLog ? "Saving..." : "Save to My History"}
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
            <><span aria-hidden="true">✅</span> Current Status: {buildingData.verified_status}</>
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
                  } catch (e) { triggerToast("Error setting home building", "danger"); }
                }}
              >
                Set as Home
              </Button>
            )}
          </div>

          <div className="p-3 bg-light rounded-4 border border-primary border-opacity-10 mb-2">
            <h6 className="fw-bold mb-3 text-secondary text-uppercase small">{t('quick_report_title')}</h6>
            <Row className="g-2 align-items-stretch">
              <Col xs={4} md={4} className="d-flex">
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
              <Col xs={4} md={4} className="d-flex">
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
              <Col xs={4} md={4} className="d-flex">
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
            <p className="mb-0 mt-3 text-muted small">
              {t('quick_report_help')}
            </p>
            <p className="mb-0 mt-1 text-muted small">
              {t('verification_explainer')}
            </p>

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
              <span className="display-6 fw-bold me-2 fs-2">{100 - (buildingData.loss_of_service_30d || 0)}%</span>
              <span className="text-muted mb-1 pb-1 small">Uptime (30d)</span>
            </div>
            <ProgressBar
              now={100 - (buildingData.loss_of_service_30d || 0)}
              variant={buildingData.loss_of_service_30d > 10 ? 'warning' : 'success'}
              style={{ height: '8px' }}
              aria-label={`${100 - (buildingData.loss_of_service_30d || 0)}% uptime over the last 30 days`}
            />
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="p-3 bg-white shadow-sm rounded-4 border h-100">
            <h6 className="text-uppercase fw-bold text-muted small mb-3">Maintenance Forecast</h6>
            <div className="d-flex align-items-end mb-2">
              <span className="display-6 fw-bold me-2 fs-2">{buildingData.failure_risk?.risk_score || 0}%</span>
              <span className="text-muted mb-1 pb-1 small">Risk Level</span>
            </div>
            <ProgressBar
              now={buildingData.failure_risk?.risk_score || 0}
              variant={buildingData.failure_risk?.risk_score > 60 ? 'danger' : 'warning'}
              style={{ height: '8px' }}
              aria-label={`${buildingData.failure_risk?.risk_score || 0}% predicted failure risk over the next 7 days`}
            />
          </div>
        </Col>
      </Row>

      {/* ZONE 3: Advocacy */}
      <h4 className="fw-bold mb-3 mt-5 d-flex align-items-center">
        <span className="me-2">📢</span> {t('advocacy_center')}
      </h4>
      <Card className="border-0 shadow-sm bg-primary text-white mb-4 overflow-hidden rounded-4">
        <Card.Body className="p-4">
          {isLoadingScript ? (
            <p className="mb-0 italic text-white-50">Generating custom advocacy strategy...</p>
          ) : advocacyScript ? (
            <>
              <h6 className="fw-bold text-info mb-3">{advocacyScript.headline}</h6>
              <div className="p-3 bg-white text-dark rounded-3 border-start border-info border-5 mb-3">
                <pre className="mb-0 text-wrap font-monospace small" style={{ whiteSpace: 'pre-wrap' }}>
                  {advocacyScript.script}
                </pre>
              </div>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                <small className="text-white-50">Legal: {advocacyScript.legal_reference}</small>
                <Button 
                  variant="light" 
                  size="sm" 
                  className="rounded-pill px-4 fw-bold shadow-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(advocacyScript.script);
                    triggerToast("Script copied to clipboard!", "info");
                  }}
                >
                  Copy Script
                </Button>
              </div>
            </>
          ) : (
            <p className="mb-0 text-white-50">No advocacy strategy available for this building status.</p>
          )}
        </Card.Body>
      </Card>

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
                className="fw-bold rounded-pill px-4 w-100 w-md-auto"
                onClick={() => {
                  const summary = `Elevator Advocacy Report: ${buildingData.address}\n` +
                    `- 30-Day Service Loss: ${buildingData.loss_of_service_30d}%\n` +
                    `- Current Status: ${buildingData.verified_status}\n` +
                    `- Active Complaints: ${advocacyLogs.length}`;
                  navigator.clipboard.writeText(summary);
                  triggerToast("Summary copied for sharing!", "success");
                }}
              >
                Copy Summary
              </Button>
            </Col>
          </Row>
          <hr className="my-4 opacity-10" />
          <div className="d-flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Elevator Advocacy Report: ${buildingData.address}\n- 30-Day Service Loss: ${buildingData.loss_of_service_30d}%\n- Current Status: ${buildingData.verified_status}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="badge bg-dark px-3 py-2 fw-medium rounded-pill text-decoration-none"
              aria-label="Share building status via WhatsApp"
            >
              Share via WhatsApp
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Elevator Issue: ${buildingData.address}`)}&body=${encodeURIComponent(`Elevator Advocacy Report: ${buildingData.address}\n- 30-Day Service Loss: ${buildingData.loss_of_service_30d}%\n- Current Status: ${buildingData.verified_status}`)}`}
              className="badge bg-dark px-3 py-2 fw-medium rounded-pill text-decoration-none"
              aria-label="Email building status to a representative"
            >
              Email Representative
            </a>
          </div>
        </Card.Body>
      </Card>

      {/* ZONE 4: Evidence Timeline */}
      <h4 className="fw-bold mb-3 mt-5 d-flex align-items-center">
        <span className="me-2">📜</span> {t('paper_trail_title')}
      </h4>
      <Card className="border-0 shadow-sm mb-5 rounded-4 overflow-hidden">
        <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
          <div>
            <h6 className="fw-bold mb-0 text-uppercase small text-muted">Evidence & History</h6>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            className="rounded-pill px-3 fw-bold shadow-sm"
            onClick={() => setShowAdvocacyModal(true)}
          >
            + {t('log_311_title')}
          </Button>
        </Card.Header>
        <Card.Body className="px-4 pb-4">
          <Row className="g-4">
            <Col lg={12}>
              <h6 className="fw-bold mb-3 text-primary small text-uppercase">My Personal Trail</h6>
              {advocacyLogs.length > 0 ? (
                <ListGroup variant="flush">
                  {advocacyLogs.map((log: any, idx: number) => (
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
                  <small className="text-muted italic">No personal logs. Tap + to add a 311 SR#.</small>
                </Alert>
              )}
            </Col>
            
            <Col md={6}>
              <h6 className="fw-bold mb-3 text-success small text-uppercase">{t('community_reports')}</h6>
              <ListGroup variant="flush" className="border rounded bg-light p-2">
                {tenantReports.length > 0 ? (
                  tenantReports.slice(0, 5).map((report: any, idx: number) => (
                    <ListGroup.Item key={idx} className="bg-transparent px-2 py-2 border-light small">
                      <Badge bg={report.status === 'UP' ? 'success' : 'danger'} className="me-2">{report.status}</Badge>
                      <span className="text-muted">{new Date(report.reported_at).toLocaleDateString()}</span>
                    </ListGroup.Item>
                  ))
                ) : (
                  <div className="p-3 text-center small text-muted">No community reports.</div>
                )}
              </ListGroup>
            </Col>

            <Col md={6}>
              <h6 className="fw-bold mb-3 text-info small text-uppercase">{t('official_history')}</h6>
              <ListGroup variant="flush" className="border rounded bg-light p-2">
                {officialReports.length > 0 ? (
                  officialReports.slice(0, 5).map((report: any, idx: number) => (
                    <ListGroup.Item key={idx} className="bg-transparent px-2 py-2 border-light small">
                      <Badge bg="info" className="me-2">DOB</Badge>
                      <span className="text-muted">{new Date(report.reported_at).toLocaleDateString()}</span>
                    </ListGroup.Item>
                  ))
                ) : (
                  <div className="p-3 text-center small text-muted">No official DOB data.</div>
                )}
              </ListGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
        <h4 className="fw-bold mb-0">📰 {t('news_section')}</h4>
        <button
          className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold"
          aria-label={t('news_section') + ' refresh'}
          onClick={async () => {
            const token = localStorage.getItem('token');
            if (!token) return triggerToast(t('login_required'), "warning");
            try {
              const res = await fetch(`http://localhost:8000/api/buildings/${buildingData.bin}/refresh_news/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${token}` }
              });
              if (res.ok) triggerToast("Sync started!", "success");
            } catch (e) { triggerToast("Error syncing news", "danger"); }
          }}
        >
          Refresh
        </button>
      </div>
      
      <Row className="g-3">
        {buildingData.news_articles && buildingData.news_articles.length > 0 ? (
          buildingData.news_articles.map((article: any, idx: number) => (
            <Col md={6} key={idx}>
              <Card className="h-100 border-0 shadow-sm rounded-4">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between mb-2">
                    <small className="text-primary fw-bold text-uppercase fs-8">{article.source}</small>
                    <small className="text-muted fs-8">{article.published_date}</small>
                  </div>
                  <h6 className="fw-bold mb-2">{article.title}</h6>
                  <p className="text-muted fs-8 mb-3">{article.summary}</p>
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn btn-link p-0 fs-8 fw-bold" aria-label={`Read full story: ${article.title}`}>Read Full Story →</a>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <Alert variant="light" className="border-dashed py-4 text-center text-muted small">No media mentions found.</Alert>
          </Col>
        )}
      </Row>
    </div>
  );
}
