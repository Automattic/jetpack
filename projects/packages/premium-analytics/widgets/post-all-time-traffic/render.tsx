/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
import { PRESET_CUSTOM } from '@jetpack-premium-analytics/datetime';
import { Stack } from '@jetpack-premium-analytics/externals';
import { formatMonth } from '@jetpack-premium-analytics/formatters';
import { reports } from '@jetpack-premium-analytics/icons';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import {
	CalendarHeatmapTooltip,
	HeatmapChart,
	HeatmapSkeleton,
	WidgetRoot,
	WidgetState,
	describeError,
	formatDailyViewCount,
	formatViewCount,
	useWidgetRootContext,
	type HeatmapColumn,
	type HeatmapTooltipData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, type KeyboardEvent, type MouseEvent } from 'react';
/**
 * Internal dependencies
 */
import {
	MONTHS_IN_YEAR,
	resolveMetric,
	type AllTimeTrafficMetric,
} from './build-all-time-traffic-rows';
import { monthRange } from './period-range';
import styles from './style.module.css';
import usePostAllTimeTraffic from './use-post-all-time-traffic';
import type { PostAllTimeTrafficAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostAllTimeTrafficRenderAttributes = PostAllTimeTrafficAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostAllTimeTrafficWidgetProps = WidgetRenderProps< PostAllTimeTrafficRenderAttributes >;

// Below the floors the grid scrolls rather than crushing its cells; the cap
// keeps a young post's rows at the design height.
const MIN_CELL_WIDTH = 56;
const MIN_CELL_HEIGHT = 28;
const MAX_CELL_HEIGHT = 40;

// The chart's own cell markup, which a click or the keyboard selection lands on.
const CELL_SELECTOR = '[role="gridcell"][data-column][data-row]';

function PostAllTimeTrafficInner( { metric }: { metric: AllTimeTrafficMetric } ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );

	const { rows, lifeStartsAt, isLoading, isFetching, isError, error, refetch } =
		usePostAllTimeTraffic( postId, metric );

	// Bound to the route hosting the widget: a month picked here becomes the
	// page's period, read over by the other cards while this one stays all-time.
	const { onChange, onApply, timeZone } = useReportDateFilters();

	const openMonth = useCallback(
		( cell: Element ) => {
			const row = rows[ Number( cell.getAttribute( 'data-row' ) ) ];

			if ( ! row ) {
				return;
			}

			const month = Number( cell.getAttribute( 'data-column' ) );
			const range = monthRange( { year: row.year, month }, { lifeStartsAt, timeZone } );

			if ( range ) {
				onChange( range, PRESET_CUSTOM );
				onApply();
			}
		},
		[ rows, lifeStartsAt, timeZone, onChange, onApply ]
	);

	// The chart owns the cells, so the click is read off its markup.
	const handleClick = useCallback(
		( event: MouseEvent< HTMLDivElement > ) => {
			const cell = ( event.target as Element ).closest( CELL_SELECTOR );

			if ( cell ) {
				openMonth( cell );
			}
		},
		[ openMonth ]
	);

	// The grid names the selected cell through `aria-activedescendant`; Enter
	// and Space open it the way a click does. A click leaves the focus on the
	// cell itself (the chart gives cells `tabIndex={ -1 }`), so the grid is
	// looked up from whichever of the two the key lands on.
	const handleKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( event.key !== 'Enter' && event.key !== ' ' ) {
				return;
			}

			const activeId = ( event.target as Element )
				.closest( '[role="grid"]' )
				?.getAttribute( 'aria-activedescendant' );
			const cell = activeId ? document.getElementById( activeId ) : null;

			if ( cell && event.currentTarget.contains( cell ) && cell.matches( CELL_SELECTOR ) ) {
				event.preventDefault();
				openMonth( cell );
			}
		},
		[ openMonth ]
	);

	// Keep stale rows visible when a background refetch fails.
	const showError = isError && rows.length === 0;

	// No per-cell label: the chart names a cell from its column and row, the
	// month and the year here. A month without views reads 0, as the endpoint
	// reports it; the months outside the post's life are filler.
	const columns = useMemo< HeatmapColumn[] >(
		() =>
			Array.from( { length: MONTHS_IN_YEAR }, ( _column, month ) => ( {
				label: formatMonth( month, { short: true } ),
				data: rows.map( row => {
					const value = row.months[ month ];

					if ( typeof value !== 'number' ) {
						return { value: null, placeholder: true };
					}

					return { value };
				} ),
			} ) ),
		[ rows ]
	);

	const yearLabels = useMemo( () => rows.map( row => String( row.year ) ), [ rows ] );

	const renderTooltip = useCallback(
		( { value, columnLabel, rowLabel }: HeatmapTooltipData ) => (
			<CalendarHeatmapTooltip
				value={ value }
				// Named from the column and row, the way the chart names a cell to a
				// screen reader: "Aug 2026".
				cellLabel={ `${ columnLabel ?? '' } ${ rowLabel ?? '' }`.trim() }
				emptyLabel={ __( 'No views', 'jetpack-premium-analytics-pkg' ) }
				formatValue={ metric === 'average' ? formatDailyViewCount : formatViewCount }
			/>
		),
		[ metric ]
	);

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ showError }
			isEmpty={ postId <= 0 || rows.length === 0 }
			// Gated by the same predicate as `isError`, so the two cannot disagree.
			error={
				showError
					? describeError( error, {
							retryDescription: __(
								"We couldn't load this post's traffic. Please try again in a moment.",
								'jetpack-premium-analytics-pkg'
							),
							onRetry: refetch,
					  } )
					: null
			}
			empty={ {
				icon: reports,
				description:
					postId > 0
						? __( 'No views yet.', 'jetpack-premium-analytics-pkg' )
						: __(
								'Open a post or page report to see its all-time traffic here.',
								'jetpack-premium-analytics-pkg'
						  ),
			} }
			renderLoading={ <HeatmapSkeleton /> }
		>
			{ /* The grid inside is the interactive element; this only delegates its
			     clicks and keyboard activation to the month they land on. */ }
			{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
			<div className={ styles.root } onClick={ handleClick } onKeyDown={ handleKeyDown }>
				<HeatmapChart
					data={ columns }
					rowLabels={ yearLabels }
					minCellWidth={ MIN_CELL_WIDTH }
					minCellHeight={ MIN_CELL_HEIGHT }
					maxCellHeight={ MAX_CELL_HEIGHT }
					primaryColor="var(--wp-admin-theme-color, #3858e9)"
					withTooltips
					renderTooltip={ renderTooltip }
					className={ styles.chart }
				>
					{ /* Wrapped so the scale sits centred: the chart lays its trailing content out full width. */ }
					<Stack direction="row" justify="center">
						<HeatmapChart.Legend
							lessLabel={
								metric === 'average'
									? __( 'Fewer views per day', 'jetpack-premium-analytics-pkg' )
									: __( 'Fewer views', 'jetpack-premium-analytics-pkg' )
							}
							moreLabel={
								metric === 'average'
									? __( 'More views per day', 'jetpack-premium-analytics-pkg' )
									: __( 'More views', 'jetpack-premium-analytics-pkg' )
							}
						/>
					</Stack>
				</HeatmapChart>
			</div>
		</WidgetState>
	);
}

export default function PostAllTimeTraffic( { attributes = {} }: PostAllTimeTrafficWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostAllTimeTrafficInner metric={ resolveMetric( attributes.metric ) } />
		</WidgetRoot>
	);
}
