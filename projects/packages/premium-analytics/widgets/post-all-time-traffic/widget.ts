/**
 * External dependencies
 */
import type { MonthlyHeatmapMetric } from '@jetpack-premium-analytics/widgets-toolkit';

export type PostAllTimeTrafficAttributes = {
	/** Which number each cell reports; total views when unset. */
	metric?: MonthlyHeatmapMetric;
};

export default {
	example: {
		attributes: { metric: 'total' },
	},
};
