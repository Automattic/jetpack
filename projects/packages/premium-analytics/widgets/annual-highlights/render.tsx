/**
 * External dependencies
 */
import {
	useStatsInsights,
	type StatsInsightsResponse,
	type StatsInsightsYear,
} from '@jetpack-premium-analytics/data';
import {
	MetricWithComparison,
	WidgetLoadingOverlay,
	WidgetRoot,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { arrowLeft, arrowRight, comment, paragraph, postList, starEmpty } from '@wordpress/icons';
import { Button, Icon, Stack, Text } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type AnnualHighlightMetric, type AnnualHighlightsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The insights endpoint is not period-scoped, so the widget ignores the
// dashboard date range. Report params are still accepted at the WidgetRoot
// boundary (and Storybook may inject them) so the host contract holds.
type AnnualHighlightsRenderAttributes = AnnualHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;
type AnnualHighlightsWidgetProps = WidgetRenderProps< AnnualHighlightsRenderAttributes >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Sorts the insights payload newest year first so index 0 is the most recent
 * year and the year arrows can step through history in a predictable order.
 *
 * @param data - The normalized insights response, or undefined while loading.
 * @return The years sorted from most to least recent.
 */
function sortYearsDescending( data?: StatsInsightsResponse ): StatsInsightsYear[] {
	return [ ...( data?.years ?? [] ) ].sort( ( a, b ) => Number( b.year ) - Number( a.year ) );
}

/**
 * Fetches the insights report through the designated `useStatsInsights` Stats
 * hook and renders one year's totals as a grid of metric tiles. The year arrows
 * step between the years the site has published in; the insights module has no
 * comparison period, so each tile shows a bare formatted count. Which tiles
 * appear is controlled by the `metrics` attribute.
 *
 * @param {AnnualHighlightMetric[]} metrics - Enabled metric tile ids.
 * @return The widget content.
 */
function AnnualHighlightsReport( { metrics }: { metrics: AnnualHighlightMetric[] } ) {
	const { data, isLoading, isError } = useStatsInsights();
	const enabledMetrics = useMemo( () => new Set( metrics ), [ metrics ] );

	const years = useMemo( () => sortYearsDescending( data ), [ data ] );
	const [ selectedIndex, setSelectedIndex ] = useState( 0 );

	// Navigate relative to the clamped index, not the raw state: if the payload
	// shrinks while an older year is selected, the stored index can outrun the
	// array, and stepping from the raw value would take several clicks to move.
	const safeIndex = years.length ? Math.min( selectedIndex, years.length - 1 ) : 0;

	const showOlderYear = useCallback(
		() => setSelectedIndex( Math.min( safeIndex + 1, years.length - 1 ) ),
		[ safeIndex, years.length ]
	);
	const showNewerYear = useCallback(
		() => setSelectedIndex( Math.max( safeIndex - 1, 0 ) ),
		[ safeIndex ]
	);

	const year = years[ safeIndex ];

	if ( isError ) {
		return (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>{ __( 'Unable to load annual highlights.', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	}

	if ( isLoading && ! year ) {
		return (
			<div className={ styles.root }>
				<WidgetLoadingOverlay />
			</div>
		);
	}

	if ( ! year ) {
		return (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>{ __( 'No highlights to show yet.', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	}

	const canShowOlder = safeIndex < years.length - 1;
	const canShowNewer = safeIndex > 0;

	const tiles = [
		{
			key: 'posts',
			icon: postList,
			label: __( 'Posts', 'jetpack-premium-analytics' ),
			value: year.total_posts,
			enabled: enabledMetrics.has( 'posts' ),
		},
		{
			key: 'words',
			icon: paragraph,
			label: __( 'Words', 'jetpack-premium-analytics' ),
			value: year.total_words,
			enabled: enabledMetrics.has( 'words' ),
		},
		{
			key: 'likes',
			icon: starEmpty,
			label: __( 'Likes', 'jetpack-premium-analytics' ),
			value: year.total_likes,
			enabled: enabledMetrics.has( 'likes' ),
		},
		{
			key: 'comments',
			icon: comment,
			label: __( 'Comments', 'jetpack-premium-analytics' ),
			value: year.total_comments,
			enabled: enabledMetrics.has( 'comments' ),
		},
	].filter( tile => tile.enabled );

	return (
		<Stack direction="column" gap="lg" className={ styles.root }>
			<Stack align="center" justify="flex-end" gap="sm">
				<Button
					type="button"
					variant="minimal"
					tone="neutral"
					size="small"
					className={ styles.navButton }
					onClick={ showOlderYear }
					disabled={ ! canShowOlder }
					aria-label={ __( 'Previous year', 'jetpack-premium-analytics' ) }
				>
					<Button.Icon icon={ arrowLeft } size={ 16 } />
				</Button>

				<Text className={ styles.yearLabel }>{ year.year }</Text>

				<Button
					type="button"
					variant="minimal"
					tone="neutral"
					size="small"
					className={ styles.navButton }
					onClick={ showNewerYear }
					disabled={ ! canShowNewer }
					aria-label={ __( 'Next year', 'jetpack-premium-analytics' ) }
				>
					<Button.Icon icon={ arrowRight } size={ 16 } />
				</Button>
			</Stack>

			{ tiles.length === 0 ? (
				<Stack align="center" justify="center" className={ styles.placeholder }>
					<Text>
						{ __( 'Select at least one metric to display.', 'jetpack-premium-analytics' ) }
					</Text>
				</Stack>
			) : (
				<div className={ styles.grid }>
					{ tiles.map( tile => (
						<div key={ tile.key } className={ styles.tile }>
							<div className={ styles.tileHeader }>
								<Icon icon={ tile.icon } size={ 24 } className={ styles.tileIcon } />
								<Text className={ styles.tileLabel }>{ tile.label }</Text>
							</div>
							<MetricWithComparison
								value={ tile.value }
								dataFormat={ COUNT_FORMAT }
								fontSize="xl"
								className={ styles.tileValue }
							/>
						</div>
					) ) }
				</div>
			) }
		</Stack>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme consumed by the
 * inner report. Host attributes are forwarded so any injected report params are
 * preserved even though the insights endpoint is not period-scoped.
 *
 * @param {AnnualHighlightsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function AnnualHighlights( { attributes = {} }: AnnualHighlightsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AnnualHighlightsReport metrics={ attributes.metrics } />
		</WidgetRoot>
	);
}
