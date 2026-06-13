/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

export type OrdersSummary = ReportDataMap[ 'orders' ][ 'summary' ];

export type OrderMetrics = Pick<
	OrdersSummary,
	| 'orders_no'
	| 'total_sales'
	| 'average_order_value'
	| 'avg_items'
	| 'orders_value_net'
	| 'orders_value_gross'
	| 'coupons'
	| 'profit_margin'
>;

export type OrderMetricKey = keyof OrderMetrics;

type BookingsSummary = ReportDataMap[ 'bookings' ][ 'summary' ];

type BookingMetrics = Pick<
	BookingsSummary,
	| 'status_unpaid'
	| 'status_pending_confirmation'
	| 'status_confirmed'
	| 'status_paid'
	| 'status_cancelled'
	| 'status_complete'
	| 'attendance_status_booked'
	| 'attendance_status_no_show'
	| 'attendance_status_checked_in'
>;

export type BookingMetricKey = keyof BookingMetrics;

export type VisitorsMetricKey = 'visitors';

export type ConversionMetricKey = 'conversion_rate';

export type CustomersMetricKey = 'customers';

export type MetricKey =
	| OrderMetricKey
	| BookingMetricKey
	| VisitorsMetricKey
	| ConversionMetricKey
	| CustomersMetricKey;

/*
 * Inferred types
 */
type MetricFormat = NonNullable< Parameters< typeof formatMetricValue >[ 1 ] >;

type FormatMetricValueOptions = NonNullable< Parameters< typeof formatMetricValue >[ 2 ] >;

export type DataFormat = {
	type: MetricFormat;
	options?: FormatMetricValueOptions;
};

/**
 * Mirrors the dashboard's widget error contract: a message plus an optional
 * action (e.g. a retry button). Kept local so the toolkit can stay independent
 * from a specific dashboard host package.
 */
export type WidgetErrorConfig = {
	message: string;
	action?: {
		label: string;
		onClick: () => void;
	};
};
