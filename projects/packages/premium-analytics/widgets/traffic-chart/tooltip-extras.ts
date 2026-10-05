/**
 * External dependencies
 */
import { resolveBucketStamp } from '@jetpack-premium-analytics/datetime';
import { __, _n } from '@wordpress/i18n';
import type { StatsVisitsResponse } from '@jetpack-premium-analytics/data';
import type { TooltipExtraSeries } from '@jetpack-premium-analytics/widgets-toolkit';

const VIEWS_PER_VISITOR_FORMAT = { type: 'average' as const };

type ExtraPoints = TooltipExtraSeries[ 'data' ];
type Report = StatsVisitsResponse | undefined;

/** The two `stats/visits` reports the widget fetches, which carry the rows between them. */
export type TrafficTooltipReports = {
	/** The `views,visitors` report. */
	views: Report;
	/** The `likes,comments,post_titles` report. */
	posts: Report;
};

const postsPublishedLabel: NonNullable< TooltipExtraSeries[ 'countLabel' ] > = count =>
	/* translators: %s: number of posts published. */
	_n( '%s Post published', '%s Posts published', count, 'jetpack-premium-analytics-pkg' );

function numberOf( point: Record< string, unknown >, field: string ): number | undefined {
	const value = point[ field ];

	return typeof value === 'number' ? value : undefined;
}

/**
 * Read one row out of a report, bucket by bucket.
 *
 * @param report    - The report to read.
 * @param zone      - The report's reporting timezone.
 * @param valueOf   - The row's value for a bucket, or undefined for no reading.
 * @param axisDates - For a comparison period, the current period's bucket dates: each
 *                  bucket is placed on the current bucket in the same position.
 * @return The row's points, and the report's own bucket dates.
 */
function readRow(
	report: Report,
	zone: string,
	valueOf: ( point: Record< string, unknown > ) => number | undefined,
	axisDates?: Array< Date | undefined >
) {
	const points: ExtraPoints = [];
	const dates = ( report?.data ?? [] ).map( point => resolveBucketStamp( point.date_start, zone ) );

	( report?.data ?? [] ).forEach( ( point, index ) => {
		const ownDate = dates[ index ];
		const date = axisDates ? axisDates[ index ] : ownDate;
		const value = valueOf( point );
		if ( ! date || ! ownDate || value === undefined ) {
			return;
		}
		// `realDate` is the date the tooltip row reads; `date` only places it.
		points.push( axisDates ? { date, realDate: ownDate, value } : { date, value } );
	} );

	return { points, dates };
}

// A ratio with no visitors has nothing to say, as in classic Stats.
function viewsPerVisitorOf( point: Record< string, unknown > ): number | undefined {
	const views = numberOf( point, 'views' );
	const visitors = numberOf( point, 'visitors' );

	return views !== undefined && visitors !== undefined && visitors > 0
		? views / visitors
		: undefined;
}

// An untitled post arrives as `''` and still counts, as in classic Stats.
function postsPublishedOf( point: Record< string, unknown > ): number | undefined {
	const posts = Array.isArray( point.post_titles ) ? point.post_titles.length : 0;

	return posts || undefined;
}

/**
 * The rows classic Stats adds under the traffic chart's tooltip: views per
 * visitor, and the number of posts published in the bucket.
 *
 * @param current    - The current period's reports.
 * @param zone       - The reports' reporting timezone.
 * @param comparison - The comparison period's reports, when a comparison is on.
 * @return The extra series, each omitted when no bucket has a reading for it.
 */
export function buildTrafficTooltipExtras(
	current: TrafficTooltipReports,
	zone: string,
	comparison?: TrafficTooltipReports
): TooltipExtraSeries[] {
	const rows = [
		{
			label: __( 'Views per visitor', 'jetpack-premium-analytics-pkg' ),
			dataFormat: VIEWS_PER_VISITOR_FORMAT,
			current: readRow( current.views, zone, viewsPerVisitorOf ),
			comparisonReport: comparison?.views,
			valueOf: viewsPerVisitorOf,
		},
		{
			label: __( 'Posts published', 'jetpack-premium-analytics-pkg' ),
			countLabel: postsPublishedLabel,
			current: readRow( current.posts, zone, postsPublishedOf ),
			comparisonReport: comparison?.posts,
			valueOf: postsPublishedOf,
		},
	];

	return rows
		.filter( row => row.current.points.length )
		.map( ( { label, dataFormat, countLabel, current: own, comparisonReport, valueOf } ) => {
			const previous = comparisonReport
				? readRow( comparisonReport, zone, valueOf, own.dates ).points
				: [];

			return {
				label,
				dataFormat,
				countLabel,
				data: own.points,
				previous: previous.length ? previous : undefined,
			};
		} );
}
