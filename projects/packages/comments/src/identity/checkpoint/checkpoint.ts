/**
 * The browser side of the checkpoint: the popup, and what the site answers about an email.
 */

import { clearPassport } from './passport';
import type { ConnectUrl } from '../../shared/types';

export type CheckpointResult =
	{ code: string; name: string; avatar: string } | { error: string } | { cancelled: true };

// Set by a log-out for the rest of this page load, so the next popup goes back through
// the provider rather than WordPress.com's own cookie signing the previous person in.
let reauth = false;

/**
 * Sign in through the popup.
 *
 * The window opens synchronously, inside the click, so a popup blocker lets it
 * through; the URL is filled in once it is known to be fresh.
 *
 * @param onOpen - Receives the window, so the caller can close it on Cancel.
 * @return How it ended.
 */
export const signIn = async (
	onOpen: ( popup: Window | null ) => void
): Promise< CheckpointResult > => {
	const width = 420;
	const height = 560;
	const left = Math.round( Math.max( 0, window.screenX + ( window.outerWidth - width ) / 2 ) );
	const top = Math.round( Math.max( 0, window.screenY + ( window.outerHeight - height ) / 2 ) );
	const popup = window.open(
		'',
		'jetpack-comments-identity',
		`width=${ width },height=${ height },left=${ left },top=${ top },status=0,toolbar=0,location=1,menubar=0,resizable=1,scrollbars=1`
	);
	onOpen( popup );

	if ( ! popup ) {
		return { error: 'popup_blocked' };
	}

	const { identity } = JetpackComments;
	let connect = identity.connect;

	// A cached page hands out stale URLs; re-sign within 30s of expiry, so a slow popup is not late.
	if ( ! connect || connect.expires - 30 <= Date.now() / 1000 ) {
		const bytes = new Uint8Array( 32 );
		crypto.getRandomValues( bytes );
		const challenge = btoa( String.fromCharCode( ...bytes ) )
			.replace( /\+/g, '-' )
			.replace( /\//g, '_' )
			.replace( /=+$/, '' );
		const url = new URL( identity.connectUrl );
		url.searchParams.set( 'challenge', challenge );

		try {
			const response = await fetch( url.toString(), { credentials: 'omit' } );

			if ( ! response.ok ) {
				throw new Error( response.status === 429 ? 'rate_limited' : 'server_error' );
			}

			connect = identity.connect = ( await response.json() ) as ConnectUrl;
		} catch ( error ) {
			popup.close();
			return { error: error instanceof Error ? error.message : 'server_error' };
		}
	}

	// Outside the signature, so it can be added here.
	popup.location.href = reauth ? `${ connect.url }&reauth=1` : connect.url;

	return new Promise< CheckpointResult >( resolve => {
		let timer = 0;

		const finish = ( result: CheckpointResult ) => {
			window.removeEventListener( 'message', onMessage );
			window.clearInterval( timer );
			resolve( result );
		};

		const onMessage = ( event: MessageEvent ) => {
			if ( event.origin !== identity.origin ) {
				return;
			}

			const data = event.data as Record< string, unknown > | null;

			if (
				! data ||
				typeof data !== 'object' ||
				data.type !== 'jetpack-comment-identity' ||
				data.challenge !== connect!.challenge
			) {
				return;
			}

			if ( typeof data.error === 'string' ) {
				finish( data.error === 'access_denied' ? { cancelled: true } : { error: data.error } );
			} else if ( typeof data.code === 'string' && data.code !== '' ) {
				reauth = false;

				finish( {
					code: data.code,
					name: typeof data.name === 'string' ? data.name : '',
					avatar: ( typeof data.avatar === 'string' && data.avatar ) || identity.defaultAvatar,
				} );
			}

			if ( ! popup.closed ) {
				popup.close();
			}
		};

		window.addEventListener( 'message', onMessage );

		// The popup may sit on a consent screen for a while; closing it is the only other way this ends.
		timer = window.setInterval( () => {
			if ( popup.closed ) {
				finish( { cancelled: true } );
			}
		}, 250 );
	} );
};

/**
 * Hand the passport back, so the next visit starts logged out.
 *
 * @return Whether the site confirmed it.
 */
export const logOut = async (): Promise< boolean > => {
	clearPassport();
	reauth = true;

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

/**
 * Whether an email belongs to a WordPress.com account, which the site would turn a guest comment away for.
 *
 * @param email - The address typed.
 * @return True only when the site says so; unreachable reads as no, and the site's own screen still stands.
 */
export const emailHasAccount = async ( email: string ): Promise< boolean > => {
	const url = new URL( JetpackComments.identity.emailUrl );
	url.searchParams.set( 'email', email );

	try {
		const response = await fetch( url.toString(), { credentials: 'omit' } );

		return response.ok && ( ( await response.json() ) as { account?: boolean } ).account === true;
	} catch {
		return false;
	}
};
