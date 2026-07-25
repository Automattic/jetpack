/**
 * External dependencies
 */
import { useReportCustomersByDate } from '@jetpack-premium-analytics/data';
import { customer } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { useMemo } from 'react';
import { DonutChart, WidgetState } from '../../components';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildNewVsReturningCustomerData, isEmptyPieChartData } from '../../helpers';
import { useSegmentStyles } from '../common';
import styles from '../common/donut-widget.module.scss';

/**
 * New vs Returning Customer Widget Component
 *
 * Displays a donut chart showing the breakdown of unique customers
 * by type (new vs returning) over the selected time period.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <NewVsReturningCustomerWidget />
 * </WidgetRoot>
 * ```
 */
export function NewVsReturningCustomerWidget() {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportCustomersByDate( reportParams );

	const { chartData, total, comparisonTotal, legendData } = useMemo(
		() => buildNewVsReturningCustomerData( primary.data, comparison.data, hasComparison ),
		[ primary.data, comparison.data, hasComparison ]
	);

	const segmentStyles = useSegmentStyles( chartData );

	return (
		<WidgetState
			isLoading={ isLoading && ! hasData }
			isFetching={ isFetching }
			// The report queries keep the previous period's data as placeholders
			// across range changes, so only surface the error when there is
			// nothing to show.
			isError={ isError && ! hasData }
			isEmpty={ isEmptyPieChartData( chartData ) }
			error={ {
				description: __(
					"We couldn't load customer data. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: customer,
				description: __( 'No customer data in this period.', 'jetpack-premium-analytics' ),
			} }
		>
			<Stack className={ styles.container } direction="column" align="center" justify="center">
				<DonutChart
					chartData={ chartData }
					value={ total }
					styles={ segmentStyles }
					comparisonValue={ hasComparison ? comparisonTotal : null }
					legendData={ legendData }
					dataFormat={ {
						type: 'number',
						options: { useMultipliers: true, decimals: 0 },
					} }
					maxSize={ null }
					withTooltips
				/>
			</Stack>
		</WidgetState>
	);
}
