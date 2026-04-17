import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AccessibilitySection } from './AccessibilitySection';

export function AdvocacySections() {
  const { t } = useTranslation();

  return (
    <>
      {/* Section 1: Crisis Stats */}
      <section className="advocacy-section advocacy-crisis-stats" aria-label="The elevator crisis">
        <div className="container">
          <div className="text-center mb-5">
            <span className="advocacy-section-label d-block mb-2" style={{ color: 'var(--c-amber)' }}>
              {t('adv_problem_label')}
            </span>
            <span className="advocacy-amber-rule d-block mx-auto mb-3"></span>
            <h2 className="fw-800 mb-0" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.04em', fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: '#fff' }}>
              {t('adv_crisis_heading')}
            </h2>
          </div>

          <div className="row g-4 justify-content-center">
            <div className="col-12 col-md-4 text-center">
              <div className="advocacy-stat-label mb-1">{t('adv_stat1_label')}</div>
              <div className="advocacy-stat-number">{t('adv_stat1_number')}</div>
              <div className="advocacy-stat-subtext mt-2">{t('adv_stat1_sub')}</div>
              <div className="advocacy-stat-source">{t('adv_stat1_source')}</div>
            </div>
            <div className="col-12 col-md-4 text-center">
              <div className="advocacy-stat-label mb-1">{t('adv_stat2_label')}</div>
              <div className="advocacy-stat-number">{t('adv_stat2_number')}</div>
              <div className="advocacy-stat-subtext mt-2">{t('adv_stat2_sub')}</div>
              <div className="advocacy-stat-source">{t('adv_stat2_source')}</div>
            </div>
            <div className="col-12 col-md-4 text-center">
              <div className="advocacy-stat-label mb-1">{t('adv_stat3_label')}</div>
              <div className="advocacy-stat-number">{t('adv_stat3_number')}</div>
              <div className="advocacy-stat-subtext mt-2">{t('adv_stat3_sub')}</div>
              <div className="advocacy-stat-source">{t('adv_stat3_source')}</div>
            </div>
          </div>

          <div className="adv-data-thread">
            <p className="adv-data-thread-label">{t('adv_data_thread_label')}</p>
            <Link to="/data" className="adv-data-thread-cta">
              {t('adv_data_thread_cta')}
              <span className="adv-data-thread-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2: Human Cost */}
      <section className="advocacy-section advocacy-human-cost" aria-label="Human impact">
        <div className="container">
          <div className="row g-5 align-items-start">
            <div className="col-12 col-lg-7">
              <span className="advocacy-section-label d-block mb-2" style={{ color: 'var(--c-navy)' }}>
                {t('adv_impact_label')}
              </span>
              <h2 className="mb-4" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, letterSpacing: '-0.04em', fontSize: 'clamp(1.35rem, 3vw, 1.9rem)', color: 'var(--c-navy)' }}>
                {t('adv_impact_heading')}
              </h2>
              <p className="mb-3" style={{ fontFamily: 'Mulish, sans-serif', lineHeight: 1.75, color: 'var(--c-text)', fontSize: '1rem' }}>
                {t('adv_impact_p1')}
              </p>
              <p className="mb-0" style={{ fontFamily: 'Mulish, sans-serif', lineHeight: 1.75, color: 'var(--c-text)', fontSize: '1rem' }}>
                {t('adv_impact_p2')}
              </p>
            </div>

            <div className="col-12 col-lg-5">
              <div className="d-flex flex-column gap-3">
                <div className="advocacy-persona-card">
                  <div className="advocacy-persona-name">{t('adv_persona_deidre_name')}</div>
                  <div className="advocacy-persona-descriptor">{t('adv_persona_deidre_desc')}</div>
                  <p className="advocacy-persona-quote mb-0">&ldquo;{t('adv_persona_deidre_quote')}&rdquo;</p>
                  <div className="advocacy-persona-source">{t('adv_persona_deidre_source')}</div>
                </div>
                <div className="advocacy-persona-card">
                  <div className="advocacy-persona-name">{t('adv_persona_rosalina_name')}</div>
                  <div className="advocacy-persona-descriptor">{t('adv_persona_rosalina_desc')}</div>
                  <p className="advocacy-persona-quote mb-0">&ldquo;{t('adv_persona_rosalina_quote')}&rdquo;</p>
                  <div className="advocacy-persona-source">{t('adv_persona_rosalina_source')}</div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: How It Works */}
      <section className="advocacy-section advocacy-how-it-works" aria-label="How the platform works">
        <div className="container">
          <div className="text-center mb-5">
            <span className="advocacy-section-label d-block mb-2" style={{ color: 'var(--c-navy)' }}>
              {t('adv_solution_label')}
            </span>
            <h2 className="mb-0" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, letterSpacing: '-0.04em', fontSize: 'clamp(1.35rem, 3vw, 1.9rem)', color: 'var(--c-navy)' }}>
              {t('adv_solution_heading')}
            </h2>
          </div>

          <div className="row g-4">
            <div className="col-12 col-sm-6">
              <div className="advocacy-feature-card h-100">
                <div className="advocacy-feature-icon" aria-hidden="true">&#10003;&#10003;</div>
                <div className="advocacy-feature-title">{t('adv_feat1_title')}</div>
                <p className="mb-0" style={{ fontFamily: 'Mulish, sans-serif', fontSize: '0.9rem', color: 'var(--c-text)', lineHeight: 1.65 }}>
                  {t('adv_feat1_desc')}
                </p>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="advocacy-feature-card h-100">
                <div className="advocacy-feature-icon" aria-hidden="true">%</div>
                <div className="advocacy-feature-title">{t('adv_feat2_title')}</div>
                <p className="mb-0" style={{ fontFamily: 'Mulish, sans-serif', fontSize: '0.9rem', color: 'var(--c-text)', lineHeight: 1.65 }}>
                  {t('adv_feat2_desc')}
                </p>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="advocacy-feature-card h-100">
                <div className="advocacy-feature-icon" aria-hidden="true">&#128203;</div>
                <div className="advocacy-feature-title">{t('adv_feat3_title')}</div>
                <p className="mb-0" style={{ fontFamily: 'Mulish, sans-serif', fontSize: '0.9rem', color: 'var(--c-text)', lineHeight: 1.65 }}>
                  {t('adv_feat3_desc')}
                </p>
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <div className="advocacy-feature-card h-100">
                <div className="advocacy-feature-icon" aria-hidden="true">&#8594;</div>
                <div className="advocacy-feature-title">{t('adv_feat4_title')}</div>
                <p className="mb-0" style={{ fontFamily: 'Mulish, sans-serif', fontSize: '0.9rem', color: 'var(--c-text)', lineHeight: 1.65 }}>
                  {t('adv_feat4_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Accessibility */}
      <AccessibilitySection />

      {/* Section 5: Movement Timeline */}
      <section className="advocacy-section advocacy-movement" aria-label="The tenant justice movement">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="mb-0" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, letterSpacing: '-0.04em', fontSize: 'clamp(1.35rem, 3vw, 1.9rem)', color: '#fff' }}>
              {t('adv_movement_heading')}
            </h2>
          </div>

          <div className="advocacy-timeline">
            <div className="advocacy-timeline-item">
              <div className="advocacy-timeline-year">1904</div>
              <p className="advocacy-timeline-text">{t('adv_timeline_1904')}</p>
            </div>
            <div className="advocacy-timeline-item">
              <div className="advocacy-timeline-year">1920</div>
              <p className="advocacy-timeline-text">{t('adv_timeline_1920')}</p>
            </div>
            <div className="advocacy-timeline-item">
              <div className="advocacy-timeline-year">1970s</div>
              <p className="advocacy-timeline-text">{t('adv_timeline_1970')}</p>
            </div>
            <div className="advocacy-timeline-item">
              <div className="advocacy-timeline-year">2010s</div>
              <p className="advocacy-timeline-text">{t('adv_timeline_2010')}</p>
            </div>
            <div className="advocacy-timeline-item advocacy-timeline-item--now">
              <div className="advocacy-timeline-year advocacy-timeline-now">{t('adv_timeline_now')}</div>
              <p className="advocacy-timeline-text advocacy-timeline-text--now">{t('adv_timeline_now_text')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Builder Attribution */}
      <section className="advocacy-section advocacy-builder" aria-label="About the builder">
        <div className="container">
          <div className="advocacy-builder-inner">
            <span className="advocacy-section-label d-block mb-3">{t('adv_builder_label')}</span>
            <div className="advocacy-builder-name">{t('adv_builder_name')}</div>
            <div className="advocacy-builder-title">{t('adv_builder_title')}</div>
            <blockquote className="advocacy-builder-bio">
              {t('adv_builder_bio')}
            </blockquote>
            <div className="advocacy-builder-links">
              <a
                href="https://www.linkedin.com/in/hirekarl"
                className="advocacy-builder-btn-primary"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Karl Johnson on LinkedIn (opens in new tab)"
              >
                {t('adv_builder_linkedin')}
              </a>
              <a
                href="https://github.com/hirekarl/elevator_advocacy_platform"
                className="advocacy-builder-btn-outline"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Elevator Advocate source code on GitHub (opens in new tab)"
              >
                {t('adv_builder_github')}
              </a>
            </div>
            <p className="advocacy-builder-pursuit-link">
              {t('adv_builder_pursuit_pre')}{' '}
              <a
                href="https://www.pursuit.org/ai-native-program"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pursuit AI-Native Program (opens in new tab)"
              >
                {t('adv_builder_pursuit_name')}
              </a>
              {' '}&#8599;
            </p>
            <p className="advocacy-builder-footnote">{t('adv_builder_footnote')}</p>
          </div>
        </div>
      </section>

      {/* Section 6: Council CTA */}
      <section className="advocacy-section advocacy-council-cta" aria-label="For elected officials">
        <div className="container">
          <div className="advocacy-council-inner mx-auto text-center">
            <span className="advocacy-section-label d-block mb-3" style={{ color: 'var(--c-navy)' }}>
              {t('adv_council_label')}
            </span>
            <h2 className="advocacy-council-heading mb-4">
              {t('adv_council_heading')}
            </h2>
            <p className="mb-5" style={{ fontFamily: 'Mulish, sans-serif', fontSize: '1rem', lineHeight: 1.75, color: 'var(--c-navy)' }}>
              {t('adv_council_body')}
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-4">
              <a
                href="https://www.linkedin.com/in/hirekarl"
                className="btn advocacy-cta-btn-primary"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('adv_council_cta_primary_aria')}
              >
                {t('adv_council_cta_primary')}
              </a>
              <a
                href="/building/2034290"
                className="btn advocacy-cta-btn-secondary"
              >
                {t('adv_council_cta_secondary')}
              </a>
            </div>
            <p className="advocacy-council-footnote mb-0">
              * {t('adv_council_footnote')}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
