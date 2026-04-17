import { use, Suspense, Component } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../utils/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface BoroughBreakdown {
  name: string;
  count: number;
  pct: number;
}

interface TopBuilding {
  address: string;
  borough: string;
  count: number;
  council_district?: string | null;
  rep_name?: string | null;
}

interface CityStats {
  total_complaints_12mo: number;
  borough_breakdown: BoroughBreakdown[];
  top_buildings: TopBuilding[];
  monthly_current_year: { month: string; count: number }[];
}

// ── Static seasonal data (2018–2025 research baseline) ───────────────────────

const SEASONAL_INDEX: { month: string; index: number }[] = [
  { month: 'Jan', index: 88 },
  { month: 'Feb', index: 82 },
  { month: 'Mar', index: 91 },
  { month: 'Apr', index: 94 },
  { month: 'May', index: 97 },
  { month: 'Jun', index: 103 },
  { month: 'Jul', index: 135 },
  { month: 'Aug', index: 121 },
  { month: 'Sep', index: 106 },
  { month: 'Oct', index: 99 },
  { month: 'Nov', index: 89 },
  { month: 'Dec', index: 85 },
];

const SEASONAL_MAX = 135;

// ── Data fetching ─────────────────────────────────────────────────────────────

function fetchCityStats(): Promise<CityStats> {
  return fetch(`${API_BASE}/api/buildings/city-stats/`).then((r) => {
    if (!r.ok) throw new Error('stats unavailable');
    return r.json() as Promise<CityStats>;
  });
}

let statsPromise: Promise<CityStats> | null = null;
function getStatsPromise(): Promise<CityStats> {
  if (!statsPromise) statsPromise = fetchCityStats();
  return statsPromise;
}

// ── Error boundary ────────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
}

class DataErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
      <div
        className="spinner-border mb-3"
        role="status"
        aria-label="Loading city data"
        style={{ color: 'var(--c-navy)' }}
      />
      <p className="text-muted small">Loading NYC elevator data…</p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="ds-error-state">
      <p className="ds-error-message">Data temporarily unavailable. Check back shortly.</p>
    </div>
  );
}

