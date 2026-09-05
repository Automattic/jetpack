/**
 * Mounts one VideoPress player per inline placeholder from the player bundle
 * that Inline_Player::enqueue_assets() loads once per page (`window.videopress`).
 */

export const PLACEHOLDER_SELECTOR = '.jetpack-videopress-player__inline[data-videopress-guid]';

type PlayerOptions = Record< string, unknown >;
type PlayerFactory = ( guid: string, container: HTMLElement, options: PlayerOptions ) => unknown;

declare global {
	interface Window {
		videopress?: PlayerFactory;
	}
}

/**
 * Parse the options a placeholder carries; malformed JSON yields no options.
 *
 * @param raw - The `data-videopress-options` attribute value.
 * @return The parsed options object.
 */
export function parsePlaceholderOptions( raw: string | undefined ): PlayerOptions {
	if ( ! raw ) {
		return {};
	}
	try {
		const parsed = JSON.parse( raw );
		return parsed && typeof parsed === 'object' && ! Array.isArray( parsed ) ? parsed : {};
	} catch {
		return {};
	}
}

/**
 * Mount a player on every placeholder under `root` that does not have one yet.
 *
 * @param root - Where to look for placeholders; the whole document by default.
 * @return How many players were mounted by this call.
 */
export function mountInlinePlayers( root: ParentNode = document ): number {
	const videopress = window.videopress;
	if ( typeof videopress !== 'function' ) {
		return 0;
	}

	let mounted = 0;
	root.querySelectorAll< HTMLElement >( PLACEHOLDER_SELECTOR ).forEach( placeholder => {
		if ( placeholder.dataset.videopressMounted ) {
			return;
		}
		placeholder.dataset.videopressMounted = '1';

		videopress( placeholder.dataset.videopressGuid as string, placeholder, {
			width: placeholder.offsetWidth,
			height: placeholder.offsetHeight,
			fill: true,
			...parsePlaceholderOptions( placeholder.dataset.videopressOptions ),
		} );
		mounted++;
	} );

	return mounted;
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', () => mountInlinePlayers() );
} else {
	mountInlinePlayers();
}
