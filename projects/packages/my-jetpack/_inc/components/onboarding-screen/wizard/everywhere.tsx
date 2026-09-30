import { useEffect, useRef } from 'react';
import { everywhereArt } from './everywhere-art';
import styles from './styles.module.scss';

// Scene units of travel at the panel's edge for a depth of 1. Small on purpose:
// the cards should feel like they sit at different distances, not slide.
const RANGE = 9;

/**
 * A site being run, on the step that asks what the site is for: a restore
 * finishing, one post going to eight networks, and somebody else in the room.
 *
 * `dangerouslySetInnerHTML` because the markup is a build-time constant from this
 * repository and nothing user-supplied reaches it. See `everywhere-art.ts`.
 *
 * @return The rendered artwork.
 */
export function EverywhereArt() {
	const hostRef = useRef< HTMLDivElement >( null );

	/*
	 * The pointer parallax. It ships with the composition — five `.ev-par` layers
	 * carrying their own `--depth` — but it needs a listener, so it is wired here
	 * rather than inside the SVG.
	 *
	 * Smoothing is the CSS transition the composition puts on those layers, so
	 * every frame stays on the compositor rather than being driven from here.
	 */
	useEffect( () => {
		const scene = hostRef.current?.querySelector< SVGSVGElement >( '#ev-scene' );
		const layers = Array.from( scene?.querySelectorAll< SVGGElement >( '.ev-par' ) ?? [] );

		if ( ! scene || ! layers.length ) {
			return;
		}

		// Touch fires one hover on tap and then nothing, which would leave the
		// cards stuck off centre for good. Reduced motion opts out entirely.
		const fine = window.matchMedia( '(hover: hover) and (pointer: fine)' );
		const still = window.matchMedia( '(prefers-reduced-motion: reduce)' );

		let frame = 0;
		let tx = 0;
		let ty = 0;

		const apply = () => {
			frame = 0;
			layers.forEach( layer => {
				const depth = parseFloat( layer.style.getPropertyValue( '--depth' ) ) || 1;
				layer.style.transform = `translate(${ ( tx * depth ).toFixed( 2 ) }px, ${ (
					ty * depth
				).toFixed( 2 ) }px)`;
			} );
		};

		const schedule = () => {
			if ( ! frame ) {
				frame = requestAnimationFrame( apply );
			}
		};

		const onMove = ( event: PointerEvent ) => {
			const box = scene.getBoundingClientRect();

			if ( ! box.width ) {
				return;
			}

			// Scene units, not screen pixels: the SVG is scaled to fit and the
			// transform lives inside it, so a pixel offset would shrink with the
			// window. jsdom has no viewBox geometry, hence the fallback.
			const scale = ( scene.viewBox?.baseVal?.width || box.width ) / box.width;

			tx = ( ( event.clientX - box.left ) / box.width - 0.5 ) * 2 * RANGE * scale;
			ty = ( ( event.clientY - box.top ) / box.height - 0.5 ) * 2 * RANGE * scale;
			schedule();
		};

		const reset = () => {
			tx = 0;
			ty = 0;
			schedule();
		};

		const enable = () => {
			if ( ! fine.matches || still.matches ) {
				reset();
				return;
			}

			scene.addEventListener( 'pointermove', onMove );
			scene.addEventListener( 'pointerleave', reset );
		};

		const disable = () => {
			scene.removeEventListener( 'pointermove', onMove );
			scene.removeEventListener( 'pointerleave', reset );
			reset();
		};

		const requery = () => {
			disable();
			enable();
		};

		enable();

		// Both can change while the page is open: a mouse pairing, or the setting
		// being turned on in another window.
		fine.addEventListener( 'change', requery );
		still.addEventListener( 'change', requery );

		return () => {
			if ( frame ) {
				cancelAnimationFrame( frame );
			}

			disable();
			fine.removeEventListener( 'change', requery );
			still.removeEventListener( 'change', requery );
		};
	}, [] );

	return (
		<div
			ref={ hostRef }
			className={ styles.everywhere }
			aria-hidden="true"
			// eslint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={ { __html: everywhereArt } }
		/>
	);
}
