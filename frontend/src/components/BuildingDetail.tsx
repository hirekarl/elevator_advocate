import { useState, useEffect } from 'react';
import { Card, ProgressBar, ListGroup, Badge, Alert, Row, Col, Button, Toast, ToastContainer, Modal, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface BuildingDetailProps {
  buildingData: any;
}

export function BuildingDetail({ buildingData }: BuildingDetailProps) {
  const { t } = useTranslation();
  const [advocacyScript, setAdvocacyScript] = useState<any>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  
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
  }, [buildingData?.bin]);

  const fetchAdvocacyScript = async () => {
    setIsLoadingScript(true);
    try {
      const response = await fetch(`http://localhost:8000/api/buildings/${buildingData.bin}/advocacy_script/`);
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
    if (!token) return triggerToast("Please log in to report status.", "warning");
    
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
        // Reload building data would happen here via parent refresh
      }
    } catch (e) {
      triggerToast("Error sending report.", "danger");
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
        // Ideally trigger parent refresh here
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

  return (
    <div className="building-action-center">
      {/* 311 Log Modal */}
      <Modal show={showAdvocacyModal} onHide={() => setShowAdvocacyModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Log 311 Complaint</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <p className="text-secondary small mb-4">Martha, if you called 311, enter the number they gave you here. This helps you track the city's response.</p>
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

      {/* Feedback Toast */}
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

      {/* MARTHA-MODE: Quick Report Buttons */}
      <Card className="border-0 shadow-sm mb-4 bg-warning-subtle border-start border-warning border-4">
        <Card.Body className="p-4">
          <h5 className="fw-bold mb-3">Is the elevator working right now?</h5>
          <div className="d-grid gap-3 d-md-flex">
            <Button 
              variant="success" 
              className="px-4 py-3 fw-bold fs-5 shadow-sm"
              onClick={() => handleReport('UP')}
            >
              ✅ YES, IT'S WORKING
            </Button>
            <Button 
              variant="danger" 
              className="px-4 py-3 fw-bold fs-5 shadow-sm"
              onClick={() => handleReport('DOWN')}
            >
              ❌ NO, IT'S BROKEN
            </Button>
            <Button 
              variant="warning" 
              className="px-4 py-3 fw-bold fs-5 shadow-sm text-dark"
              onClick={() => handleReport('SLOW')}
            >
              ⚠️ IT'S SLOW / UNSAFE
            </Button>
          </div>
          <p className="mt-3 mb-0 text-secondary small">Martha, just tap the big button above to tell your neighbors what you see at the elevator.</p>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h2 className="fw-bold mb-1 text-primary">{buildingData.address}</h2>
              <p className="text-muted mb-0">{buildingData.borough} • BIN {buildingData.bin}</p>
            </div>
            <Badge 
              bg={buildingData.verified_status === 'DOWN' ? 'danger' : (buildingData.verified_status === 'UNVERIFIED' ? 'warning' : 'success')} 
              className={`px-3 py-2 fs-6 ${buildingData.verified_status === 'UNVERIFIED' ? 'animate-pulse text-dark border border-dark' : ''}`}
            >
              {buildingData.verified_status === 'UNVERIFIED' 
                ? `Status: Unverified (${buildingData.verification_countdown}m left)` 
                : `Status: ${buildingData.verified_status}`}
            </Badge>

          </div>

          {localStorage.getItem('token') && (
            <div className="mb-4">
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="rounded-pill px-3"
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
                    } else {
                      triggerToast(data.error || 'Error setting home building', 'danger');
                    }
                  } catch (e) {
                    console.error("Home building error:", e);
                    triggerToast("Network error occurred", "danger");
                  }
                }}
              >
                Set as Home Building
              </Button>
            </div>
          )}

          <Row className="g-4 mt-2">
            <Col md={6}>
              <div className="p-3 bg-light rounded border">
                <h6 className="text-uppercase fw-bold text-muted small mb-3">Service Reliability</h6>
                <div className="d-flex align-items-end mb-2">
                  <span className="display-6 fw-bold me-2">{100 - (buildingData.loss_of_service_30d || 0)}%</span>
                  <span className="text-muted mb-1 pb-1">Uptime (30d)</span>
                </div>
                <ProgressBar 
                  now={100 - (buildingData.loss_of_service_30d || 0)} 
                  variant={buildingData.loss_of_service_30d > 10 ? 'warning' : 'success'}
                  style={{ height: '8px' }}
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="p-3 bg-light rounded border">
                <h6 className="text-uppercase fw-bold text-muted small mb-3">Maintenance Forecast</h6>
                <div className="d-flex align-items-end mb-2">
                  <span className="display-6 fw-bold me-2">{buildingData.failure_risk?.risk_score || 0}%</span>
                  <span className="text-muted mb-1 pb-1">Risk Level</span>
                </div>
                <ProgressBar 
                  now={buildingData.failure_risk?.risk_score || 0} 
                  variant={buildingData.failure_risk?.risk_score > 60 ? 'danger' : 'warning'}
                  style={{ height: '8px' }}
                />
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 311 Advocacy Script Section */}
      <h4 className="fw-bold mb-4 mt-5">Advocacy Center</h4>
      <Card className="border-0 shadow-sm bg-primary text-white mb-5 overflow-hidden">
        <Card.Body className="p-4 position-relative">
          <div className="position-relative" style={{ zIndex: 1 }}>
            <div className="d-flex align-items-center mb-3">
              <span role="img" aria-label="Loudspeaker" className="fs-3 me-2">📢</span>
              <h5 className="fw-bold mb-0">311 Reporting Script</h5>
            </div>
            {isLoadingScript ? (
              <p className="mb-0 italic text-white-50">Generating custom advocacy strategy...</p>
            ) : advocacyScript ? (
              <>
                <h6 className="fw-bold text-info mb-3">{advocacyScript.headline}</h6>
                <div className="p-3 bg-white text-dark rounded border-start border-info border-4 mb-3">
                  <pre className="mb-0 text-wrap font-monospace small" style={{ whiteSpace: 'pre-wrap' }}>
                    {advocacyScript.script}
                  </pre>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-white-50">Legal Context: {advocacyScript.legal_reference}</small>
                  <Button 
                    variant="light" 
                    size="sm" 
                    className="rounded-pill px-3 fw-bold"
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
          </div>
          <div className="position-absolute bottom-0 end-0 opacity-10" style={{ fontSize: '100px', transform: 'translate(20%, 20%)' }}>
            <span role="img" aria-label="Balance Scales Decoration">⚖️</span>
          </div>
        </Card.Body>
      </Card>

      <h4 className="fw-bold mb-4 mt-5">Advocate Toolkit</h4>
      <Card className="border-0 shadow-sm mb-5 bg-light">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h5 className="fw-bold mb-2">Help Martha Advocate</h5>
              <p className="text-secondary mb-0">Does your niece or an advocate need to help you? This section provides hard data they can use when calling elected officials or the building manager.</p>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <Button 
                variant="outline-primary" 
                className="fw-bold rounded-pill px-4"
                onClick={() => {
                  const summary = `Elevator Advocacy Report: ${buildingData.address}\n` +
                    `- 30-Day Service Loss: ${buildingData.loss_of_service_30d}%\n` +
                    `- Current Status: ${buildingData.verified_status}\n` +
                    `- Legal Code: NYC Admin Code §27-2005 (Housing Maintenance Code)\n` +
                    `- My Active Complaints: ${advocacyLogs.length} logged in my paper trail.`;
                  
                  navigator.clipboard.writeText(summary);
                  triggerToast("Advocacy Summary copied for sharing!", "success");
                }}
              >
                Copy Advocacy Summary
              </Button>
            </Col>
          </Row>
          <hr className="my-4 opacity-10" />
          <div className="d-flex flex-wrap gap-2">
            <Badge bg="dark" className="px-3 py-2 fw-medium">Share via WhatsApp</Badge>
            <Badge bg="dark" className="px-3 py-2 fw-medium">Email Representative</Badge>
            <Badge bg="dark" className="px-3 py-2 fw-medium">Download Hardship PDF (Coming Soon)</Badge>
          </div>
        </Card.Body>
      </Card>

      <h4 className="fw-bold mb-4">Historical Action Timeline</h4>
      
      <Row className="mb-5">
        <Col md={12}>
          <Card className="border-0 shadow-sm border-start border-primary border-4">
            <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-0">Advocacy Paper Trail</h5>
                <p className="small text-secondary fw-medium">Track your 311 complaints and legal evidence here.</p>
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                className="rounded-pill px-3 fw-bold"
                onClick={() => setShowAdvocacyModal(true)}
              >
                + Log 311 Complaint
              </Button>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {advocacyLogs.length > 0 ? (
                <ListGroup variant="flush">
                  {advocacyLogs.map((log: any, idx: number) => (
                    <ListGroup.Item key={idx} className="px-0 py-3 border-light">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <span className="badge bg-primary-subtle text-primary mb-2 me-2">SR {log.sr_number}</span>
                          <span className={`badge ${log.outcome === 'Pending' ? 'bg-secondary' : 'bg-info'} mb-2`}>{log.outcome}</span>
                          <p className="mb-1 fw-bold">{log.description || "311 Complaint Filed"}</p>
                          <small className="text-secondary">{new Date(log.created_at).toLocaleString()}</small>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <Alert variant="light" className="border-dashed py-4 text-center">
                  <p className="mb-0 text-secondary">No personal advocacy history logged yet.</p>
                  <small className="text-muted italic">Log a 311 number to start your paper trail.</small>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">Tenant Community Reports</h5>
              <p className="small text-muted">Real-time issues reported by your neighbors.</p>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <ListGroup variant="flush">
                {tenantReports.length > 0 ? (
                  tenantReports.map((report: any, idx: number) => (
                    <ListGroup.Item key={idx} className="px-0 py-3 border-light">
                      <div className="d-flex justify-content-between">
                        <Badge bg={report.status === 'UP' ? 'success-subtle' : 'danger-subtle'} className={`text-${report.status === 'UP' ? 'success' : 'danger'} mb-2`}>
                          {report.status}
                        </Badge>
                        <small className="text-muted">{new Date(report.reported_at).toLocaleDateString()}</small>
                      </div>
                      <p className="mb-0 small fw-medium">User reported elevator as {report.status.toLowerCase()}.</p>
                    </ListGroup.Item>
                  ))
                ) : (
                  <Alert variant="light" className="border-dashed py-4 text-center">No community reports logged.</Alert>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">Official DOB History</h5>
              <p className="small text-muted">Official complaints synced from NYC Open Data.</p>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <ListGroup variant="flush">
                {officialReports.length > 0 ? (
                  officialReports.map((report: any, idx: number) => (
                    <ListGroup.Item key={idx} className="px-0 py-3 border-light">
                      <div className="d-flex justify-content-between">
                        <Badge bg="info-subtle" className="text-info mb-2">DOB COMPLAINT</Badge>
                        <small className="text-muted">{new Date(report.reported_at).toLocaleDateString()}</small>
                      </div>
                      <p className="mb-0 small fw-medium">Official record of elevator inoperative.</p>
                    </ListGroup.Item>
                  ))
                ) : (
                  <Alert variant="light" className="border-dashed py-4 text-center">No official DOB complaints found.</Alert>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
        <h4 className="fw-bold mb-0">Public Media & Local News</h4>
        <button 
          className="btn btn-sm btn-outline-secondary rounded-pill px-3"
          onClick={async () => {
            const token = localStorage.getItem('token');
            if (!token) return triggerToast("Please log in to refresh building data.", "warning");
            
            try {
              const res = await fetch(`http://localhost:8000/api/buildings/${buildingData.bin}/refresh_news/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${token}` }
              });
              
              const data = await res.json();
              
              if (res.ok) {
                triggerToast("Data sync started. New articles will appear shortly.", "success");
              } else if (res.status === 429) {
                triggerToast(data.message || "Cooldown in effect. Please try again later.", "warning");
              } else {
                triggerToast(data.error || "An error occurred.", "danger");
              }
            } catch (e) {
              console.error("Refresh error:", e);
              triggerToast("Network error occurred", "danger");
            }
          }}
        >
          Refresh Media History
        </button>
      </div>
      <p className="text-muted mb-4">Contextual news reports regarding this building's record of service and safety.</p>
      
      <Row className="g-4">
        {buildingData.news_articles && buildingData.news_articles.length > 0 ? (
          buildingData.news_articles.map((article: any, idx: number) => (
            <Col md={6} key={idx}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between mb-2">
                    <small className="text-primary fw-bold text-uppercase">{article.source}</small>
                    <small className="text-muted">{article.published_date}</small>
                  </div>
                  <h5 className="fw-bold mb-3">{article.title}</h5>
                  <p className="text-muted small mb-4">{article.summary}</p>
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-outline-primary btn-sm rounded-pill px-3"
                    aria-label={`Read full article: ${article.title} (opens in new window)`}
                  >
                    Read Article
                  </a>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <Alert variant="light" className="border-dashed py-5 text-center">
              <p className="mb-0 text-muted">No media mentions found for this building yet.</p>
              <small className="text-muted italic">(News synchronization is performed automatically for active buildings.)</small>
            </Alert>
          </Col>
        )}
      </Row>
    </div>
  );
}
