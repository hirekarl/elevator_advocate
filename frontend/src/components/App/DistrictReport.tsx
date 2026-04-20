import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface DistrictStats {
  total_buildings: number;
  avg_loss_of_service: number;
  active_outages: number;
}

interface Offender {
  bin: string;
  address: string;
  management_company: string;
  owner_name: string;
  complaint_count: number;
  loss_of_service: number;
}

interface DistrictReportData {
  district: string;
  member: string;
  contact: {
    email: string;
    phone: string | null;
  };
  stats: DistrictStats;
  top_offenders: Offender[];
  message?: string;
}

export function DistrictReport() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [data, setData] = useState<DistrictReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDistrictReport() {
      try {
        setLoading(true);
        const response = await fetch(`/api/districts/${id}/report/`);
        if (!response.ok) {
          throw new Error('Failed to fetch district report');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDistrictReport();
    }
  }, [id]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" role="status" className="mb-3" />
        <p className="text-muted">{t('dr_loading')}</p>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container className="py-5 text-center">
        <h2 className="text-danger mb-3">{t('error_syncing_news')}</h2>
        <Link to="/" className="btn btn-primary">{t('search_again')}</Link>
      </Container>
    );
  }

  if (data.message) {
    return (
      <Container className="py-5 text-center">
        <h2 className="mb-3">{t('dr_title', { id })}</h2>
        <p className="lead mb-4">{t('dr_no_data', { id })}</p>
        <Link to="/" className="btn btn-primary">{t('search_again')}</Link>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="mb-5">
        <h1 className="fw-800 mb-2" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--c-navy)' }}>
          {t('dr_title', { id: data.district })}
        </h1>
        <p className="lead mb-0" style={{ color: 'var(--c-text)' }}>
          <strong>{t('dr_member_label')}:</strong> {data.member}
        </p>
        <div className="mt-2">
          <a href={`mailto:${data.contact.email}`} className="text-decoration-none me-3">
            {t('dr_contact_rep')}
          </a>
        </div>
      </div>

      <section className="mb-5" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="h4 fw-bold mb-4">{t('dr_stats_heading')}</h2>
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <div className="text-muted small mb-1">{t('dr_avg_los_label')}</div>
                <div className="h2 fw-bold mb-0" style={{ color: 'var(--c-navy)' }}>
                  {data.stats.avg_loss_of_service}%
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <div className="text-muted small mb-1">{t('dr_active_outages_label')}</div>
                <div className="h2 fw-bold mb-0" style={{ color: 'var(--c-amber)' }}>
                  {data.stats.active_outages}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <div className="text-muted small mb-1">{t('dr_total_buildings_label')}</div>
                <div className="h2 fw-bold mb-0">
                  {data.stats.total_buildings}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>

      <section aria-labelledby="offenders-heading">
        <div className="d-flex align-items-baseline gap-3 mb-4">
          <h2 id="offenders-heading" className="h4 fw-bold mb-0">{t('dr_offenders_heading')}</h2>
          <Badge bg="light" text="dark" className="border">
            {t('dr_offenders_sub', { id: data.district })}
          </Badge>
        </div>
        
        <Row className="g-3">
          {data.top_offenders.map((building, idx) => (
            <Col key={building.bin} xs={12}>
              <Card className="border-0 shadow-sm rounded-4 hover-lift">
                <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <span className="fw-800 text-muted" style={{ width: '1.5rem' }}>{idx + 1}</span>
                    <div>
                      <div className="fw-bold" style={{ color: 'var(--c-navy)' }}>{building.address}</div>
                      <div className="small text-muted">{building.management_company || building.owner_name || `BIN: ${building.bin}`}</div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold">{building.complaint_count} {t('ds_complaints_label')}</div>
                    <div className="small text-danger">{t('loss_of_service')}: {building.loss_of_service}%</div>
                    <Link to={`/building/${building.bin}`} className="stretched-link visually-hidden">
                      View Building
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </Container>
  );
}
