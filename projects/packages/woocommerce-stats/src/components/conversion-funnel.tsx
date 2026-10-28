/**
 * External dependencies
 */
import {
	Funnel,
	describeError,
	useWidgetRootContext,
	type FunnelStepInput,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useReportConversionRate, type FilterCondition } from '../reports';

type ConversionSummary = {
	active_sessions: number;
	with_cart_addition: number;
	reached_checkout: number;
	completed_checkout: number;
};

const STEPS: ReadonlyArray< { id: string; label: string; field: keyof ConversionSummary } > = [
	{
		id: 'sessions',
		label: __( 'Sessions', 'jetpack-woocommerce-stats-pkg' ),
		field: 'active_sessions',
	},
	{ id: 'cart', label: __( 'Cart', 'jetpack-woocommerce-stats-pkg' ), field: 'with_cart_addition' },
	{
		id: 'checkout',
		label: __( 'Checkout', 'jetpack-woocommerce-stats-pkg' ),
		field: 'reached_checkout',
	},
	{
		id: 'purchase',
		label: __( 'Purchase', 'jetpack-woocommerce-stats-pkg' ),
		field: 'completed_checkout',
	},
];

/**
 * The four steps of the funnel, as counts of both periods.
 *
 * @param {ConversionSummary|undefined} summary  - The selected period's summary.
 * @param {ConversionSummary|undefined} previous - The comparison period's summary.
 * @return {FunnelStepInput[]} The steps, or none without a summary.
 */
function buildConversionSteps(
	summary: ConversionSummary | undefined,
	previous: ConversionSummary | undefined
): FunnelStepInput[] {
	if ( ! summary ) {
		return [];
	}

	return STEPS.map( ( { id, label, field } ) => ( {
		id,
		label,
		value: summary[ field ],
		previousValue: previous?.[ field ],
	} ) );
}

type ConversionFunnelProps = {
	/** The product types the funnel counts; every type when omitted. */
	filters?: FilterCondition[];
	/** What the chart shows, such as the widget title; the chart is named "Chart: <title>". */
	chartTitle: string;
};

/**
 * The conversion funnel of the period, from sessions to completed orders, read under the widget
 * root for its report params.
 *
 * @param {ConversionFunnelProps} props - The component props.
 * @return {JSX.Element} The funnel, or the loading, error or empty state of its report.
 */
export function ConversionFunnel( { filters, chartTitle }: ConversionFunnelProps ) {
	const { reportParams } = useWidgetRootContext();
	const params = useMemo(
		() => ( filters ? { ...reportParams, filters } : reportParams ),
		[ reportParams, filters ]
	);
	const {
		primary,
		comparison,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		error,
		refetch,
	} = useReportConversionRate( params );

	const steps = useMemo(
		() => buildConversionSteps( primary.data?.summary, comparison.data?.summary ),
		[ primary.data, comparison.data ]
	);

	return (
		<Funnel
			chartTitle={ chartTitle }
			steps={ steps }
			status={ {
				isLoading,
				isFetching,
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load conversion data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
		/>
	);
}
