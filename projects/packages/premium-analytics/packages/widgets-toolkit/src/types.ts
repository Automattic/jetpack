/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import type { TransformedText } from '@wordpress/i18n';

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
 * What a widget kind knows about its request, in the data layer's terms: the fields the
 * widget's data hook returns, from which the kind renders its states.
 */
export type WidgetStatus = {
	/**
	 * Nothing on screen answers the current params.
	 */
	isLoading: boolean;
	/**
	 * Unchanged params being revalidated.
	 */
	isFetching?: boolean;
	/**
	 * The request failed.
	 */
	isError?: boolean;
	/**
	 * The comparison period is on and the data carries values for it.
	 */
	hasComparison?: boolean;
	/**
	 * Re-runs the request; the default error state offers it as Retry.
	 */
	refetch?: () => unknown;
};

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
