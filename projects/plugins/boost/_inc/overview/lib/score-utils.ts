import { __, sprintf } from '@wordpress/i18n';

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

export function getScoreDelta( current: number, noBoost?: number | null ): number | null {
	return noBoost == null ? null : Math.round( current - noBoost );
}

export function formatScoreDelta( delta: number ): string {
	const points = delta > 0 ? `+${ delta }` : String( delta );
	if ( Math.abs( delta ) === 1 ) {
		// translators: %s is the change in a performance score, such as +1 or -1.
		return sprintf( __( '%s point', 'jetpack-boost' ), points );
	}
	// translators: %s is the change in a performance score, such as +10, 0, or -10.
	return sprintf( __( '%s points', 'jetpack-boost' ), points );
}

export function getScoreTierColor( tier: ScoreTier ): string {
	const colors = {
		good: 'var(--jetpack-boost-score-good)',
		medium: 'var(--jetpack-boost-score-medium)',
		poor: 'var(--jetpack-boost-score-poor)',
	};
	return colors[ tier ];
}
