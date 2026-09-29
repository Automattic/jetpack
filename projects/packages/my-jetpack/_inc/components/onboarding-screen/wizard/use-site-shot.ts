import { useEffect, useState } from 'react';

/*
 * WordPress.com's screenshot service, the same one Calypso uses for importers
 * and migration previews. `vpw`/`vph` are the viewport it renders the page at,
 * `w`/`h` the image it hands back, and `scale` the device pixel ratio it renders
 * at — the returned image is `w` by `h` either way.
 */
const MSHOTS = 'https://s0.wp.com/mshots/v1/';
const VIEWPORT = 1600;

/*
 * The picture we ask for, and the two error cards as encoded AT THAT SIZE. One
 * object because the byte counts are a function of the dimensions above them:
 * change a dimension without re-measuring and an error card goes on screen in a
 * frame captioned with the reader's own domain. Re-measuring takes a browser.
 */
const SHOT = {
	width: 880,
	height: 550,
	errorCardBytes: [ 17886, 18852 ] as readonly number[],
} as const;

/*
 * Measured against the live service on pages it had not seen: 5.0, 5.4 and 6.5
 * seconds to a picture. A single interval wide enough to cover a slow render
 * adds its own wait to every fast one, so the polls are close together while the
 * render is plausibly finishing and further apart afterwards, when they are only
 * there for the slow case.
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
		w: String( SHOT.width ),
		h: String( SHOT.height ),
		scale: '2',
	} );

	return `${ MSHOTS }${ encodeURIComponent( url ) }?${ query }`;
}

/** What one poll learned: the picture, keep asking, or stop asking. */
type Answer = 'ready' | 'wait' | 'stop';

/**
 * Ask once.
 *
 * @param src    - The screenshot URL.
 * @param signal - Aborts the request when the caller goes away.
 * @return What the service said.
 */
async function askOnce( src: string, signal: AbortSignal ): Promise< Answer > {
	try {
		/*
		 * `manual`, so a poll during the render costs a redirect rather than the
		 * placeholder behind it. While the page is being rendered the service
		 * answers 307 to a placeholder at its own address, which arrives here as an
		 * opaque redirect; once rendered it answers the picture directly.
		 */
		const response = await window.fetch( src, { mode: 'cors', redirect: 'manual', signal } );

		if ( response.type === 'opaqueredirect' ) {
			return 'wait';
		}

		// A refusal is an answer, not a slow render, and asking again only gets it
		// back. Calypso's own helper stops on a 4xx too.
		if ( ! response.ok ) {
			return 'stop';
		}

		return SHOT.errorCardBytes.includes( ( await response.blob() ).size ) ? 'stop' : 'ready';
	} catch {
		// A network refusal is the same as not ready yet. The panel keeps its
		// artwork either way.
		return 'wait';
	}
}

/**
 * A photograph of this site's homepage, once there is one.
 *
 * Polled, because the service has no callback: the same URL answers a redirect
 * to a placeholder while it renders and the picture once it has rendered. Read
 * with `fetch` rather than by loading the image, so an error card can be told
 * from a homepage (see `SHOT`), and never cache-busted — the URL is the key the
 * render is held under, so a fresh one would start a render and never finish it.
 *
 * @param url     - The site's own URL, or undefined to ask for nothing.
 * @param allowed - Whether this site can be photographed at all; see the PHP.
 * @return The screenshot URL once it is a screenshot, or null.
 */
export function useSiteShot( url: string | undefined, allowed: boolean ): string | null {
	const [ ready, setReady ] = useState< string | null >( null );

	useEffect( () => {
		// Whatever is held belongs to the previous address, and a stale picture of
		// a different site is worse than none.
		setReady( null );

		if ( ! url || ! allowed ) {
			return;
		}

		const src = shotUrl( url );
		const began = Date.now();
		const stopping = new AbortController();
		let timer: ReturnType< typeof setTimeout >;
		let live = true;

		const ask = async () => {
			const answer = await askOnce( src, stopping.signal );

			if ( ! live || answer === 'stop' ) {
				return;
			}

			if ( answer === 'ready' ) {
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
			stopping.abort();
			clearTimeout( timer );
		};
	}, [ url, allowed ] );

	return ready;
}
