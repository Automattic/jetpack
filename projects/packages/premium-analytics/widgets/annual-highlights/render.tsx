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
import { __, sprintf } from '@wordpress/i18n';
import { arrowLeft, arrowRight, comment, paragraph, postList, starEmpty } from '@wordpress/icons';
import { Button, Icon, Text } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { AnnualHighlightsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The insights endpoint is not period-scoped, so the widget ignores the
// dashboard date range. Report params are still accepted at the WidgetRoot
// boundary (and Storybook may inject them) so the host contract holds.
type AnnualHighlightsRenderAttributes = AnnualHighlightsAttributes &
	Partial< ReportParamsFieldAttributes >;

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
 * appear is controlled by the per-metric visibility attributes.
 *
 * @param props              - The enabled-metric flags from widget attributes.
 * @param props.showPosts    - Whether the Posts tile is shown.
 * @param props.showWords    - Whether the Words tile is shown.
 * @param props.showLikes    - Whether the Likes tile is shown.
 * @param props.showComments - Whether the Comments tile is shown.
 * @return The widget content.
 */
function AnnualHighlightsReport( {
	showPosts,
	showWords,
	showLikes,
	showComments,
}: Required< AnnualHighlightsAttributes > ) {
	const { data, isLoading, isError } = useStatsInsights();

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
			<div className={ styles.root }>
				<Text className={ styles.placeholder }>
					{ __( 'Unable to load annual highlights.', 'jetpack-premium-analytics' ) }
				</Text>
			</div>
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
			<div className={ styles.root }>
				<Text className={ styles.placeholder }>
					{ __( 'No highlights to show yet.', 'jetpack-premium-analytics' ) }
				</Text>
			</div>
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
			enabled: showPosts,
		},
		{
			key: 'words',
			icon: paragraph,
			label: __( 'Words', 'jetpack-premium-analytics' ),
			value: year.total_words,
			enabled: showWords,
		},
		{
			key: 'likes',
			icon: starEmpty,
			label: __( 'Likes', 'jetpack-premium-analytics' ),
			value: year.total_likes,
			enabled: showLikes,
		},
		{
			key: 'comments',
			icon: comment,
			label: __( 'Comments', 'jetpack-premium-analytics' ),
			value: year.total_comments,
			enabled: showComments,
		},
	].filter( tile => tile.enabled );

	return (
		<div className={ styles.root }>
			<div className={ styles.header }>
				<Text variant="heading-lg" render={ <h3 /> } className={ styles.title }>
					{ sprintf(
						/* translators: %s is a calendar year, e.g. "2026". */
						__( '%s in review', 'jetpack-premium-analytics' ),
						year.year
					) }
				</Text>
				<div className={ styles.yearNav }>
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
				</div>
			</div>
			{ tiles.length === 0 ? (
				<Text className={ styles.placeholder }>
					{ __( 'Select at least one metric to display.', 'jetpack-premium-analytics' ) }
				</Text>
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
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme consumed by the
 * inner report. Host attributes are forwarded so any injected report params are
 * preserved even though the insights endpoint is not period-scoped.
 *
 * @param props            - Render props supplied by the widget host.
 * @param props.attributes - Widget attributes.
 * @return The rendered widget.
 */
export default function AnnualHighlights( {
	attributes = {},
}: WidgetRenderProps< AnnualHighlightsRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AnnualHighlightsReport
				showPosts={ attributes.showPosts ?? true }
				showWords={ attributes.showWords ?? true }
				showLikes={ attributes.showLikes ?? true }
				showComments={ attributes.showComments ?? true }
			/>
		</WidgetRoot>
	);
}
