/**
 * External dependencies
 */
import { resolveBucketStamp } from '@jetpack-premium-analytics/datetime';
import { __, _n } from '@wordpress/i18n';
import type { StatsVisitsResponse } from '@jetpack-premium-analytics/data';
import type { TooltipExtraSeries } from '@jetpack-premium-analytics/widgets-toolkit';

const VIEWS_PER_VISITOR_FORMAT = { type: 'average' as const };

type ExtraPoints = TooltipExtraSeries[ 'data' ];

function numberOf( point: Record< string, unknown >, field: string ): number | undefined {
	const value = point[ field ];

	return typeof value === 'number' ? value : undefined;
}

const postsPublishedLabel: NonNullable< TooltipExtraSeries[ 'countLabel' ] > = count =>
	/* translators: %s: number of posts published. */
	_n( '%s Post published', '%s Posts published', count, 'jetpack-premium-analytics-pkg' );

/**
 * Read one period's views per visitor and posts published, bucket by bucket.
 *
 * @param report    - The period's views/visitors report, with `post_titles` requested.
 * @param zone      - The report's reporting timezone.
 * @param axisDates - For a comparison period, the current period's bucket dates: each
 *                  bucket is read at the current bucket in the same position.
 * @return The points of both rows, and the period's own bucket dates.
 */
function readPeriod(
	report: StatsVisitsResponse | undefined,
	zone: string,
	axisDates?: Array< Date | undefined >
) {
	const viewsPerVisitor: ExtraPoints = [];
	const postsPublished: ExtraPoints = [];
	const dates = ( report?.data ?? [] ).map( point => resolveBucketStamp( point.date_start, zone ) );

	( report?.data ?? [] ).forEach( ( point, index ) => {
		const ownDate = dates[ index ];
		const date = axisDates ? axisDates[ index ] : ownDate;
		if ( ! date || ! ownDate ) {
			return;
		}
		// `realDate` is the date the tooltip row reads; `date` only places it.
		const stamp = axisDates ? { date, realDate: ownDate } : { date };

		const views = numberOf( point, 'views' );
		const visitors = numberOf( point, 'visitors' );
		// A ratio with no visitors has nothing to say, as in classic Stats.
		if ( views !== undefined && visitors !== undefined && visitors > 0 ) {
			viewsPerVisitor.push( { ...stamp, value: views / visitors } );
		}

		// An untitled post arrives as `''` and still counts, as in classic Stats.
		const posts = Array.isArray( point.post_titles ) ? point.post_titles.length : 0;
		if ( posts ) {
			postsPublished.push( { ...stamp, value: posts } );
		}
	} );

	return { viewsPerVisitor, postsPublished, dates };
}

/**
 * The rows classic Stats adds under the traffic chart's tooltip: views per
 * visitor, and the number of posts published in the bucket. Both are read from
 * the `stats/visits` report the Views and Visitors tabs already fetch.
 *
 * @param report     - The current-period views/visitors report, with `post_titles` requested.
 * @param zone       - The report's reporting timezone.
 * @param comparison - The comparison-period report, when a comparison is on.
 * @return The extra series, each omitted when no bucket has a reading for it; a
 *         comparison row follows its current-period row.
 */
export function buildTrafficTooltipExtras(
	report: StatsVisitsResponse | undefined,
	zone: string,
	comparison?: StatsVisitsResponse
): TooltipExtraSeries[] {
	const current = readPeriod( report, zone );
	const previous = comparison ? readPeriod( comparison, zone, current.dates ) : undefined;

	const rows: TooltipExtraSeries[] = [
		{
			label: __( 'Views per visitor', 'jetpack-premium-analytics-pkg' ),
			data: current.viewsPerVisitor,
			dataFormat: VIEWS_PER_VISITOR_FORMAT,
		},
		{
			label: __( 'Views per visitor', 'jetpack-premium-analytics-pkg' ),
			key: 'views-per-visitor-comparison',
			data: previous?.viewsPerVisitor ?? [],
			dataFormat: VIEWS_PER_VISITOR_FORMAT,
		},
		{
			label: __( 'Posts published', 'jetpack-premium-analytics-pkg' ),
			data: current.postsPublished,
			countLabel: postsPublishedLabel,
		},
		{
			label: __( 'Posts published', 'jetpack-premium-analytics-pkg' ),
			key: 'posts-published-comparison',
			data: previous?.postsPublished ?? [],
			countLabel: postsPublishedLabel,
		},
	];

	return rows.filter( row => row.data.length );
}
