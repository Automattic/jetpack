import { sprintf, __ } from '@wordpress/i18n';
import formatNumber from '../../utils/format-number';
import formatPercentage from '../../utils/format-percentage';

/**
 * Creates text describing a stat difference between two periods.
 * The text mentions both the absolute difference and the percentage difference.
 *
 * @param {Function} countStat     - Function that accepts a number and calls _n() with that number to return the singular or plural form of the stat count.
 *                                 E.g. countStat( 1 ) returns '%s view', countStat( 5 ) returns '%s views'
 * @param {number}   count         - Current period count
 * @param {number}   previousCount - Previous period count
 * @return {string}  Formatted text describing the difference
 */
const createStatDiffText = ( countStat, count, previousCount ) => {
	if ( typeof count !== 'number' || typeof previousCount !== 'number' ) {
		return '';
	}

	const diff = count - previousCount;

	if ( diff === 0 ) {
		return __( 'No change since the previous period.', 'jetpack-my-jetpack' );
	}

	const statCount = countStat( Math.abs( diff ) ); // E.g. '%s views'
	const statDiff = sprintf( statCount, formatNumber( Math.abs( diff ) ) ); // E.g. '5 views'
	const absRatio = previousCount !== 0 ? Math.abs( diff / previousCount ) : null;

	if ( ! absRatio ) {
		if ( diff > 0 ) {
			return sprintf(
				// translators: %s: stat difference (e.g. `5 views`)
				__( 'An increase of %s since the previous period.', 'jetpack-my-jetpack' ),
				statDiff
			);
		}

		return sprintf(
			// translators: %s: stat difference (e.g. `5 views`)
			__( 'A decrease of %s since the previous period.', 'jetpack-my-jetpack' ),
			statDiff
		);
	}

	if ( diff > 0 ) {
		return sprintf(
			// translators: %1$s: stat difference (e.g. `5 views`), %2$s: stat difference percentage (e.g. `10%`)
			__( 'An increase of %1$s or %2$s since the previous period.', 'jetpack-my-jetpack' ),
			statDiff,
			formatPercentage( absRatio )
		);
	}

	return sprintf(
		// translators: %1$s: stat difference (e.g. `5 views`), %2$s: stat difference percentage (e.g. `10%`)
		__( 'A decrease of %1$s or %2$s since the previous period.', 'jetpack-my-jetpack' ),
		statDiff,
		formatPercentage( absRatio )
	);
};

export default createStatDiffText;
