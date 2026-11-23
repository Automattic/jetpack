/**
 * Preferences identifiers shared by the dashboard hooks and mirrored on the
 * server. The scope lives in `@jetpack-premium-analytics/data`, whose default
 * preset reads it.
 */

export { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/data';

/** Re-exported from the widgets toolkit, whose feedback modal cannot import this route. */
export { DASHBOARD_SECTION_LAYOUTS_KEY } from '@jetpack-premium-analytics/widgets-toolkit';

/** Defined in the data package, which the init module reads them from too. */
export {
	DASHBOARD_ONBOARDING_KEY,
	DASHBOARD_STORE_ONBOARDING_KEY,
} from '@jetpack-premium-analytics/data';

/** Preferences key holding when the reader closed the feedback banner, as an ISO date. */
export const DASHBOARD_FEEDBACK_BANNER_KEY = 'feedbackBannerClosedAt';
