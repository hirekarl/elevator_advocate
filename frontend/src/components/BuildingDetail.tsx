import { useState } from 'react';
import { Card, ProgressBar, ListGroup, Badge, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface BuildingDetailProps {
  buildingData: any;
}

export function BuildingDetail({ buildingData }: BuildingDetailProps) {
  const { t } = useTranslation();

  if (!buildingData) return null;

  return (
    <Card className="mt-4 shadow-sm">
      <Card.Header as="h2" className="bg-primary text-white">
        {t('building_details')}: {buildingData.bin}
      </Card.Header>
      <Card.Body>
        <div className="mb-4">
          <h5 className="text-muted">{t('address')}</h5>
          <p className="lead">{buildingData.address}, {buildingData.borough}</p>
        </div>

        <div className="mb-4">
          <h5>{t('loss_of_service')}</h5>
          <ProgressBar 
            now={buildingData.loss_of_service_30d} 
            label={`${buildingData.loss_of_service_30d}%`} 
            variant={buildingData.loss_of_service_30d > 10 ? 'danger' : 'warning'}
            className="mb-2"
            style={{ height: '30px' }}
          />
          <small className="text-muted">
            {t('verified_status')}: <strong>{buildingData.verified_status}</strong>
          </small>
        </div>

        <hr />

        <h5>{t('recent_activity')}</h5>
        <ListGroup variant="flush">
          {buildingData.recent_reports?.length > 0 ? (
            buildingData.recent_reports.map((report: any, idx: number) => (
              <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                <div>
                  <Badge bg={report.status === 'UP' ? 'success' : 'danger'} className="me-2">
                    {report.status}
                  </Badge>
                  {new Date(report.reported_at).toLocaleString()}
                </div>
                {report.is_official && <Badge bg="info">NYC SODA</Badge>}
              </ListGroup.Item>
            ))
          ) : (
            <Alert variant="light">{t('no_outages')}</Alert>
          )}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}
