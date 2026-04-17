import { useTranslation } from 'react-i18next';
import { Card, Row, Col, Badge, Button } from 'react-bootstrap';
import type { ExecutiveSummary as ExecutiveSummaryType } from '../../types';

interface ExecutiveSummaryProps {
  executiveSummary: ExecutiveSummaryType | null;
  isLoadingSummary: boolean;
  onRefresh: () => void;
}

export function ExecutiveSummary({ executiveSummary, isLoadingSummary, onRefresh }: ExecutiveSummaryProps) {
  const { t } = useTranslation();

  if (!isLoadingSummary && !executiveSummary) return (
    <p className="text-muted small text-center py-2">
      {t('summary_unavailable')} <button className="btn btn-link btn-sm p-0" onClick={onRefresh}>{t('try_again')}</button>
    </p>
  );

  return (
    <Card className="border-0 shadow-sm mb-4 rounded-4 overflow-hidden border-start border-primary border-5">
      <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
        <h2 className="fw-bold mb-0 fs-5">
          <span className="me-2" aria-hidden="true">🧠</span> {t('executive_summary_title')}
        </h2>
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
            <p className="text-dark small mb-0 fw-bold" aria-hidden="true">{t('generating_summary')}</p>
          </div>
        ) : executiveSummary && (
          <Row className="g-4">
            <Col md={6}>
              <h3 className="section-label">{t('historical_patterns_title')}</h3>
              <p className="small mb-0">{executiveSummary.historical_patterns}</p>
            </Col>
            <Col md={6}>
              <h3 className="section-label">{t('community_sentiment_title')}</h3>
              <p className="small mb-0">{executiveSummary.community_sentiment}</p>
            </Col>
            <Col md={6}>
              <h3 className="section-label">{t('legal_standing_title')}</h3>
              <p className="small mb-0">{executiveSummary.legal_standing}</p>
            </Col>
            <Col md={6}>
              <h3 className="section-label">{t('recommended_action_title')}</h3>
              <p className="small fw-bold text-primary mb-0">{executiveSummary.recommended_action}</p>
            </Col>
            <Col xs={12} className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
              <small className="text-muted">{t('confidence_label')}: {(executiveSummary.confidence_score * 100).toFixed(0)}%</small>
              <Button variant="link" size="sm" className="p-0 text-decoration-none small" onClick={onRefresh}>
                <span aria-hidden="true">🔄</span> {t('refresh_analysis')}
              </Button>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
}
