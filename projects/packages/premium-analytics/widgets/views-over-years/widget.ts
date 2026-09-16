/**
 * External dependencies
 */
import {
	monthlyHeatmapMetricAttributeField,
	type MonthlyHeatmapMetric,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { seen } from '@wordpress/icons';

export type ViewsOverYearsAttributes = {
	/** Which number each cell reports; total views when unset. */
	metric?: MonthlyHeatmapMetric;
};

export default {
	icon: seen,
	attributes: [ monthlyHeatmapMetricAttributeField< ViewsOverYearsAttributes >() ],
	example: {
		attributes: { metric: 'total' },
	},
};
