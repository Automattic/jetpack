import { __, _n, sprintf } from '@wordpress/i18n';

export type ScoreTier = 'good' | 'medium' | 'poor';

export function getScoreTier( score: number ): ScoreTier {
	// Keep tiers aligned with js-packages/components/components/boost-score-bar/index.tsx.
	return score > 70 ? 'good' : score > 50 ? 'medium' : 'poor';
}

export function getScoreTierLabel( tier: ScoreTier ): string {
	const labels = {
		good: __( 'Good', 'jetpack-boost' ),
		medium: __( 'Could be improved', 'jetpack-boost' ),
		poor: __( 'Poor', 'jetpack-boost' ),
	};
	return labels[ tier ];
}

export function getScoreDelta( current: number, noBoost?: number | null ): number | null {
	return noBoost == null ? null : Math.round( current - noBoost );
}

// Formats a score improvement relative to Boost being disabled.
export function formatScoreDelta( delta: number ): string | null {
	if ( delta <= 0 ) {
		return null;
	}

	return sprintf(
		// translators: %s is the improvement in a performance score, such as +10.
		_n(
			'%s point compared with Boost disabled',
			'%s points compared with Boost disabled',
			delta,
			'jetpack-boost'
		),
		`+${ delta }`
	);
}
