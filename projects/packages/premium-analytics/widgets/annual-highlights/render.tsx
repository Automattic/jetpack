/**
 * External dependencies
 */
import {
	useStatsInsights,
	type StatsInsightsResponse,
	type StatsInsightsYear,
} from '@jetpack-premium-analytics/data';
import {
	PRESET_ALL_TIME,
	getPresetYear,
	getYearSurfacePresets,
	siteTimeZone,
	type YearPresetId,
} from '@jetpack-premium-analytics/datetime';
import {
	AnnualHighlightsSkeleton,
	MetricTileGrid,
	ReportLink,
	WidgetFooter,
	WidgetRoot,
	WidgetState,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, _x } from '@wordpress/i18n';
import { calendar, comment, paragraph, postList, starEmpty } from '@wordpress/icons';
import { SelectControl, Stack, Text } from '@jetpack-premium-analytics/externals';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import {
	DEFAULT_HIGHLIGHT_METRICS,
	type AnnualHighlightMetric,
	type AnnualHighlightsAttributes,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The insights endpoint is not period-scoped: one request returns every year,
// and the widget's own dropdown picks which one is shown (see
// `selectYearTotals`), so the host's report params play no part here.
type AnnualHighlightsRenderAttributes = AnnualHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type AnnualHighlightsWidgetProps = WidgetRenderProps< AnnualHighlightsRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Resolves the totals for the year the widget's own dropdown selected. A year
 * the site did not publish in has no row; leaving it undefined shows the empty
 * state rather than a screen of zeros.
 */
function selectYearTotals(
	data: StatsInsightsResponse | undefined,
	selectedYear: number | null
): StatsInsightsYear | undefined {
	if ( selectedYear === null ) {
		return undefined;
	}

	// `years` can be absent: the sanitizer returns a bare object for a payload
	// it does not recognize.
	return data?.years?.find( year => Number( year.year ) === selectedYear );
}

/**
 * Oldest year in the insights payload, which is where the dropdown's list
 * starts — the endpoint reports across the whole site lifetime. Rows dated
 * past the current year are intentionally out of reach: the year surface
 * enumerates down from today.
 */
function findStartYear( data: StatsInsightsResponse | undefined ): number | undefined {
	const years = ( data?.years ?? [] )
		.map( year => Number( year.year ) )
		// A row with no year normalizes to '' and then to 0, and a bad start
		// year would put centuries of entries in the dropdown — the clamp below
		// caps the damage a single garbled row can do.
		.filter( year => Number.isInteger( year ) && year > 1000 );

	if ( years.length === 0 ) {
		return undefined;
	}

	// The browser clock is fine for this floor: it guards against garbled
	// rows, where an off-by-one at the New Year boundary is immaterial. Year
	// math the reader can see goes through the site timezone instead.
	return Math.max( Math.min( ...years ), new Date().getFullYear() - 50 );
}

/**
 * Fetches the insights report through the designated `useStatsInsights` Stats
 * hook and renders the totals for the year the widget's own dropdown selects
 * as a `MetricTileGrid` (see `selectYearTotals`). The endpoint returns every
 * year in one request, so switching years is a client-side row pick — no new
 * fetch. The insights module has no comparison period, so each tile shows a
 * bare formatted count. Which tiles appear is controlled by the `metrics`
 * attribute.
 *
 * `metrics` defaults to the same list `example.attributes` declares, which is
 * what the settings UI shows for an instance carrying no attributes. Without
 * the default the two disagree: every metric reads as enabled in the control
 * while the body reports none selected. An explicit empty array still means
 * "none".
 */
function AnnualHighlightsReport( {
	metrics = DEFAULT_HIGHLIGHT_METRICS,
}: {
	metrics?: AnnualHighlightMetric[];
} ) {
	const { data, isLoading, isFetching, isError, refetch } = useStatsInsights();
	const enabledMetrics = useMemo( () => new Set( metrics ), [ metrics ] );

	// `null` means the default: the newest entry, i.e. the current year.
	const [ selectedYearId, setSelectedYearId ] = useState< YearPresetId | null >( null );

	const timeZone = siteTimeZone();
	const startYear = findStartYear( data );
	const yearItems = useMemo(
		() =>
			getYearSurfacePresets( timeZone, { startYear } )
				.filter( preset => preset.id !== PRESET_ALL_TIME )
				.map( preset => ( { value: preset.id, label: preset.label } ) ),
		[ timeZone, startYear ]
	);

	const selectedItem = yearItems.find( item => item.value === selectedYearId ) ?? yearItems[ 0 ];
	const totals = selectYearTotals( data, getPresetYear( selectedItem?.value ) );

	// Stops pointer-down from starting a widget drag when opening the select.
	// Mouse-only supplement — keyboard users never press into the drag surface.
	const stopEventPropagation = useCallback(
		( event: { stopPropagation: () => void } ) => event.stopPropagation(),
		[]
	);

	const selectYearItem = useCallback( ( item: { value: string | null } | null ) => {
		if ( item?.value ) {
			setSelectedYearId( item.value as YearPresetId );
		}
	}, [] );

	// Guarded on `totals`: the tile values read the selected period, which is
	// absent in the loading / error / empty states handled by <WidgetState>.
	const tiles = (
		totals
			? [
					{
						key: 'posts',
						icon: postList,
						label: __( 'Posts', 'jetpack-premium-analytics-pkg' ),
						value: totals.total_posts,
						enabled: enabledMetrics.has( 'posts' ),
					},
					{
						key: 'words',
						icon: paragraph,
						label: __( 'Words', 'jetpack-premium-analytics-pkg' ),
						value: totals.total_words,
						enabled: enabledMetrics.has( 'words' ),
					},
					{
						key: 'likes',
						icon: starEmpty,
						label: __( 'Likes', 'jetpack-premium-analytics-pkg' ),
						value: totals.total_likes,
						enabled: enabledMetrics.has( 'likes' ),
					},
					{
						key: 'comments',
						icon: comment,
						label: __( 'Comments', 'jetpack-premium-analytics-pkg' ),
						value: totals.total_comments,
						enabled: enabledMetrics.has( 'comments' ),
					},
			  ]
			: []
	).filter( tile => tile.enabled );

	return (
		<div className={ styles.content }>
			{ /* Gated on a data year, so neither the first load nor a site with no
			     rows offers years there is nothing behind. A sibling of
			     <WidgetState> past that, so the year stays switchable from the
			     empty state a publish-free year resolves to. */ }
			{ startYear !== undefined && (
				<div className={ styles.header }>
					{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- see stopEventPropagation */ }
					<div onPointerDown={ stopEventPropagation } onMouseDown={ stopEventPropagation }>
						<SelectControl
							className={ styles.yearSelect }
							label={ _x( 'Year', 'label for the year selector', 'jetpack-premium-analytics-pkg' ) }
							hideLabelFromVision
							items={ yearItems }
							value={ selectedItem ?? null }
							onValueChange={ selectYearItem }
						/>
					</div>
				</div>
			) }
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// The query keeps prior data via `placeholderData`, so a transient
				// refetch failure keeps the highlights visible; only surface the
				// error when there is nothing to show.
				isError={ ! totals && isError }
				isEmpty={ ! totals }
				error={ {
					description: __(
						"We couldn't load your year in review. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: calendar,
					description: __( 'No highlights for this year.', 'jetpack-premium-analytics-pkg' ),
				} }
				// `tiles` stays empty until the totals arrive, so the skeleton
				// counts the selected metrics instead.
				renderLoading={ <AnnualHighlightsSkeleton rows={ metrics.length } /> }
			>
				{ totals && (
					<Stack className={ styles.root } direction="column" gap="lg">
						{ tiles.length === 0 ? (
							<Stack align="center" justify="center" className={ styles.placeholder }>
								<Text>
									{ __(
										'Select at least one metric to display.',
										'jetpack-premium-analytics-pkg'
									) }
								</Text>
							</Stack>
						) : (
							<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
						) }
					</Stack>
				) }
			</WidgetState>
			<WidgetFooter className={ styles.footer }>
				<ReportLink report="annual-insights" />
			</WidgetFooter>
		</div>
	);
}

/**
 * WidgetRoot provides the analytics query client and chart theme consumed by the
 * inner report. Host attributes are forwarded per the widget contract, though
 * the report ignores report params: the year shown comes from the widget's own
 * dropdown.
 */
export default function AnnualHighlights( { attributes = {} }: AnnualHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AnnualHighlightsReport metrics={ attributes.metrics } />
		</WidgetRoot>
	);
}
