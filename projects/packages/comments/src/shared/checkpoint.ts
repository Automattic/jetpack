/**
 * The browser side of the checkpoint: the popup, the passport, and what the site answers about an email.
 */

import type { CheckpointResult, ConnectUrl, Passport } from './types';

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
	const width = 475;
	const height = 800;
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

	popup.location.href = connect.url;

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
	const { displayCookie, cookiePath, cookieDomain, logoutUrl, logoutAction } =
		JetpackComments.identity;

	// Path and domain have to match what the server set, or this names a different cookie.
	document.cookie = `${ displayCookie }=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${
		cookiePath || '/'
	}${ cookieDomain ? `; domain=${ cookieDomain }` : '' }; SameSite=Lax`;

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
 * @return Whether it does, or null when the site could not answer; the site's own screen still stands.
 */
export const emailHasAccount = async ( email: string ): Promise< boolean | null > => {
	if ( ! JetpackComments.identity.emailUrl ) {
		return false;
	}

	const url = new URL( JetpackComments.identity.emailUrl );
	url.searchParams.set( 'email', email );

	try {
		const response = await fetch( url.toString(), { credentials: 'omit' } );

		if ( ! response.ok ) {
			return null;
		}

		return ( ( await response.json() ) as { account?: boolean } ).account === true;
	} catch {
		return null;
	}
};

/**
 * Who the display cookie says is back, if anyone. The HTML is cached and shared,
 * so this is the only place a returning commenter's identity can come from.
 *
 * @return The passport, or null.
 */
export const readPassport = (): Passport | null => {
	const { displayCookie: name, blogId, defaultAvatar } = JetpackComments.identity;

	if ( ! name ) {
		return null;
	}

	const raw = document.cookie
		.split( '; ' )
		.find( row => row.startsWith( `${ name }=` ) )
		?.slice( name.length + 1 );

	if ( ! raw ) {
		return null;
	}

	try {
		const data = JSON.parse( decodeURIComponent( raw ) ) as Record< string, unknown >;

		// A network shares one cookie domain, so another site's sign-in can land here.
		if ( ! data || data.blog_id !== blogId || typeof data.name !== 'string' ) {
			return null;
		}

		return {
			name: data.name,
			avatar: ( typeof data.avatar === 'string' && data.avatar ) || defaultAvatar,
		};
	} catch {
		return null;
	}
};
