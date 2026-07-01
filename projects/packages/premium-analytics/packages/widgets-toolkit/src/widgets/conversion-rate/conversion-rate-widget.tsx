/**
 * External dependencies
 */
import { ConversionFunnelChart } from '@automattic/charts';
import { FilterCondition, useReportConversionRate } from '@jetpack-premium-analytics/data';
import { goal } from '@jetpack-premium-analytics/icons';
import { Icon, Stack } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { MetricWithComparison, ChartEmptyState } from '../../components';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
import { useWidgetRootContext } from '../../components/widget-root';
import { BOOKINGS_FILTER } from '../../helpers';
import { useWidgetError } from '../../hooks';
import styles from './conversion-rate-widget.module.scss';

/**
 * ConversionRateWidget Component
 *
 * Displays a conversion funnel visualization showing the path from
 * visitors to completed orders. Shows steps with conversion percentages
 * and comparison delta when available.
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
	} = useReportConversionRate( {
		...reportParams,
		filters,
	} );

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

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
			// overallRate is a decimal (e.g., 0.0476 for 4.76%)
			overallRate: conversionData.overallRate || 0,
			// Get comparison rate as decimal
			comparisonRate:
				hasComparison && comparisonData?.summary ? comparisonData.summary.conversion_rate : null,
		};
	}, [ conversionData, comparisonData, hasComparison ] );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	// Don't render if no steps data
	if ( steps.length === 0 ) {
		return (
			<>
				<ChartEmptyState icon={ emptyStateIcon } text={ emptyStateText } />
				{ isRefetching && <WidgetLoadingOverlay /> }
			</>
		);
	}

	// Convert to percentage for ConversionFunnelChart (expects 0-100 scale)
	const overallRatePercent = overallRate * 100;

	return (
		<>
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
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}

/**
 * Booking Conversion Rate Widget Component
 *
 * A widget that displays a conversion funnel visualization showing the path from
 * visitors to completed orders for booking products only.
 *
 * This component automatically filters data to show only booking product types
 * (booking, bookable-event, bookable-service).
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <BookingConversionRateWidget />
 * </WidgetRoot>
 * ```
 */
export function BookingConversionRateWidget() {
	return <ConversionRateWidget filters={ [ BOOKINGS_FILTER ] } />;
}
