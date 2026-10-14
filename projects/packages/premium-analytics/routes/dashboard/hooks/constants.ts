/**
 * Preferences identifiers shared by the dashboard hooks and mirrored on the
 * server. The scope lives in `@jetpack-premium-analytics/data`, whose default
 * preset reads it.
 */

export { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/data';

/** Re-exported from the widgets toolkit, whose feedback modal cannot import this route. */
export { DASHBOARD_SECTION_LAYOUTS_KEY } from '@jetpack-premium-analytics/widgets-toolkit';

/** Preferences key holding the dashboard grid settings. */
export const DASHBOARD_GRID_SETTINGS_KEY = 'dashboardGridSettings';

/** Preferences key holding when the reader completed or dismissed the onboarding, as an ISO date. */
export const DASHBOARD_ONBOARDING_KEY = 'onboardingCompletedAt';

/** Preferences key holding when the reader closed the feedback banner, as an ISO date. */
export const DASHBOARD_FEEDBACK_BANNER_KEY = 'feedbackBannerClosedAt';
