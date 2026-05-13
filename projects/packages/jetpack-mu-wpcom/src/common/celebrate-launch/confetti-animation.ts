/**
 * Originally sourced from `@automattic/components`
 * https://github.com/Automattic/wp-calypso/blob/df175811d96c9af3369a7f39978b74668d9f4896/packages/components/src/confetti/index.ts
 */

import confetti from 'canvas-confetti';
import { useEffect } from 'react';

const COLORS = [ '#31CC9F', '#618DF2', '#6AB3D0', '#B35EB1', '#F2D76B', '#FAA754', '#E34C84' ];

type FireOptions = {
	spread: number;
	startVelocity?: number;
	decay?: number;
	scalar?: number;
};

/**
 * Fires confetti animation with various particle configurations.
 *
 * @param {string[]} colors - Array of color values for the confetti particles.
 */
function fireConfetti( colors: string[] ) {
	const count = 60;
	const scale = 2;
	const defaults = {
		origin: { y: 0.4 },
		colors,
		scalar: scale,
		spread: 180,
		gravity: 6,
	};

	/**
	 * Fires a burst of confetti particles with the specified options.
	 *
	 * @param {number}      particleRatio - Ratio of particles to fire.
	 * @param {FireOptions} opts          - Configuration options for the confetti burst.
	 */
	function fire( particleRatio: number, opts: FireOptions ) {
		confetti(
			Object.assign( {}, defaults, opts, {
				particleCount: Math.floor( count * particleRatio ),
				startVelocity: opts.startVelocity ? scale * opts.startVelocity : undefined,
				spread: scale * opts.spread,
				scalar: opts.scalar ? scale * opts.scalar : scale,
				// counter react-modal very high z index, always render the confetti on top
				zIndex: 1000000,
			} )
		);
	}

	fire( 0.25, {
		spread: 26,
		startVelocity: 55,
	} );
	fire( 0.2, {
		spread: 60,
	} );
	fire( 0.35, {
		spread: 100,
		decay: 0.91,
		scalar: 0.8,
	} );
	fire( 0.1, {
		spread: 120,
		startVelocity: 25,
		decay: 0.92,
		scalar: 1.2,
	} );
	fire( 0.1, {
		spread: 120,
		startVelocity: 45,
	} );
}

const ConfettiAnimation = ( { trigger = true, delay = 0, colors = COLORS } ) => {
	useEffect( () => {
		if ( trigger ) {
			setTimeout( () => fireConfetti( colors ), delay );
		}
	}, [ trigger, delay, colors ] );

	return null;
};

export default ConfettiAnimation;
