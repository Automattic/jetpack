import { __ } from '@wordpress/i18n';

/**
 * Short qualitative tier label for a Lighthouse-style 0-100 score.
 * Thresholds match `@automattic/jetpack-boost-score-api` semantics.
 *
 * @param score - 0-100 numeric score.
 * @return Localized tier label.
 */
export function getScoreTier( score: number ): string {
	if ( score >= 90 ) {
		return __( 'Good', 'jetpack-boost' );
	}
	if ( score >= 50 ) {
		return __( 'Could be improved', 'jetpack-boost' );
	}
	return __( 'Poor', 'jetpack-boost' );
}

/**
 * Delta between the current score and the baseline (without Boost) score.
 * Returns null when the baseline is unavailable so callers can hide the
 * indicator instead of showing a misleading 0.
 *
 * @param current - Current Lighthouse score.
 * @param noBoost - Lighthouse score without any Boost optimizations enabled.
 * @return Signed integer delta or null.
 */
export function getScoreDelta(
	current: number,
	noBoost: number | null | undefined
): number | null {
	if ( noBoost === null || noBoost === undefined ) {
		return null;
	}
	return Math.round( current - noBoost );
}

/**
 * Maps a signed delta onto the `TrendIndicator` direction vocabulary
 * (`up` / `down` / `neutral`). Zero deltas read as neutral so the chip is
 * grey instead of green-with-zero.
 *
 * @param delta - Signed integer score delta.
 * @return Direction string consumable by `TrendIndicator`.
 */
export function getTrendDirection( delta: number ): 'up' | 'down' | 'neutral' {
	if ( delta > 0 ) {
		return 'up';
	}
	if ( delta < 0 ) {
		return 'down';
	}
	return 'neutral';
}

/**
 * Pre-formatted delta label ("+10 points" / "−10 points" / "No change").
 * Pre-formatting lets `TrendIndicator` (which takes a `value` string) read
 * out the localized copy without each caller re-templating it.
 *
 * @param delta - Signed integer score delta.
 * @return Localized delta string.
 */
export function formatScoreDelta( delta: number ): string {
	if ( delta === 0 ) {
		return __( 'No change', 'jetpack-boost' );
	}
	const abs = Math.abs( delta );
	const sign = delta > 0 ? '+' : '−';
	return `${ sign }${ abs } ${ __( 'points', 'jetpack-boost' ) }`;
}
