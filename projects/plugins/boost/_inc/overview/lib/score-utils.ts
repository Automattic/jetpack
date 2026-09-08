import { __, _n, sprintf } from '@wordpress/i18n';

export function getScoreTier( score: number ): 'good' | 'medium' | 'poor' {
	// Match the thresholds of the existing Boost score bars.
	return score > 70 ? 'good' : score > 50 ? 'medium' : 'poor';
}

export function getScoreTierLabel( score: number ): string {
	const labels = {
		good: __( 'Good', 'jetpack-boost' ),
		medium: __( 'Could be improved', 'jetpack-boost' ),
		poor: __( 'Poor', 'jetpack-boost' ),
	};
	return labels[ getScoreTier( score ) ];
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
