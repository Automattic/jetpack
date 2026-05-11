// Adapted from `@automattic/components`' ConfettiAnimation. Caller handles the
// `prefers-reduced-motion` check and the first-ever-save snapshot.

import { useEffect } from '@wordpress/element';
import confetti from 'canvas-confetti';

const COLORS = [ '#31CC9F', '#618DF2', '#6AB3D0', '#B35EB1', '#F2D76B', '#FAA754', '#E34C84' ];

interface FireOpts {
	spread: number;
	startVelocity?: number;
	decay?: number;
	scalar?: number;
}

const fireBurst = ( ratio: number, opts: FireOpts ) => {
	const count = 60;
	const scale = 2;
	confetti( {
		origin: { y: 0.4 },
		colors: COLORS,
		gravity: 6,
		// Above react-modal's z-index.
		zIndex: 1000000,
		particleCount: Math.floor( count * ratio ),
		startVelocity: opts.startVelocity ? scale * opts.startVelocity : undefined,
		spread: scale * opts.spread,
		scalar: opts.scalar ? scale * opts.scalar : scale,
		decay: opts.decay,
	} );
};

const fireConfetti = () => {
	fireBurst( 0.25, { spread: 26, startVelocity: 55 } );
	fireBurst( 0.2, { spread: 60 } );
	fireBurst( 0.35, { spread: 100, decay: 0.91, scalar: 0.8 } );
	fireBurst( 0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 } );
	fireBurst( 0.1, { spread: 120, startVelocity: 45 } );
};

interface Props {
	trigger?: boolean;
	delay?: number;
}

const ConfettiAnimation = ( { trigger = true, delay = 0 }: Props ) => {
	useEffect( () => {
		if ( ! trigger ) {
			return;
		}
		const timer = setTimeout( fireConfetti, delay );
		return () => clearTimeout( timer );
	}, [ trigger, delay ] );
	return null;
};

export default ConfettiAnimation;
