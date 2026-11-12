import confetti from 'canvas-confetti';

const COLORS = [ '#31CC9F', '#618DF2', '#6AB3D0', '#B35EB1', '#F2D76B', '#FAA754', '#E34C84' ];

// The WordPress.com celebration burst, from Calypso's ConfettiAnimation.
const BURSTS: confetti.Options[] = [
	{ particleCount: 15, spread: 52, startVelocity: 110 },
	{ particleCount: 12, spread: 120 },
	{ particleCount: 21, spread: 200, decay: 0.91, scalar: 1.6 },
	{ particleCount: 6, spread: 240, startVelocity: 50, decay: 0.92, scalar: 2.4 },
	{ particleCount: 6, spread: 240, startVelocity: 90 },
];

/**
 * Throws the celebration confetti, unless the user prefers reduced motion.
 */
export function fireConfetti(): void {
	if ( window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
		return;
	}
	for ( const burst of BURSTS ) {
		confetti( {
			origin: { y: 0.4 },
			colors: COLORS,
			gravity: 6,
			scalar: 2,
			zIndex: 100000, // Above the wp-admin toolbar.
			...burst,
		} );
	}
}
