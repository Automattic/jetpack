/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';
import type { TransformedText } from '@wordpress/i18n';

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
	OrderMetricKey | BookingMetricKey | VisitorsMetricKey | ConversionMetricKey | CustomersMetricKey;

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
 * A count metric's unit in the locale's plural form for `count`, with `%s` for the
 * formatted number: `count => _n( '%s View', '%s Views', count, domain )`.
 * Whole-number counts only: the form follows the raw value, not a rounded one shown.
 */
export type CountLabel = ( count: number ) => TransformedText< `%s ${ string }` >;

/**
 * Local stand-in for the `WidgetErrorConfig` type from `@automattic/dashboard`
 * (CIAB Admin), which is not published to npm. Mirrors the documented shape of
 * the dashboard's widget error contract: a message plus an optional action
 * (e.g. a retry button).
 *
 * TODO: Replace with the `@automattic/dashboard` type once it is available.
 */
export type WidgetErrorConfig = {
	message: string;
	action?: {
		label: string;
		onClick: () => void;
	};
};
