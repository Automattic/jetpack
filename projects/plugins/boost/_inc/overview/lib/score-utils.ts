import { __, _n, sprintf } from '@wordpress/i18n';
import type { SpeedScoresSet } from './use-speed-scores';

export type ScoreTier = 'good' | 'medium' | 'poor';

export function getScoreTier( score: number ): ScoreTier {
	// Keep tiers aligned with js-packages/components/components/boost-score-bar/index.tsx.
	return score > 70 ? 'good' : score > 50 ? 'medium' : 'poor';
}

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
