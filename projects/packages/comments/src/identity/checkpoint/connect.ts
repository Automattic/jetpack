import { identityUser, isConnecting } from '../../shared/identity';
import { attribution, dropCode, holdCode } from './code';
import type { CheckpointSettings } from '../../shared/types';

/**
 * The comment identity checkpoint, browser side.
 *
 * A provider button opens a popup, then asks this site to sign a connect
 * request as the blog and points the popup at the signed URL. The popup opens
 * on the click itself, before the signing round trip, or the browser would
 * block it. When the provider is done, WordPress.com hands its result to this
 * window with window.opener.postMessage: { type, code, challenge, name, avatar }
 * on success, or { type, error, challenge } on failure. This window checks the
 * sender's origin, the message type and the challenge the site issued, then
 * holds the code and shows the attribution. The code goes to the server with
 * the comment, and the server exchanges it then. No email and no durable
 * identifier cross the browser, and no token reaches the page.
 *
 * There is no other path. When the popup is blocked, or COOP leaves it with no
 * opener, WordPress.com stops on a "you can close this window" page and nothing
 * is held, the same as the existing Verbum connect flow.
 */

type Checkpoint = Extract< CheckpointSettings, { enabled: true } >;

/**
 * The type WordPress.com stamps on its result message. A filter, not a
 * boundary: the origin check is the boundary.
 */
const MESSAGE_TYPE = 'jetpack-comment-identity';

/**
 * How often to check whether the popup has been closed on us.
 */
const CLOSED_POLL_MS = 500;

/**
 * A safety net for a popup left open and forgotten; a provider login with a
 * password reset in it can take a while, so this is generous.
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
 * Call one of the site's checkpoint routes. Failures surface as the thrown
 * message, the WP_Error code where there is one.
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
 * Sign in with a provider. On success the code is held and the page-global
 * identity set here, so callers only handle failure.
 *
 * @param provider - The provider slug, one of the offered set.
 * @return Resolves once the code is held.
 */
export function connect( provider: string ): Promise< void > {
	const checkpoint = enabledCheckpoint();

	return new Promise( ( resolve, reject ) => {
		if ( ! checkpoint ) {
			reject( new Error( 'not_available' ) );
			return;
		}

		// Blank first, on the click itself, then pointed at the signed URL once
		// the site returns it. Opening after the round trip would be blocked.
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

		// The popup closing without a result is a cancel. Grace so a result posted
		// just before the close still wins.
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
		 * Stop listening and cancel the timers for this attempt.
		 */
		function cleanup() {
			settled = true;
			clearTimeout( timer );
			clearInterval( poll );
			window.removeEventListener( 'message', onMessage );
		}

		/**
		 * Take a result from the popup. Origin first, then type, then challenge;
		 * nothing in the payload is read until all three hold.
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

		// The site issues the challenge and signs it into the URL; the origin is
		// this window's, verbatim, which WordPress.com posts the result back to.
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
 * Clear the site's Passport cookie, drop any held code, and drop the
 * page-global identity.
 *
 * @return Whether the identity was cleared.
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
