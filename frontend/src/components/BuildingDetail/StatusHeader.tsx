import { Card, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import type { Building } from '../../types';
import { API_BASE } from '../../utils/api';

interface StatusHeaderProps {
  buildingData: Building;
  isLoggedIn: boolean;
  getStatusRibbonClass: (status: string) => string;
  getStatusLabel: (status: string) => string;
  onTriggerToast: (msg: string, variant?: string) => void;
}

export function StatusHeader({
  buildingData,
  isLoggedIn,
  getStatusRibbonClass,
  getStatusLabel,
  onTriggerToast
}: StatusHeaderProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-0 shadow mb-4 overflow-hidden">
      <div
        className={`status-ribbon ${getStatusRibbonClass(buildingData.verified_status)}`}
        role="status"
        aria-live="polite"
      >
        {getStatusLabel(buildingData.verified_status)}
      </div>
      <Card.Body className="p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-4 gap-3">
          <div>
            <h2 id="building-address" className="building-address-text mb-1 fs-3 fs-md-2">{buildingData.address}</h2>
            <p className="text-muted mb-0 small">{buildingData.borough} • BIN {buildingData.bin}</p>
            {buildingData.representative && (
              <p className="mb-0 small mt-1">
                <span className="badge bg-primary-subtle text-primary-emphasis rounded-pill fw-semibold me-2">
                  District {buildingData.city_council_district}
                </span>
                {buildingData.representative.email ? (
                  <a href={`mailto:${buildingData.representative.email}`} className="text-decoration-none small fw-semibold">
                    {buildingData.representative.name} ↗
                  </a>
                ) : (
                  <span className="small fw-semibold">{buildingData.representative.name}</span>
                )}
              </p>
            )}
          </div>
          {isLoggedIn && (
            <Button
              variant="outline-primary"
              size="sm"
              className="rounded-pill px-3 fw-bold"
              onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE}/api/auth/set_primary_building/`, {
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
                    onTriggerToast(data.message, 'success');
                  }
                } catch { onTriggerToast(t('error_setting_home'), 'danger'); }
              }}
            >
              {t('set_as_home')}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
