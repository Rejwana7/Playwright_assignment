// Suite tags. Positive critical-path tests belong to both suites because the
// enclosing describe is tagged as regression and the tests are tagged as smoke.
export const SUITES = {
  smoke: '@smoke',
  regression: '@regression',
} as const;
