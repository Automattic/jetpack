/**
 * `<ThreatKPIs>` — the headline panel at the top of the Overview tab.
 *
 * Sums blocked / challenged / passed across all categories that have
 * data (skips `not_active_here` cards so the WC contribution doesn't
 * inflate the total on sites without WC). When any contributing category
 * is `preview: true`, surfaces a caveat line so reviewers can tell what
 * portion of the headline is mocked.
 *
 * Visual treatment: a single light surface with eyebrow → big number →
 * label → colored-dot breakdown → optional caveat. Matches modern WP.com
 * stats-panel hierarchy. All counts use tabular-nums.
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
 * Map an interval to the "in the last X" copy used in the headline.
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
 * Render the headline KPI panel.
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
		return (
			<section className="akismet-threat-kpis">
				<Spinner />
			</section>
		);
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
			<span className="akismet-threat-kpis__eyebrow">{ __( 'Threat protection', 'akismet' ) }</span>
			<p className="akismet-threat-kpis__total">
				<span className="akismet-threat-kpis__total-value">{ formatNumber( total ) }</span>
				<span className="akismet-threat-kpis__total-label">
					{ _n( 'threat handled', 'threats handled', total, 'akismet' ) }{ ' ' }
					{ intervalLabel( interval ) }
				</span>
			</p>
			<ul className="akismet-threat-kpis__breakdown">
				<li className="akismet-threat-kpis__breakdown-item akismet-threat-kpis__breakdown-item--blocked">
					<span className="akismet-threat-kpis__breakdown-count">
						{ formatNumber( totalBlocked ) }
					</span>
					<span>{ __( 'Blocked', 'akismet' ) }</span>
				</li>
				<li className="akismet-threat-kpis__breakdown-item akismet-threat-kpis__breakdown-item--challenged">
					<span className="akismet-threat-kpis__breakdown-count">
						{ formatNumber( totalChallenged ) }
					</span>
					<span>{ __( 'Challenged', 'akismet' ) }</span>
				</li>
				<li className="akismet-threat-kpis__breakdown-item akismet-threat-kpis__breakdown-item--passed">
					<span className="akismet-threat-kpis__breakdown-count">
						{ formatNumber( totalPassed ) }
					</span>
					<span>{ __( 'Passed challenge', 'akismet' ) }</span>
				</li>
			</ul>
			{ totalPreview > 0 && (
				<p className="akismet-threat-kpis__caveat">
					<span className="dashicons dashicons-info-outline" aria-hidden="true" />
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
