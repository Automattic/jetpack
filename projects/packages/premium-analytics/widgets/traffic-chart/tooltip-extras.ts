/**
 * External dependencies
 */
import { resolveBucketStamp } from '@jetpack-premium-analytics/datetime';
import { __, _n } from '@wordpress/i18n';
import { postContent, seen } from '@wordpress/icons';
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
		const endDate = resolveBucketStamp( point.date_end, zone );
		const ownEnd = endDate ? { endDate } : {};
		// `realDate` is the date the tooltip row reads; `date` only places it.
		points.push(
			axisDates ? { date, realDate: ownDate, ...ownEnd, value } : { date, ...ownEnd, value }
		);
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

// An untitled post arrives as `''` and still counts, as in classic Stats. A bucket
// the report lists without posts reads 0; one it leaves out has no reading.
function postsPublishedOf( point: Record< string, unknown > ): number | undefined {
	return Array.isArray( point.post_titles ) ? point.post_titles.length : undefined;
}

/**
 * Drop the buckets where both periods read 0, so a count row stays out of the
 * tooltip until one period has something to count, as in classic Stats. A 0
 * against a real count stays, so the row reads 0 rather than no data.
 */
function omitZeroPairs( points: ExtraPoints, others: ExtraPoints ): ExtraPoints {
	return points.filter(
		point =>
			point.value !== 0 ||
			others.some( other => other.date.getTime() === point.date.getTime() && other.value !== 0 )
	);
}

/**
 * The rows classic Stats adds under the traffic chart's tooltip: views per
 * visitor, and the number of posts published in the bucket.
 *
 * @param current    - The current period's reports.
 * @param zone       - The reports' reporting timezone.
 * @param comparison - The comparison period's reports, when a comparison is on.
 * @return The extra series, each omitted when neither period has a reading for it.
 */
export function buildTrafficTooltipExtras(
	current: TrafficTooltipReports,
	zone: string,
	comparison?: TrafficTooltipReports
): TooltipExtraSeries[] {
	const rows = [
		{
			label: __( 'Views per visitor', 'jetpack-premium-analytics-pkg' ),
			icon: seen,
			dataFormat: VIEWS_PER_VISITOR_FORMAT,
			current: readRow( current.views, zone, viewsPerVisitorOf ),
			comparisonReport: comparison?.views,
			valueOf: viewsPerVisitorOf,
			isCount: false,
		},
		{
			label: __( 'Posts published', 'jetpack-premium-analytics-pkg' ),
			icon: postContent,
			countLabel: postsPublishedLabel,
			current: readRow( current.posts, zone, postsPublishedOf ),
			comparisonReport: comparison?.posts,
			valueOf: postsPublishedOf,
			isCount: true,
		},
	];

	return rows
		.map(
			( {
				label,
				icon,
				dataFormat,
				countLabel,
				current: own,
				comparisonReport,
				valueOf,
				isCount,
			} ) => {
				const previous = comparisonReport
					? readRow( comparisonReport, zone, valueOf, own.dates ).points
					: [];
				const data = isCount ? omitZeroPairs( own.points, previous ) : own.points;
				const previousData = isCount ? omitZeroPairs( previous, own.points ) : previous;

				return {
					label,
					icon,
					dataFormat,
					countLabel,
					data,
					previous: previousData.length ? previousData : undefined,
				};
			}
		)
		.filter( row => row.data.length || row.previous );
}
