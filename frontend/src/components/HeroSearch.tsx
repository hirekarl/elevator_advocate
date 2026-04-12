import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface HeroSearchProps {
  onSearch: (e: React.FormEvent) => void;
  searchData: any;
  setSearchData: (data: any) => void;
  isPending: boolean;
}

export function HeroSearch({ onSearch, searchData, setSearchData, isPending }: HeroSearchProps) {
  const { t } = useTranslation();

  return (
    <div className="py-4 py-md-5 bg-light mb-4 rounded-3 border shadow-sm">
      <div className="container px-3 px-md-4 py-2 py-md-3">
        <h1 className="display-5 fw-bold text-primary mb-3 text-center text-md-start">
          Resident Action Center
        </h1>
        <p className="col-lg-8 fs-4 text-muted mb-4 text-center text-md-start">
          Enter your address to view your building's elevator service history, DOB complaints, and tenant reports.
        </p>
        
        <Form onSubmit={onSearch} className="p-3 p-md-4 bg-white border rounded shadow-sm mx-auto">
          <fieldset>
            <legend className="visually-hidden">{t('search_address')}</legend>
          <Row className="align-items-end g-3">
            <Col xs={4} md={2}>
              <Form.Group>
                <Form.Label className="small fw-bold text-uppercase text-muted">{t('house_number')}</Form.Label>
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
                <Form.Label className="small fw-bold text-uppercase text-muted">{t('street')}</Form.Label>
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
                <Form.Label className="small fw-bold text-uppercase text-muted">{t('borough')}</Form.Label>
                <Form.Select
                  size="lg"
                  className="rounded-3"
                  value={searchData.borough}
                  onChange={(e) => setSearchData({ ...searchData, borough: e.target.value })}
                >
                  <option value="Manhattan">Manhattan</option>
                  <option value="Bronx">Bronx</option>
                  <option value="Brooklyn">Brooklyn</option>
                  <option value="Queens">Queens</option>
                  <option value="Staten Island">Staten Island</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={2}>
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 py-2 py-md-3 fw-bold rounded-3 shadow-sm"
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
