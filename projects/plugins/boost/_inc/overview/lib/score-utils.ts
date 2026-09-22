import { __, _n, sprintf } from '@wordpress/i18n';

export type ScoreTier = 'good' | 'medium' | 'poor';

export function getScoreTier( score: number ): ScoreTier {
	return score > 60 ? 'good' : score >= 40 ? 'medium' : 'poor';
}

export function getScoreTierLabel( tier: ScoreTier ): string {
	const labels = {
		good: __( 'Good', 'jetpack-boost' ),
		medium: __( 'Could improve', 'jetpack-boost' ),
		poor: __( 'Poor', 'jetpack-boost' ),
	};
	return labels[ tier ];
}

export function getScoreDelta( current: number, noBoost?: number | null ): number | null {
	return noBoost == null ? null : Math.round( current - noBoost );
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
