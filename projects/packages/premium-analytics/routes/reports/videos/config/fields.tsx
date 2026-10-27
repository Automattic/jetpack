/**
 * External dependencies
 */
import {
	createReportOriginSearch,
	pickReportNavigationParams,
} from '@jetpack-premium-analytics/routing';
import {
	compareOptionalNumbers,
	InternalLink,
	MetricWithComparison,
	REPORT_TITLE_LINK_CLASS_NAMES,
	ReportThumbnail,
	ReportTitleCell,
	VideoTitleLink,
	getVideoPosterUrl,
	HOURS_DATA_FORMAT,
	toDetailId,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { video as videoIcon } from '@wordpress/icons';
import type { StatsVideoPlaysComparisonItem } from '@jetpack-premium-analytics/data';
import type { Field } from '@jetpack-premium-analytics/externals';

const METRIC_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

const RATE_DATA_FORMAT = {
	type: 'percentage',
	options: { decimals: 1, signDisplay: 'never' },
} as const;

/**
 * Resolve the table label for a complete-stats video row.
 *
 * @param video - The complete-stats summary row.
 * @return The video's display title.
 */
function getVideoTitle( video: StatsVideoPlaysComparisonItem ) {
	return typeof video.label === 'string' && video.label
		? video.label
		: __( 'Untitled video', 'jetpack-premium-analytics-pkg' );
}

/**
 * Build the page-scoped search state for a video detail link.
 *
 * @param current - The current report search parameters.
 * @return The detail page search parameters.
 */
function getVideoDetailSearch( current: Record< string, unknown > ) {
	return {
		...pickReportNavigationParams( current ),
		...createReportOriginSearch( 'videos' ),
	};
}

/**
 * Render a video row's title. Rows with an ID drill into the video detail page,
 * carrying the report's date window so the detail page and its "Stats"
 * breadcrumb keep the range being inspected, beside a "View" action that opens
 * the live video; the public URL is the external fallback for rows without one.
 *
 * @param props      - Component props.
 * @param props.item - The video report row.
 * @return The linked or plain video title.
 */
function VideoTitle( { item }: { item: StatsVideoPlaysComparisonItem } ) {
	const title = getVideoTitle( item );

	return (
		<ReportTitleCell content="video" id={ item.id } link={ item.link } label={ title }>
			<VideoTitleLink
				id={ item.id }
				label={ title }
				link={ item.link }
				search={ getVideoDetailSearch }
				classNames={ REPORT_TITLE_LINK_CLASS_NAMES }
				title={ title }
			/>
		</ReportTitleCell>
	);
}

/**
 * Render a video row's poster, linked to the same detail page as its title.
 *
 * @param props      - Component props.
 * @param props.item - The video report row.
 * @return The poster, linked when the row has a detail page.
 */
function VideoPoster( { item }: { item: StatsVideoPlaysComparisonItem } ) {
	const thumbnail = (
		<ReportThumbnail
			thumbnailUrl={ getVideoPosterUrl( item.poster, 64, 64 ) }
			fallbackIcon={ videoIcon }
		/>
	);
	const videoId = toDetailId( item.id );

	if ( videoId === undefined ) {
		return thumbnail;
	}

	return (
		<InternalLink
			to="/video/$videoId"
			params={ { videoId: String( videoId ) } }
			search={ getVideoDetailSearch }
			ariaLabel={ getVideoTitle( item ) }
		>
			{ thumbnail }
		</InternalLink>
	);
}

/**
 * DataViews field config for the Videos records table.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @return The field config.
 */
export function getVideosFields(
	withComparison = false
): Field< StatsVideoPlaysComparisonItem >[] {
	return [
		{
			id: 'label',
			label: __( 'Video', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => getVideoTitle( item ),
			render: ( { item } ) => <VideoTitle item={ item } />,
		},
		{
			id: 'poster',
			type: 'media',
			label: __( 'Poster', 'jetpack-premium-analytics-pkg' ),
			enableHiding: false,
			render: ( { item } ) => <VideoPoster item={ item } />,
		},
		{
			id: 'plays',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.plays,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.plays }
					previousValue={ withComparison ? item.previousPlays : undefined }
					dataFormat={ METRIC_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
		{
			id: 'impressions',
			label: __( 'Impressions', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.impressions,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.impressions }
					previousValue={ withComparison ? item.previousImpressions : undefined }
					dataFormat={ METRIC_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
		{
			id: 'watch_time',
			label: __( 'Hours watched', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.watch_time,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.watch_time }
					dataFormat={ HOURS_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
		{
			id: 'retention_rate',
			label: __( 'Retention rate', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.retention_rate,
			sort: compareOptionalNumbers,
			render: ( { item } ) =>
				item.retention_rate === null ? (
					<>—</>
				) : (
					// The endpoint sends a percentage (67.6); the formatter expects a fraction.
					<MetricWithComparison
						value={ item.retention_rate / 100 }
						dataFormat={ RATE_DATA_FORMAT }
						fontSize="md"
					/>
				),
		},
	];
}
