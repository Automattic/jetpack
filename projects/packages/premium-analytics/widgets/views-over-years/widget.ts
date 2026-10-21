/**
 * External dependencies
 */
import type { MonthlyHeatmapMetric } from '@jetpack-premium-analytics/widgets-toolkit';

export type ViewsOverYearsAttributes = {
	/** Which number each cell reports; total views when unset. */
	metric?: MonthlyHeatmapMetric;
	/**
	 * Read one author's views, from the page's `author_id`, instead of the site's.
	 * Set by the author detail composition; not a user-facing control.
	 */
	authorScoped?: boolean;
};

export default {
	example: {
		attributes: { metric: 'total' },
	},
};
