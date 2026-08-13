/**
 * External dependencies
 */
import { FilterCondition, useReportConversionRate } from '@jetpack-premium-analytics/data';
import { ConversionFunnelChart, Icon, Stack } from '@jetpack-premium-analytics/externals';
import { goal } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { MetricWithComparison, WidgetState } from '../../components';
import { useWidgetRootContext } from '../../components/widget-root';
import { BOOKINGS_FILTER } from '../../helpers';
import styles from './conversion-rate-widget.module.scss';

/**
 * Conversion funnel from visitors to completed orders, with per-step
 * percentages and a comparison delta when one is available.
 */
export function ConversionRateWidget( {
	filters = [],
	emptyStateIcon = goal,
	emptyStateText,
}: {
	filters?: FilterCondition[];
	emptyStateIcon?: React.ComponentProps< typeof Icon >[ 'icon' ];
	emptyStateText?: string;
} ) {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportConversionRate( {
			...reportParams,
			filters,
		} );

	const { data: conversionData } = primary;
	const { data: comparisonData } = comparison;

	const { steps, overallRate, comparisonRate } = useMemo( () => {
		if ( ! conversionData || conversionData.summary.active_sessions === 0 ) {
			return {
				steps: [],
				overallRate: 0,
				comparisonRate: null,
			};
		}

		return {
			steps: conversionData.steps || [],
			// A decimal, e.g. 0.0476 for 4.76%.
			overallRate: conversionData.overallRate || 0,
			comparisonRate:
				hasComparison && comparisonData?.summary ? comparisonData.summary.conversion_rate : null,
		};
	}, [ conversionData, comparisonData, hasComparison ] );

	// Convert to percentage for ConversionFunnelChart (expects 0-100 scale)
	const overallRatePercent = overallRate * 100;

	return (
		<WidgetState
			isLoading={ isLoading && ! hasData }
			isFetching={ isFetching }
			// The report queries keep the previous period's data as placeholders
			// across range changes, so only surface the error when there is
			// nothing to show.
			isError={ isError && ! hasData }
			isEmpty={ steps.length === 0 }
			error={ {
				description: __(
					"We couldn't load conversion data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: emptyStateIcon,
				description:
					emptyStateText ??
					__( 'No conversion data in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
		>
			<Stack direction="column" gap="lg" className={ styles.container }>
				<MetricWithComparison
					value={ overallRate }
					previousValue={ comparisonRate }
					dataFormat={ {
						type: 'percentage',
						options: { signDisplay: 'auto' },
					} }
				/>

				<ConversionFunnelChart
					steps={ steps }
					mainRate={ overallRatePercent }
					renderMainMetric={ () => null }
					className={ styles.conversionFunnelChart }
				/>
			</Stack>
		</WidgetState>
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
