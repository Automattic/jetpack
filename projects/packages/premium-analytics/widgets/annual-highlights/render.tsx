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
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { useMemo } from 'react';
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

const COUNT_FORMAT = { type: 'number', options: { useMultipliers: true, decimals: 0 } } as const;

/**
 * Picks the most recent year from the insights payload. The endpoint returns one
 * entry per year the site has published in; the highlights grid shows the latest.
 *
 * @param data - The normalized insights response, or undefined while loading.
 * @return The most recent year's totals, or undefined when none are available.
 */
function getMostRecentYear( data?: StatsInsightsResponse ): StatsInsightsYear | undefined {
	const years = data?.years ?? [];

	if ( years.length === 0 ) {
		return undefined;
	}

	return years.reduce( ( latest, current ) =>
		Number( current.year ) > Number( latest.year ) ? current : latest
	);
}

/**
 * Fetches the insights report through the designated `useStatsInsights` Stats
 * hook and renders the most recent year's totals as a grid of metric tiles.
 * There is no comparison period for this module, so each tile shows a bare
 * formatted count with no delta.
 *
 * @return The widget content.
 */
function AnnualHighlightsReport() {
	const { data, isLoading, isError } = useStatsInsights();

	const year = useMemo( () => getMostRecentYear( data ), [ data ] );

	if ( isError ) {
		return (
			<Text className={ styles.placeholder }>
				{ __( 'Unable to load annual highlights.', 'jetpack-premium-analytics' ) }
			</Text>
		);
	}

	if ( isLoading && ! year ) {
		return <WidgetLoadingOverlay />;
	}

	if ( ! year ) {
		return (
			<Text className={ styles.placeholder }>
				{ __( 'No highlights to show yet.', 'jetpack-premium-analytics' ) }
			</Text>
		);
	}

	const tiles: { label: string; value: number }[] = [
		{ label: __( 'Posts', 'jetpack-premium-analytics' ), value: year.total_posts },
		{ label: __( 'Words', 'jetpack-premium-analytics' ), value: year.total_words },
		{ label: __( 'Likes', 'jetpack-premium-analytics' ), value: year.total_likes },
		{ label: __( 'Comments', 'jetpack-premium-analytics' ), value: year.total_comments },
		{ label: __( 'Images', 'jetpack-premium-analytics' ), value: year.total_images },
	];

	return (
		<div className={ styles.root }>
			<Text className={ styles.year }>{ year.year }</Text>
			<div className={ styles.grid }>
				{ tiles.map( tile => (
					<div key={ tile.label } className={ styles.tile }>
						<Text className={ styles.label }>{ tile.label }</Text>
						<MetricWithComparison value={ tile.value } dataFormat={ COUNT_FORMAT } />
					</div>
				) ) }
			</div>
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
			<AnnualHighlightsReport />
		</WidgetRoot>
	);
}
