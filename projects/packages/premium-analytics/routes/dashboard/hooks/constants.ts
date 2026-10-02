/**
 * Preferences identifiers shared by the dashboard hooks and mirrored on the
 * server.
 *
 * Centralized so the preferences scope and keys can be renamed in one place —
 * e.g. to fully isolate Premium Analytics' stored preferences from the core
 * dashboard's.
 */

/**
 * The scope and the section-layouts key live in the widgets toolkit, which the feedback
 * modal reads them from without being able to import this route.
 */
export {
	DASHBOARD_PREFERENCES_SCOPE,
	DASHBOARD_SECTION_LAYOUTS_KEY,
} from '@jetpack-premium-analytics/widgets-toolkit';

/** Preferences key holding the dashboard grid settings. */
export const DASHBOARD_GRID_SETTINGS_KEY = 'dashboardGridSettings';

/** Preferences key holding when the reader completed or dismissed the onboarding, as an ISO date. */
export const DASHBOARD_ONBOARDING_KEY = 'onboardingCompletedAt';

/** Preferences key holding when the reader closed the feedback banner, as an ISO date. */
export const DASHBOARD_FEEDBACK_BANNER_KEY = 'feedbackBannerClosedAt';
