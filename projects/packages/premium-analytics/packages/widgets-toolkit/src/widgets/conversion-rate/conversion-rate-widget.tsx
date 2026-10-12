/**
 * External dependencies
 */
import { FilterCondition, useReportConversionRate } from '@jetpack-premium-analytics/data';
import { goal } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { Funnel, type FunnelStepInput } from '../../components/funnel';
import { useWidgetRootContext } from '../../components/widget-root';
import { BOOKINGS_FILTER } from '../../helpers';

type ConversionSummary = {
	active_sessions: number;
	with_cart_addition: number;
	reached_checkout: number;
	completed_checkout: number;
};

const STEPS: ReadonlyArray< { id: string; label: string; field: keyof ConversionSummary } > = [
	{
		id: 'sessions',
		label: __( 'Sessions', 'jetpack-premium-analytics-pkg' ),
		field: 'active_sessions',
	},
	{ id: 'cart', label: __( 'Cart', 'jetpack-premium-analytics-pkg' ), field: 'with_cart_addition' },
	{
		id: 'checkout',
		label: __( 'Checkout', 'jetpack-premium-analytics-pkg' ),
		field: 'reached_checkout',
	},
	{
		id: 'purchase',
		label: __( 'Purchase', 'jetpack-premium-analytics-pkg' ),
		field: 'completed_checkout',
	},
];

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

/**
 * Conversion funnel from sessions to completed orders: the rate of the period with its delta,
 * and a bar per step.
 */
export function ConversionRateWidget( { filters = [] }: { filters?: FilterCondition[] } ) {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportConversionRate( {
			...reportParams,
			filters,
		} );

	const steps = useMemo(
		() => buildConversionSteps( primary.data?.summary, comparison.data?.summary ),
		[ primary.data, comparison.data ]
	);

	return (
		<Funnel
			steps={ steps }
			status={ {
				isLoading,
				isFetching,
				// The report queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ {
				description: __(
					"We couldn't load conversion data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: goal,
				description: __( 'No conversion data in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
		/>
	);
}

/**
 * The conversion funnel restricted to booking product types (booking,
 * bookable-event, bookable-service).
 *
 * Must render within a WidgetRoot, which provides reportParams via context.
 */
export function BookingConversionRateWidget() {
	return <ConversionRateWidget filters={ [ BOOKINGS_FILTER ] } />;
}
