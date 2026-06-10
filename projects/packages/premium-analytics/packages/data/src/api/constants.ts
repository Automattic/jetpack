/**
 * Internal dependencies
 */
import { getJpaConfig } from '../utils/jpa-config';

/**
 * Constants for API endpoints
 */
export const reportsPath = '/jetpack-premium-analytics/v1/proxy/reports';

/**
 * Base path of the Jetpack Stats proxy REST API for the current site.
 *
 * A function rather than a constant because the site ID is only known at
 * runtime (read from `window.jpaConfig`).
 *
 * @return The stats API base path, e.g. `/jetpack/v4/stats-app/sites/123/stats`.
 */
export function getStatsApiPath(): string {
	const { siteId } = getJpaConfig();

	return `/jetpack/v4/stats-app/sites/${ siteId }/stats`;
}
