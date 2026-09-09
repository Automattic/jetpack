/**
 * The browser side of the checkpoint: open the popup, wait for its answer.
 */

import { clearPassport } from './passport';
import type { ConnectUrl, Provider } from '../../shared/types';

export type CheckpointResult =
	| { code: string; name: string; avatar: string }
	| { error: string }
	| { cancelled: true };

// What the Consulate tags its postMessage with. A filter, not a boundary.
const CHANNEL = 'jetpack-comment-identity';

const POPUP_NAME = 'jetpack-comments-identity';
const POPUP_WIDTH = 420;
const POPUP_HEIGHT = 560;

// Refresh a URL this close to expiring, so a slow popup does not arrive late.
const EXPIRY_MARGIN_S = 30;

const CLOSED_POLL_MS = 250;

/**
 * A fresh challenge: 32 random bytes, base64url.
 *
 * @return The challenge.
 */
const randomChallenge = (): string => {
	const bytes = new Uint8Array( 32 );
	crypto.getRandomValues( bytes );

	return btoa( String.fromCharCode( ...bytes ) )
		.replace( /\+/g, '-' )
		.replace( /\//g, '_' )
		.replace( /=+$/, '' );
};

/**
 * The signed URL for a provider, re-signed by the site when the rendered one
 * has expired or was never there. A cached page hands out stale ones.
 *
 * @param provider - Which sign-in.
 * @return The URL and its challenge.
 */
const connectUrl = async ( provider: Provider ): Promise< ConnectUrl > => {
	const { connect, refreshUrl } = JetpackComments.identity;
	const current = connect[ provider ];

	if ( current && current.expires - EXPIRY_MARGIN_S > Date.now() / 1000 ) {
		return current;
	}

	const url = new URL( refreshUrl );
	url.searchParams.set( 'provider', provider );
	url.searchParams.set( 'challenge', randomChallenge() );

	const response = await fetch( url.toString(), { credentials: 'omit' } );

	if ( ! response.ok ) {
		throw new Error( response.status === 429 ? 'rate_limited' : 'server_error' );
	}

	const fresh = ( await response.json() ) as ConnectUrl;
	connect[ provider ] = fresh;

	return fresh;
};

/**
 * Popup placement, centred on the window that opens it.
 *
 * @return The features string for window.open().
 */
const popupFeatures = (): string => {
	const left = Math.max( 0, window.screenX + ( window.outerWidth - POPUP_WIDTH ) / 2 );
	const top = Math.max( 0, window.screenY + ( window.outerHeight - POPUP_HEIGHT ) / 2 );

	return `width=${ POPUP_WIDTH },height=${ POPUP_HEIGHT },left=${ Math.round(
		left
	) },top=${ Math.round( top ) },status=0,toolbar=0,location=1,menubar=0,resizable=1,scrollbars=1`;
};

/**
 * Sign in through the popup.
 *
 * Opens the window synchronously, inside the click, so a popup blocker lets it
 * through; the URL is filled in once it is known to be fresh.
 *
 * @param provider - Which sign-in.
 * @param onOpen   - Receives the window, so the caller can close it on Cancel.
 * @return How it ended.
 */
export const signIn = async (
	provider: Provider,
	onOpen: ( popup: Window | null ) => void
): Promise< CheckpointResult > => {
	const popup = window.open( '', POPUP_NAME, popupFeatures() );
	onOpen( popup );

	if ( ! popup ) {
		return { error: 'popup_blocked' };
	}

	let connect: ConnectUrl;

	try {
		connect = await connectUrl( provider );
	} catch ( error ) {
		popup.close();
		return { error: error instanceof Error ? error.message : 'server_error' };
	}

	popup.location.href = connect.url;

	return new Promise< CheckpointResult >( resolve => {
		const { origin } = JetpackComments.identity;
		let timer = 0;

		const finish = ( result: CheckpointResult ) => {
			window.removeEventListener( 'message', onMessage );
			window.clearInterval( timer );
			resolve( result );
		};

		const onMessage = ( event: MessageEvent ) => {
			if ( event.origin !== origin ) {
				return;
			}

			const data = event.data as Record< string, unknown > | null;

			if (
				! data ||
				typeof data !== 'object' ||
				data.type !== CHANNEL ||
				data.challenge !== connect.challenge
			) {
				return;
			}

			if ( typeof data.error === 'string' ) {
				finish( data.error === 'access_denied' ? { cancelled: true } : { error: data.error } );
			} else if ( typeof data.code === 'string' && data.code !== '' ) {
				finish( {
					code: data.code,
					name: typeof data.name === 'string' ? data.name : '',
					avatar: typeof data.avatar === 'string' ? data.avatar : '',
				} );
			}

			if ( ! popup.closed ) {
				popup.close();
			}
		};

		window.addEventListener( 'message', onMessage );

		// The popup may sit on a consent screen for a while, so closing it
		// is the only other way this ends.
		timer = window.setInterval( () => {
			if ( popup.closed ) {
				finish( { cancelled: true } );
			}
		}, CLOSED_POLL_MS );
	} );
};

/**
 * Hand the passport back, so the next visit starts logged out.
 *
 * @return Whether the site confirmed it.
 */
export const logOut = async (): Promise< boolean > => {
	clearPassport();

	const { logoutUrl, logoutAction } = JetpackComments.identity;

	try {
		const response = await fetch( logoutUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: new URLSearchParams( { action: logoutAction } ),
		} );

		return response.ok;
	} catch {
		return false;
	}
};
