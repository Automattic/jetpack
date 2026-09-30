/**
 * External dependencies
 */
import { resolveBucketStamp } from '@jetpack-premium-analytics/datetime';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { StatsVisitsResponse } from '@jetpack-premium-analytics/data';
import type { TooltipExtraSeries } from '@jetpack-premium-analytics/widgets-toolkit';

const VIEWS_PER_VISITOR_FORMAT = { type: 'number' as const, options: { decimals: 2 } };

/** Titles are listed up to here; past it the row carries a count, as classic Stats does. */
const MAX_LISTED_TITLES = 2;

type TooltipPoint = TooltipExtraSeries[ 'data' ][ number ];

function postTitlesOf( point: Record< string, unknown > ): string[] {
	const titles = point.post_titles;

	return Array.isArray( titles )
		? titles.filter( ( title ): title is string => typeof title === 'string' && title !== '' )
		: [];
}

function numberOf( point: Record< string, unknown >, field: string ): number | undefined {
	const value = point[ field ];

	return typeof value === 'number' ? value : undefined;
}

/**
 * The rows classic Stats adds under the traffic chart's tooltip: views per
 * visitor, and the posts published in the bucket. Both are read from the
 * `stats/visits` report the Views and Visitors tabs already fetch.
 *
 * @param report - The current-period views/visitors report, with `post_titles` requested.
 * @param zone   - The report's reporting timezone.
 * @return The extra series, each omitted when no bucket has a reading for it.
 */
export function buildTrafficTooltipExtras(
	report: StatsVisitsResponse | undefined,
	zone: string
): TooltipExtraSeries[] {
	const viewsPerVisitor: TooltipPoint[] = [];
	const postsPublished: TooltipPoint[] = [];

	for ( const point of report?.data ?? [] ) {
		const date = resolveBucketStamp( point.date_start, zone );
		if ( ! date ) {
			continue;
		}

		const views = numberOf( point, 'views' );
		const visitors = numberOf( point, 'visitors' );
		// A ratio with no visitors has nothing to say, as in classic Stats.
		if ( views !== undefined && visitors !== undefined && visitors > 0 ) {
			viewsPerVisitor.push( { date, value: views / visitors } );
		}

		const titles = postTitlesOf( point );
		if ( titles.length ) {
			postsPublished.push( {
				date,
				value: titles.length,
				tooltipText:
					titles.length <= MAX_LISTED_TITLES
						? sprintf(
								/* translators: %s: the titles of the posts published that day, comma separated. */
								_n(
									'Post published: %s',
									'Posts published: %s',
									titles.length,
									'jetpack-premium-analytics-pkg'
								),
								titles.join( ', ' )
							)
						: undefined,
			} );
		}
	}

	const extras: TooltipExtraSeries[] = [];

	if ( viewsPerVisitor.length ) {
		extras.push( {
			label: __( 'Views per visitor', 'jetpack-premium-analytics-pkg' ),
			data: viewsPerVisitor,
			dataFormat: VIEWS_PER_VISITOR_FORMAT,
			derived: true,
		} );
	}

	if ( postsPublished.length ) {
		extras.push( {
			label: __( 'Posts published', 'jetpack-premium-analytics-pkg' ),
			data: postsPublished,
			countLabel: count =>
				/* translators: %s: number of posts published. */
				_n( '%s Post published', '%s Posts published', count, 'jetpack-premium-analytics-pkg' ),
			derived: true,
		} );
	}

	return extras;
}
