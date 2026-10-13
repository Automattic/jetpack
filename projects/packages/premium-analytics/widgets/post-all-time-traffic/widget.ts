/**
 * External dependencies
 */
import {
	monthlyHeatmapMetricAttributeField,
	type MonthlyHeatmapMetric,
} from '@jetpack-premium-analytics/widgets-toolkit';

export type PostAllTimeTrafficAttributes = {
	/** Which number each cell reports; total views when unset. */
	metric?: MonthlyHeatmapMetric;
};

export default {
	attributes: [ monthlyHeatmapMetricAttributeField< PostAllTimeTrafficAttributes >() ],
	example: {
		attributes: { metric: 'total' },
	},
};
