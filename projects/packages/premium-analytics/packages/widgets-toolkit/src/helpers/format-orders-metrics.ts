/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
/**
 * Internal dependencies
 */
import type { MetricKey } from '../types';

type FormatMetricOptions = NonNullable< Parameters< typeof formatMetricValue >[ 2 ] >;

type MetricType = NonNullable< Parameters< typeof formatMetricValue >[ 1 ] >;

const metricFormatMap: Record<
	MetricKey,
	{ metricType: MetricType; format?: FormatMetricOptions }
> = {
	orders_no: {
		metricType: 'number',
	},
	total_sales: {
		metricType: 'currency',
	},
	average_order_value: {
		metricType: 'currency',
	},
	avg_items: {
		metricType: 'average',
	},
	orders_value_net: {
		metricType: 'currency',
	},
	orders_value_gross: {
		metricType: 'currency',
	},
	coupons: {
		metricType: 'currency',
	},
	profit_margin: {
		metricType: 'currency',
	},
	visitors: {
		metricType: 'number',
		format: {
			useMultipliers: true,
			decimals: 0,
		},
	},
	conversion_rate: {
		metricType: 'percentage',
		format: {
			decimals: 1,
		},
	},
	customers: {
		metricType: 'number',
		format: {
			useMultipliers: true,
			decimals: 0,
		},
	},
	// Booking status metrics
	status_unpaid: {
		metricType: 'number',
	},
	status_pending_confirmation: {
		metricType: 'number',
	},
	status_confirmed: {
		metricType: 'number',
	},
	status_paid: {
		metricType: 'number',
	},
	status_cancelled: {
		metricType: 'number',
	},
	status_complete: {
		metricType: 'number',
	},
	// Booking attendance metrics
	attendance_status_booked: {
		metricType: 'number',
	},
	attendance_status_no_show: {
		metricType: 'number',
	},
	attendance_status_checked_in: {
		metricType: 'number',
	},
};

export function formatOrderMetric( metricKey: MetricKey, options?: FormatMetricOptions ) {
	return ( value: number ) =>
		formatMetricValue( value, metricFormatMap[ metricKey ].metricType, options ?? {} );
}

export function getFormatByMetricKey( metricKey: MetricKey ) {
	const config = metricFormatMap[ metricKey ];
	return {
		type: config.metricType,
		options: config.format,
	};
}
