import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface UserGuideModalProps {
  show: boolean;
  onHide: () => void;
}

export function UserGuideModal({ show, onHide }: UserGuideModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      show={show}
      onHide={onHide}
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
            <div key={`guide-step-${num}`} className="d-flex align-items-center mb-4">
              <div
                className="bg-primary-subtle rounded-circle p-2 d-flex align-items-center justify-content-center me-3"
                style={{ width: '56px', height: '56px', minWidth: '56px' }}
              >
                <span className="fs-3" aria-hidden="true">
                  {num === 1 ? '🏢' : num === 2 ? '🔘' : num === 3 ? '📞' : '📝'}
                </span>
              </div>
              <p className="mb-0 fs-5 text-dark fw-medium leading-tight">
                {t(`guide_step_${num}` as 'guide_step_1')}
              </p>
            </div>
          ))}
        </div>
        <Button
          variant="primary"
          className="w-100 py-3 fw-bold rounded-pill shadow-sm mt-3 fs-5"
          onClick={onHide}
        >
          {t('got_it')}
        </Button>
      </Modal.Body>
    </Modal>
  );
}