function BoroughBar({ name, count, pct, maxPct }: BoroughBreakdown & { maxPct: number }) {
  const isHigh = name === 'Bronx' || name === 'Brooklyn';
  const isMedium = name === 'Manhattan' || name === 'Queens';

  const barColor = isHigh ? 'var(--c-red)' : isMedium ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)';
  const barWidthPct = maxPct > 0 ? (pct / maxPct) * 100 : 0;

  return (
    <div className="ds-borough-row">
      <div className="ds-borough-label">{name}</div>
      <div className="ds-borough-bar-track">
        <div
          className="ds-borough-bar-fill"
          style={{ width: `${barWidthPct.toFixed(1)}%`, backgroundColor: barColor }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name}: ${count.toLocaleString()} complaints, ${pct}%`}
        />
      </div>
      <div className="ds-borough-meta">
        <span className="ds-borough-count">{count.toLocaleString()}</span>
        <span className="ds-borough-pct">{pct}%</span>
      </div>
    </div>
  );
}

function SeasonalBar({ month, index }: { month: string; index: number }) {
  const isJuly = month === 'Jul';
  const heightPct = Math.round((index / SEASONAL_MAX) * 100);
  const barColor = isJuly ? 'var(--c-amber)' : 'var(--c-navy-lt)';

  return (
    <div className="ds-seasonal-col">
      <div className="ds-seasonal-bar-track">
        {isJuly && (
          <span className="ds-seasonal-annotation" aria-hidden="true">
            +35%
          </span>
        )}
        <div
          className="ds-seasonal-bar-fill"
          style={{ height: `${heightPct}%`, backgroundColor: barColor }}
          role="img"
          aria-label={isJuly ? `${month}: index ${index}, 35% above annual average` : `${month}: index ${index}`}
        />
      </div>
      <div className={`ds-seasonal-month${isJuly ? ' ds-seasonal-month--peak' : ''}`}>{month}</div>
    </div>
  );
}

interface LeaderboardCardProps {
  rank: number;
  address: string;
  borough: string;
  count: number;
  council_district?: string | null;
  rep_name?: string | null;
}

function LeaderboardCard({ rank, address, borough, count, council_district, rep_name }: LeaderboardCardProps) {
  const isTop3 = rank <= 3;
  const { t } = useTranslation();
  return (
    <div className={`ds-building-card${isTop3 ? ' ds-building-card--top' : ''}`} role="listitem">
      <div className="ds-card-header">
        <span className={`ds-rank-badge${isTop3 ? ' ds-rank-badge--top' : ''}`} aria-label={`Rank ${rank}`}>{rank}</span>
        <span className="ds-borough-pill">{borough}</span>
      </div>
      <div className="ds-card-address">{address}</div>
      <div className="ds-card-footer">
        <span className="ds-card-count" aria-label={`${count} complaints`}>{count.toLocaleString()}</span>
        <span className="ds-card-count-label">{t('ds_complaints_label')}</span>
      </div>
      {council_district && rep_name && (
        <div className="ds-card-district">
          {t('ds_district_line', { district: council_district, rep: rep_name })}
        </div>
      )}
    </div>
  );
}

// ── Data cutoff helper ────────────────────────────────────────────────────────

function getDataCutoff(monthly: { month: string; count: number }[]): string {
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastIdx = -1;
  for (let i = 0; i < monthly.length; i++) {
    if (monthly[i].count > 0) lastIdx = i;
  }
  if (lastIdx === -1) return '';
  const year = new Date().getFullYear();
  return `${MONTH_NAMES[lastIdx]} ${year}`;
}

// ── Inner component (uses React 19 use()) ─────────────────────────────────────

function DataStoriesInner() {
  const { t } = useTranslation();
  const stats = use(getStatsPromise());

  if (!stats || stats.total_complaints_12mo === 0) {
    return <ErrorState />;
  }

  const topBuildings = stats.top_buildings.slice(0, 15);
  const cutoffLabel = getDataCutoff(stats.monthly_current_year);

  return (
    <main className="ds-page" aria-labelledby="ds-page-title">
      <h1 id="ds-page-title" className="visually-hidden">{t('ds_page_title')}</h1>
      <span className="visually-hidden" role="status" aria-live="polite">{t('ds_data_loaded')}</span>
      {/* Page header */}
      <section className="ds-hero advocacy-section" aria-label="NYC elevator complaints overview">
        <div className="container">
          <span className="advocacy-section-label d-block mb-2" style={{ color: 'var(--c-amber)' }}>
            {t('ds_label_scale')}
          </span>
          <span className="advocacy-amber-rule d-block mb-3" />
          <div className="ds-hero-stat" aria-label={`${stats.total_complaints_12mo.toLocaleString()} elevator complaints`}>
            {stats.total_complaints_12mo.toLocaleString()}
          </div>
          <p className="ds-hero-sub">{t('ds_hero_sub')}</p>
          {cutoffLabel && (
            <p className="ds-cutoff-label">{t('ds_cutoff_through', { month: cutoffLabel })}</p>
          )}

          {/* Borough breakdown */}
          {stats.borough_breakdown.length > 0 && (
            <div className="ds-borough-chart mt-5" aria-label="Complaints by borough">
              <h2 className="ds-chart-heading">{t('ds_borough_heading')}</h2>
              <div className="ds-borough-list">
                {(() => {
                  const maxPct = Math.max(...stats.borough_breakdown.map((b) => b.pct));
                  return stats.borough_breakdown.map((b) => (
                    <BoroughBar key={b.name} {...b} maxPct={maxPct} />
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Reporting gap callout */}
      <section className="ds-lag-section advocacy-section" aria-label="Data reporting lag">
        <div className="container">
          <span className="advocacy-section-label d-block mb-2">{t('ds_lag_label')}</span>
          <h2 className="ds-section-heading mb-3">{t('ds_lag_heading')}</h2>
          <p className="ds-section-body mb-4">{t('ds_lag_body')}</p>
          <p className="ds-lag-cta">
            <Link to="/">{t('ds_lag_cta')}</Link>
          </p>
        </div>
      </section>

      {/* Story 2: Summer spike */}
      <section className="ds-seasonal-section advocacy-section" aria-label="Seasonal complaint patterns">
        <div className="container">
          <span className="advocacy-section-label d-block mb-2" style={{ color: 'var(--c-navy)' }}>
            {t('ds_label_spike')}
          </span>
          <h2 className="ds-section-heading mb-2">{t('ds_spike_heading')}</h2>
          <p className="ds-section-body mb-5">{t('ds_spike_body')}</p>

          <div className="ds-seasonal-chart" role="figure" aria-label="Monthly complaint index, 2018–2025 average">
            {SEASONAL_INDEX.map((d) => (
              <SeasonalBar key={d.month} month={d.month} index={d.index} />
            ))}
          </div>
          <p className="ds-chart-note mt-3">{t('ds_spike_chart_note')}</p>
        </div>
      </section>

      {/* Story 3: Worst buildings */}
      <section className="ds-leaderboard-section advocacy-section" aria-label="Top buildings by complaint count">
        <div className="container">
          <span className="advocacy-section-label d-block mb-2" style={{ color: 'var(--c-amber)' }}>
            {t('ds_label_buildings')}
          </span>
          <span className="advocacy-amber-rule d-block mb-3" />
          <h2 className="ds-section-heading ds-section-heading--light mb-2">{t('ds_buildings_heading')}</h2>
          <p className="ds-section-body ds-section-body--light mb-5">{t('ds_buildings_sub')}</p>

          <div className="ds-leaderboard" role="list" aria-label="Buildings ranked by complaints">
            {topBuildings.map((b, i) => (
              <LeaderboardCard
                key={`${b.address}-${i}`}
                rank={i + 1}
                address={b.address}
                borough={b.borough}
                count={b.count}
                council_district={b.council_district}
                rep_name={b.rep_name}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Attribution + CTA */}
      <section className="ds-footer-section advocacy-section" aria-label="Source and navigation">
        <div className="container text-center">
          <p className="ds-source-note">{t('ds_source_note')}</p>
          <Link to="/" className="ds-cta-link">
            {t('ds_search_cta')} →
          </Link>
        </div>
      </section>
    </main>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function DataStories() {
  return (
    <DataErrorBoundary fallback={<ErrorState />}>
      <Suspense fallback={<LoadingSpinner />}>
        <DataStoriesInner />
      </Suspense>
    </DataErrorBoundary>
  );
}
