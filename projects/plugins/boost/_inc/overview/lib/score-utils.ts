import { __, _n, sprintf } from '@wordpress/i18n';

export type ScoreTier = 'good' | 'medium' | 'poor';

export function getScoreTier( score: number ): ScoreTier {
	// Keep tiers aligned with js-packages/components/components/boost-score-bar/index.tsx.
	return score > 70 ? 'good' : score > 50 ? 'medium' : 'poor';
}

export function getGradeTier( grade: string ): ScoreTier {
	return grade === 'A' || grade === 'B' ? 'good' : grade === 'C' ? 'medium' : 'poor';
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

export function getTrendDirection( delta: number ): 'up' | 'down' | 'neutral' {
	return delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
}

export function formatScoreDelta( delta: number ): string {
	if ( delta === 0 ) {
		return __( 'No change', 'jetpack-boost' );
	}
	return sprintf(
		// translators: %s is the signed change in a performance score, such as +10 or −1.
		_n( '%s point', '%s points', Math.abs( delta ), 'jetpack-boost' ),
		`${ delta > 0 ? '+' : '−' }${ Math.abs( delta ) }`
	);
}
