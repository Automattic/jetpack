import { getScoreTier } from '@automattic/jetpack-boost-score-api';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { ScoreTier } from '@automattic/jetpack-boost-score-api';
import type { SpeedScoresSet } from './use-speed-scores';

export { getScoreTier };
export type { ScoreTier };

export function getScoreTierLabel( tier: ScoreTier ): string {
	const labels = {
		good: __( 'Good', 'jetpack-boost' ),
		medium: __( 'Could improve', 'jetpack-boost' ),
		poor: __( 'Poor', 'jetpack-boost' ),
	};
	return labels[ tier ];
}

export function getOverallScoreTier( scores: SpeedScoresSet ): ScoreTier {
	return getScoreTier( ( scores.current.mobile + scores.current.desktop ) / 2 );
}

export function getScoreDisplayState( {
	isRunning = false,
	hasScores = true,
	error,
}: {
	isRunning?: boolean;
	hasScores?: boolean;
	error?: Error | null;
} ): 'generating' | 'error' | 'scores' {
	return error ? 'error' : isRunning || ! hasScores ? 'generating' : 'scores';
}

/**
 * Estimate how far along a speed test is, from how long this site's runs usually take.
 *
 * @param elapsed  - Seconds since the run was dispatched.
 * @param expected - Seconds a run usually takes.
 * @return Percent done: 90 at the expected time, then easing toward 99 so a slow run never reads as done.
 */
export function getEstimatedPercent( elapsed: number, expected: number ): number {
	const ratio = Math.max( 0, elapsed ) / expected;
	const percent = ratio < 1 ? 90 * ratio : 90 + 10 * ( 1 - Math.exp( 1 - ratio ) );
	return Math.min( 99, Math.floor( percent ) );
}

export function getScoreDelta(
	current: number | undefined,
	noBoost?: number | null,
	isStale = false
): number | null {
	return current === undefined || noBoost == null || isStale
		? null
		: Math.round( current - noBoost );
}

export function getScoreGain(
	current: number | undefined,
	noBoost?: number | null,
	isStale = false
): number | null {
	const delta = getScoreDelta( current, noBoost, isStale );
	// The badge states what Boost improved, so a worse-than-baseline comparison reads as zero.
	return delta === null ? null : Math.max( 0, delta );
}

export function formatScoreDelta( delta: number ): string {
	const points = delta > 0 ? `+${ delta }` : String( delta );
	return sprintf(
		// translators: %s is the change in a performance score, such as +10, 0, or -10.
		_n( '%s point', '%s points', Math.abs( delta ), 'jetpack-boost' ),
		points
	);
}

export function getScoreTierColor( tier: ScoreTier ): string {
	const colors = {
		good: 'var(--jetpack-boost-score-good)',
		medium: 'var(--jetpack-boost-score-medium)',
		poor: 'var(--jetpack-boost-score-poor)',
	};
	return colors[ tier ];
}
