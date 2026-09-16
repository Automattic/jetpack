/**
 * External dependencies
 */
import {
	monthlyHeatmapMetricAttributeField,
	type MonthlyHeatmapMetric,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { calendar } from '@wordpress/icons';

export type PostAllTimeTrafficAttributes = {
	/** Which number each cell reports; total views when unset. */
	metric?: MonthlyHeatmapMetric;
};

export default {
	icon: calendar,
	attributes: [ monthlyHeatmapMetricAttributeField< PostAllTimeTrafficAttributes >() ],
	example: {
		attributes: { metric: 'total' },
	},
};
