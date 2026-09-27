import { useEffect, useState } from 'react';

/*
 * WordPress.com's screenshot service, the same one Calypso uses for importers
 * and migration previews. `vpw`/`vph` are the viewport it renders at, `w`/`h`
 * the image it returns, and `scale` 2 asks for retina.
 */
const MSHOTS = 'https://s0.wp.com/mshots/v1/';
const VIEWPORT = 1600;
const WIDTH = 880;
const HEIGHT = 550;

/*
 * Measured against the live service on pages it had not seen: 5.0, 5.4 and 6.5
 * seconds to a picture. A single interval wide enough to cover a slow render
 * adds its own wait to every fast one, so the polls are close together while
 * the render is plausibly finishing and further apart afterwards, when they are
 * only there for the slow case.
 */
const RETRY_MS = 1000;
const SLOW_RETRY_MS = 2500;
const SLOW_AFTER_MS = 10000;
const GIVE_UP_MS = 25000;

/**
 * The address of this site's homepage as WordPress.com would photograph it.
 *
 * @param url - The site's own URL.
 * @return The screenshot URL.
 */
function shotUrl( url: string ): string {
	const query = new URLSearchParams( {
		vpw: String( VIEWPORT ),
		vph: String( VIEWPORT ),
		w: String( WIDTH ),
		h: String( HEIGHT ),
		scale: '2',
	} );

	return `${ MSHOTS }${ encodeURIComponent( url ) }?${ query }`;
}

/**
 * A photograph of this site's homepage, once there is one.
 *
 * Null until the service has a real picture, and null for good if it never
 * does. Nothing waits on this: the panel draws either way and the picture
 * arrives into it, or does not.
 *
 * The polling is the awkward part and it is not ours. There is no callback and
 * no status: the same URL answers 200 with `image/gif` while the page is being
 * rendered and 200 with `image/jpeg` once it has been, so the content type is
 * the only thing that separates them. Calypso's own helper does the same.
 *
 * It is read with `fetch` rather than by loading the image and measuring it.
 * Measured against the live service, the placeholder and the screenshot are
 * both 400 by 300, so there is nothing in the pixels to tell them apart.
 *
 * The URL never varies between polls. It is what the service keys its render
 * on, so a cache-buster would start a new render every time and never finish
 * one.
 *
 * @param url     - The site's own URL, or undefined to ask for nothing.
 * @param allowed - Whether this site can be photographed at all; see the PHP.
 * @return The screenshot URL once it is a screenshot, or null.
 */
export function useSiteShot( url: string | undefined, allowed: boolean ): string | null {
	const [ ready, setReady ] = useState< string | null >( null );

	useEffect( () => {
		if ( ! url || ! allowed ) {
			return;
		}

		const src = shotUrl( url );
		const began = Date.now();
		let timer: ReturnType< typeof setTimeout >;
		let live = true;

		const ask = async () => {
			let done = false;

			try {
				const response = await window.fetch( src, { mode: 'cors' } );
				done = ( response.headers.get( 'content-type' ) ?? '' ).includes( 'jpeg' );
			} catch {
				// A network refusal is the same as not ready yet: ask again, and stop
				// at the deadline. The panel keeps its artwork either way.
			}

			if ( ! live ) {
				return;
			}

			if ( done ) {
				setReady( src );
				return;
			}

			const waited = Date.now() - began;

			if ( waited < GIVE_UP_MS ) {
				timer = setTimeout( ask, waited < SLOW_AFTER_MS ? RETRY_MS : SLOW_RETRY_MS );
			}
		};

		ask();

		return () => {
			live = false;
			clearTimeout( timer );
		};
	}, [ url, allowed ] );

	return ready;
}
