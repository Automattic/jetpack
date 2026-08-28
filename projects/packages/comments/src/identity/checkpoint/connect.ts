import { identityUser, isConnecting } from '../../shared/identity';
import { attribution, dropCode, holdCode } from './code';
import type { CheckpointSettings } from '../../shared/types';

/**
 * Sign-in, browser side. Open a popup, have the site sign a connect request,
 * point the popup at it, and take WordPress.com's postMessage result:
 * { type, code, challenge, name, avatar } or { type, error, challenge }. The
 * code is held for the comment to carry; the server exchanges it then.
 *
 * No fallback when the popup is blocked or COOP drops the opener: WordPress.com
 * stops on a "close this window" page, same as Verbum.
 */

type Checkpoint = Extract< CheckpointSettings, { enabled: true } >;

const MESSAGE_TYPE = 'jetpack-comment-identity';

const CLOSED_POLL_MS = 500;

/**
 * A popup left open and forgotten. Generous, since a login can include a
 * password reset.
 */
const ATTEMPT_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * The checkpoint settings, narrowed to the enabled shape.
 *
 * @return The enabled settings, or null when the checkpoint is off.
 */
function enabledCheckpoint(): Checkpoint | null {
	return JetpackComments.checkpoint.enabled ? JetpackComments.checkpoint : null;
}

/**
 * Call a checkpoint route. Throws the WP_Error code on failure.
 *
 * @param checkpoint - The enabled checkpoint settings.
 * @param url        - The route.
 * @param method     - The HTTP method.
 * @param body       - The JSON body, for POST.
 * @return The decoded response.
 */
async function call< T >(
	checkpoint: Checkpoint,
	url: string,
	method: 'POST' | 'DELETE',
	body?: object
): Promise< T > {
	const response = await fetch( url, {
		method,
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': checkpoint.nonce },
		body: body ? JSON.stringify( body ) : undefined,
	} );

	if ( ! response.ok ) {
		let slug = 'server_error';
		try {
			slug = ( await response.json() )?.code || slug;
		} catch {
			// Keep the default slug.
		}
		throw new Error( slug );
	}

	return response.json();
}

/**
 * Sign in with a provider. Holds the code and sets the page-global identity
 * on success, so callers only handle failure.
 *
 * @param provider - The provider slug.
 * @return Resolves once the code is held.
 */
export function connect( provider: string ): Promise< void > {
	const checkpoint = enabledCheckpoint();

	return new Promise( ( resolve, reject ) => {
		if ( ! checkpoint ) {
			reject( new Error( 'not_available' ) );
			return;
		}

		// Opened blank on the click itself; opening after the signing round trip
		// would be blocked.
		const popup = window.open( '', 'jetpack-comment-identity', 'width=780,height=700' );

		if ( ! popup ) {
			reject( new Error( 'popup_blocked' ) );
			return;
		}

		isConnecting.value = true;
		let settled = false;
		let challenge = '';

		const fail = ( slug: string ) => {
			isConnecting.value = false;
			reject( new Error( slug ) );
		};

		const timer = setTimeout( () => {
			if ( ! settled ) {
				cleanup();
				fail( 'timeout' );
			}
		}, ATTEMPT_TIMEOUT_MS );

		// Closed without a result is a cancel. Grace for a result posted just
		// before the close.
		const poll = setInterval( () => {
			if ( ! popup.closed ) {
				return;
			}
			clearInterval( poll );
			setTimeout( () => {
				if ( ! settled ) {
					cleanup();
					fail( 'cancelled' );
				}
			}, 1000 );
		}, CLOSED_POLL_MS );

		/**
		 * Stop listening and cancel the timers.
		 */
		function cleanup() {
			settled = true;
			clearTimeout( timer );
			clearInterval( poll );
			window.removeEventListener( 'message', onMessage );
		}

		/**
		 * Take a result. Origin, then type, then challenge, before the payload
		 * is read at all. The origin check is the security boundary.
		 *
		 * @param event - The message event.
		 */
		function onMessage( event: MessageEvent ) {
			if ( event.origin !== checkpoint.connectOrigin ) {
				return;
			}

			const data = event.data;
			if ( ! data || data.type !== MESSAGE_TYPE ) {
				return;
			}

			if ( '' === challenge || data.challenge !== challenge ) {
				return;
			}

			cleanup();

			if ( data.error ) {
				fail( String( data.error ) );
				return;
			}

			if ( typeof data.code !== 'string' || ! /^[0-9a-f]{64}$/.test( data.code ) ) {
				fail( 'invalid_request' );
				return;
			}

			const held = {
				code: data.code,
				provider,
				name: typeof data.name === 'string' ? data.name : '',
				avatar: typeof data.avatar === 'string' ? data.avatar : '',
			};

			holdCode( held );
			identityUser.value = attribution( held );
			isConnecting.value = false;
			resolve();
		}

		window.addEventListener( 'message', onMessage );

		call< { url: string; challenge: string } >( checkpoint, checkpoint.signUrl, 'POST', {
			provider,
			origin: window.location.origin,
		} ).then(
			signed => {
				if ( settled ) {
					return;
				}
				challenge = signed.challenge;
				popup.location.href = signed.url;
			},
			error => {
				if ( ! settled ) {
					cleanup();
					popup.close();
					fail( ( error as Error ).message );
				}
			}
		);
	} );
}

/**
 * Clear the Passport cookie, the held code, and the page-global identity.
 *
 * @return Whether it was cleared.
 */
export async function disconnect(): Promise< boolean > {
	const checkpoint = enabledCheckpoint();
	if ( ! checkpoint ) {
		return false;
	}

	try {
		await call( checkpoint, checkpoint.logoutUrl, 'DELETE' );
	} catch {
		return false;
	}

	dropCode();
	identityUser.value = null;

	return true;
}
