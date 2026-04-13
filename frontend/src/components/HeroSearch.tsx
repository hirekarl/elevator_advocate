import { Form, Button, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface SearchData {
  house_number: string;
  street: string;
  borough: string;
}

interface HeroSearchProps {
  onSearch: (e: React.FormEvent) => void;
  searchData: SearchData;
  setSearchData: (data: SearchData) => void;
  isPending: boolean;
}

export function HeroSearch({ onSearch, searchData, setSearchData, isPending }: HeroSearchProps) {
  const { t } = useTranslation();

  return (
    <div className="hero-section">
      <div className="container px-3 px-md-4">
        <h1 className="mb-3">
          {t('resident_action_center')}
        </h1>
        <p className="hero-sub mb-0">
          {t('hero_description')}
        </p>

        <Form onSubmit={onSearch} className="hero-search-form">
          <fieldset>
            <legend className="visually-hidden">{t('search_address')}</legend>
            <Row className="align-items-end g-3">
              <Col xs={4} md={2}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-uppercase">{t('house_number')}</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="280"
                    size="lg"
                    className="rounded-3"
                    value={searchData.house_number}
                    onChange={(e) => setSearchData({ ...searchData, house_number: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col xs={8} md={5}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-uppercase">{t('street')}</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Broadway"
                    size="lg"
                    className="rounded-3"
                    value={searchData.street}
                    onChange={(e) => setSearchData({ ...searchData, street: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-uppercase">{t('borough')}</Form.Label>
                  <Form.Select
                    size="lg"
                    className="rounded-3"
                    value={searchData.borough}
                    onChange={(e) => setSearchData({ ...searchData, borough: e.target.value })}
                  >
                    <option value="Manhattan">{t('manhattan')}</option>
                    <option value="Bronx">{t('bronx')}</option>
                    <option value="Brooklyn">{t('brooklyn')}</option>
                    <option value="Queens">{t('queens')}</option>
                    <option value="Staten Island">{t('staten_island')}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={2}>
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-2 py-md-3 fw-bold rounded-3"
                  size="lg"
                  disabled={isPending}
                >
                  {isPending ? t('syncing') : t('submit')}
                </Button>
              </Col>
            </Row>
          </fieldset>
        </Form>
      </div>
    </div>
  );
}
