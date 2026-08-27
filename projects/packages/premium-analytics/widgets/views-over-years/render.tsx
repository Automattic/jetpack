/**
 * External dependencies
 */
import { formatMonth } from '@jetpack-premium-analytics/formatters';
import {
	CalendarHeatmapTooltip,
	HeatmapChart,
	HeatmapSkeleton,
	WidgetMetricSelect,
	WidgetRoot,
	WidgetState,
	describeError,
	formatDailyViewCount,
	formatViewCount,
	type HeatmapColumn,
	type HeatmapTooltipData,
	type ReportParamsFieldAttributes,
	type WidgetMetricSelectItem,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { MONTHS_IN_YEAR, type ViewsOverYearsMetric } from './build-views-over-years';
import styles from './style.module.scss';
import { useViewsOverYears } from './use-views-over-years';
import type { ViewsOverYearsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The endpoint this widget reads is not period-scoped, but WidgetRoot still
// expects the host's report params on `attributes`.
type ViewsOverYearsRenderAttributes = ViewsOverYearsAttributes &
	Partial< ReportParamsFieldAttributes >;
type ViewsOverYearsWidgetProps = WidgetRenderProps< ViewsOverYearsRenderAttributes >;

// Cells stop shrinking here and the grid overflows into the widget's own
// scroller instead — twelve months and a decade of rows outgrow a dashboard
// tile long before they stop being worth reading.
const MIN_CELL_WIDTH = 56;
const MIN_CELL_HEIGHT = 28;
// The height cap is what content-sizes the grid. Without one it takes its
// height from the flex line, which inside a scroller resolves to nothing at
// all; with one, a site with few years keeps readable rows instead of
// stretching them down the tile.
const MAX_CELL_HEIGHT = 40;

function ViewsOverYearsInner() {
	const [ metric, setMetric ] = useState< ViewsOverYearsMetric >( 'total' );

	const { rows, isLoading, isFetching, isError, error, refetch } = useViewsOverYears( metric );

	// Keep stale rows visible when a background refetch fails.
	const showError = isError && rows.length === 0;

	// No per-cell label: the chart names a cell from its column and row, which
	// here is already the month and the year.
	const columns = useMemo< HeatmapColumn[] >(
		() =>
			Array.from( { length: MONTHS_IN_YEAR }, ( _column, month ) => ( {
				label: formatMonth( month, { short: true } ),
				data: rows.map( row => {
					const value = row.months[ month ];

					return value === null ? { value: null, hidden: true } : { value };
				} ),
			} ) ),
		[ rows ]
	);

	const yearLabels = useMemo( () => rows.map( row => String( row.year ) ), [ rows ] );

	const trailingColumn = useMemo(
		() => ( {
			label:
				metric === 'average'
					? __( 'Average', 'jetpack-premium-analytics-pkg' )
					: __( 'Totals', 'jetpack-premium-analytics-pkg' ),
			data: rows.map( row => row.total ),
		} ),
		[ metric, rows ]
	);

	// Memoised: an unstable `items` identity makes the select re-initialise and
	// close its popup as it opens.
	const metricItems = useMemo< WidgetMetricSelectItem< ViewsOverYearsMetric >[] >(
		() => [
			{ label: __( 'Total views', 'jetpack-premium-analytics-pkg' ), value: 'total' },
			{ label: __( 'Average per day', 'jetpack-premium-analytics-pkg' ), value: 'average' },
		],
		[]
	);
	const selectMetric = useCallback( ( next: ViewsOverYearsMetric ) => setMetric( next ), [] );

	const renderTooltip = useCallback(
		( { value, columnLabel, rowLabel }: HeatmapTooltipData ) => (
			<CalendarHeatmapTooltip
				value={ value }
				// Named from the column and row, the way the chart names a cell to a
				// screen reader: "Mar 2024" for a month, "Totals 2024" for the roll-up.
				cellLabel={ `${ columnLabel ?? '' } ${ rowLabel ?? '' }`.trim() }
				emptyLabel={ __( 'No views', 'jetpack-premium-analytics-pkg' ) }
				formatValue={ metric === 'average' ? formatDailyViewCount : formatViewCount }
			/>
		),
		[ metric ]
	);

	return (
		<div className={ styles.root }>
			<WidgetMetricSelect
				className={ styles.picker }
				label={ __( 'Views metric', 'jetpack-premium-analytics-pkg' ) }
				items={ metricItems }
				value={ metric }
				onChange={ selectMetric }
			/>

			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ showError }
				isEmpty={ rows.length === 0 }
				// Gated by the same predicate as `isError`, so the two cannot disagree.
				error={
					showError
						? describeError( error, {
								retryDescription: __(
									"We couldn't load your views. Please try again in a moment.",
									'jetpack-premium-analytics-pkg'
								),
								onRetry: refetch,
						  } )
						: null
				}
				empty={ {
					icon: seen,
					description: __( 'No views yet.', 'jetpack-premium-analytics-pkg' ),
				} }
				renderLoading={ <HeatmapSkeleton /> }
			>
				<div className={ styles.scroller }>
					<HeatmapChart
						data={ columns }
						rowLabels={ yearLabels }
						trailingColumn={ trailingColumn }
						columnLabelAlign="center"
						minCellWidth={ MIN_CELL_WIDTH }
						minCellHeight={ MIN_CELL_HEIGHT }
						maxCellHeight={ MAX_CELL_HEIGHT }
						primaryColor="var(--wp-admin-theme-color, #3858e9)"
						withTooltips
						renderTooltip={ renderTooltip }
					>
						{ /* Wrapped so the scale sits centred under the table, as the
						     design has it; the chart lays its trailing content out
						     full width. */ }
						<div className={ styles.legend }>
							<HeatmapChart.Legend
								lessLabel={ __( 'Fewer views', 'jetpack-premium-analytics-pkg' ) }
								moreLabel={ __( 'More views', 'jetpack-premium-analytics-pkg' ) }
							/>
						</div>
					</HeatmapChart>
				</div>
			</WidgetState>
		</div>
	);
}

export default function ViewsOverYears( { attributes = {} }: ViewsOverYearsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<ViewsOverYearsInner />
		</WidgetRoot>
	);
}
