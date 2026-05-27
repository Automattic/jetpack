/**
 * `<ThreatKPIs>` — the headline row above the category grid.
 *
 * Sums blocked / challenged / passed across all categories that have
 * data (skips `not_active_here` cards so the WC contribution doesn't
 * inflate the total on sites without WC). When any contributing category
 * is `preview: true`, surfaces a caveat line so reviewers can tell what
 * portion of the headline is mocked.
 *
 * Rules-of-hooks: calls `useCategorySummary` once per CATEGORIES entry in
 * a stable-length array. React's hook order stays consistent across
 * renders — same trade-off the plan documented for <CategoryGrid>.
 */
import { Spinner } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCategorySummary } from '@/hooks/use-category-summary';
import { CATEGORIES } from '@/routes/overview/category-config';
import type { StatsInterval } from '@/lib/types';

type Props = { interval: StatsInterval };

/**
 * Format an integer with the locale's thousands separator.
 *
 * @param value - Number to format.
 * @return Formatted string.
 */
function formatNumber( value: number ): string {
	return new Intl.NumberFormat().format( value );
}

/**
 * Map an interval to its English-localized "in the last X" copy.
 *
 * @param interval - The interval id.
 * @return Translated phrase.
 */
function intervalLabel( interval: StatsInterval ): string {
	switch ( interval ) {
		case '30-days':
			return __( 'in the last 30 days', 'akismet' );
		case '60-days':
			return __( 'in the last 60 days', 'akismet' );
		case '6-months':
			return __( 'in the last 6 months', 'akismet' );
		case 'all':
			return __( 'all time', 'akismet' );
	}
}

/**
 * Render the headline KPI row.
 *
 * @param props - The component props.
 * @return The headline + breakdown + (optional) preview caveat.
 */
export function ThreatKPIs( props: Props ): JSX.Element {
	const { interval } = props;

	// Pull every category. Same query cache → not six round-trips, six
	// cache reads after the grid hydrates. CATEGORIES is a frozen
	// constant — hook order stays consistent across renders.
	const summaries = CATEGORIES.map( def => useCategorySummary( def.id, interval ) );

	if ( summaries.some( s => s.isLoading ) ) {
		return <Spinner />;
	}

	let totalBlocked = 0;
	let totalChallenged = 0;
	let totalPassed = 0;
	let totalPreview = 0;

	for ( const s of summaries ) {
		if ( ! s.data || s.data.not_active_here ) {
			continue;
		}
		totalBlocked += s.data.blocked;
		totalChallenged += s.data.challenged;
		totalPassed += s.data.passed;
		if ( s.data.preview ) {
			totalPreview += s.data.blocked + s.data.challenged + s.data.passed;
		}
	}

	const total = totalBlocked + totalChallenged + totalPassed;

	return (
		<section className="akismet-threat-kpis">
			<p className="akismet-threat-kpis__headline">
				<strong>{ formatNumber( total ) }</strong>{ ' ' }
				{ _n( 'threat handled', 'threats handled', total, 'akismet' ) }{ ' ' }
				{ intervalLabel( interval ) }
			</p>
			<p className="akismet-threat-kpis__breakdown">
				{ sprintf(
					/* translators: 1: blocked count 2: challenged count 3: passed-challenge count */
					__( '%1$s blocked · %2$s challenged · %3$s passed challenge', 'akismet' ),
					formatNumber( totalBlocked ),
					formatNumber( totalChallenged ),
					formatNumber( totalPassed )
				) }
			</p>
			{ totalPreview > 0 && (
				<p className="akismet-threat-kpis__caveat">
					{ sprintf(
						/* translators: %s: count of preview-data threats. */
						__(
							'%s of these are from preview-data categories (badged below) — not real on this site yet.',
							'akismet'
						),
						formatNumber( totalPreview )
					) }
				</p>
			) }
		</section>
	);
}
