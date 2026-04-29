import { _n, sprintf } from '@wordpress/i18n';
import { useSubscribersTotals } from '../data/use-subscribers-totals';

/**
 * Format an integer with locale-aware thousands separators. Falls back to the raw value if
 * `Intl.NumberFormat` is unavailable.
 *
 * @param value - Number to format.
 * @return Formatted string.
 */
function formatCount( value: number ): string {
	try {
		return new Intl.NumberFormat().format( value );
	} catch {
		return String( value );
	}
}

/**
 * Subscriber totals summary — single-line "X total subscribers" header, mirroring Calypso's
 * unfiltered SubscriberTotals view. Filtered/searched variants land in Phase 3.
 *
 * @return Totals summary or null while loading on first render.
 */
export default function SubscribersTotals(): JSX.Element | null {
	const { data, isLoading, error } = useSubscribersTotals();

	if ( isLoading || error ) {
		return null;
	}

	const total = data.total_subscribers;

	return (
		<p className="jetpack-subscribers-dashboard__totals">
			{ sprintf(
				/* translators: %s: subscriber count, e.g. "1,234". */
				_n( '%s total subscriber', '%s total subscribers', total, 'jetpack-subscribers-dashboard' ),
				formatCount( total )
			) }
		</p>
	);
}
