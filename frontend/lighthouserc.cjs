module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --port 4173',
      startServerReadyPattern: 'Local:',
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/data',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance':    ['warn',  { minScore: 0.70 }],
        'categories:accessibility':  ['error', { minScore: 0.92 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo':            ['error', { minScore: 0.95 }],
        'render-blocking-resources': ['warn',  { minScore: 0 }],
        'color-contrast':            ['error', { minScore: 1 }],
        'image-alt':                 ['error', { minScore: 1 }],
        'aria-roles':                ['error', { minScore: 1 }],
        'document-title':            ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
