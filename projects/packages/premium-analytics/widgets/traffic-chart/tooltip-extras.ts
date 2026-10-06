/**
 * External dependencies
 */
import { resolveBucketStamp } from '@jetpack-premium-analytics/datetime';
import { getComparisonBucketShift } from '@jetpack-premium-analytics/widgets-toolkit';
import { __, _n } from '@wordpress/i18n';
import type { StatsVisitsResponse } from '@jetpack-premium-analytics/data';
import type { BucketSpan, TooltipExtraSeries } from '@jetpack-premium-analytics/widgets-toolkit';

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

/** The current period's buckets a comparison row is placed on, after skipping `shift`. */
type ComparisonAxis = { spans: BucketSpan[]; shift: number };

function spansOf( report: Report, zone: string ): BucketSpan[] {
	return ( report?.data ?? [] ).map( point => ( {
		date: resolveBucketStamp( point.date_start, zone ),
		endDate: resolveBucketStamp( point.date_end, zone ),
	} ) );
}

/**
 * Read one row out of a report, bucket by bucket.
 *
 * @param report  - The report to read.
 * @param zone    - The report's reporting timezone.
 * @param valueOf - The row's value for a bucket, or undefined for no reading.
 * @param axis    - For a comparison period, where to place its buckets.
 * @return The row's points.
 */
function readRow(
	report: Report,
	zone: string,
	valueOf: ( point: Record< string, unknown > ) => number | undefined,
	axis?: ComparisonAxis
): ExtraPoints {
	const points: ExtraPoints = [];
	const spans = spansOf( report, zone );

	( report?.data ?? [] ).forEach( ( point, index ) => {
		const { date: ownDate, endDate } = spans[ index ];
		const date = axis ? axis.spans[ index - axis.shift ]?.date : ownDate;
		const value = valueOf( point );
		if ( ! date || ! ownDate || value === undefined ) {
			return;
		}
		const ownEnd = endDate ? { endDate } : {};
		// `realDate` is the date the tooltip row reads; `date` only places it.
		points.push(
			axis ? { date, realDate: ownDate, ...ownEnd, value } : { date, ...ownEnd, value }
		);
	} );

	return points;
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
			currentReport: current.views,
			comparisonReport: comparison?.views,
			valueOf: viewsPerVisitorOf,
		},
		{
			label: __( 'Posts published', 'jetpack-premium-analytics-pkg' ),
			countLabel: postsPublishedLabel,
			currentReport: current.posts,
			comparisonReport: comparison?.posts,
			valueOf: postsPublishedOf,
		},
	];

	return rows.flatMap(
		( { label, dataFormat, countLabel, currentReport, comparisonReport, valueOf } ) => {
			const data = readRow( currentReport, zone, valueOf );

			if ( ! data.length ) {
				return [];
			}

			const spans = spansOf( currentReport, zone );
			const shift = getComparisonBucketShift( spans, spansOf( comparisonReport, zone ) );
			const previous = comparisonReport
				? readRow( comparisonReport, zone, valueOf, { spans, shift } )
				: [];

			return [
				{
					label,
					dataFormat,
					countLabel,
					data,
					previous: previous.length ? previous : undefined,
				},
			];
		}
	);
}
