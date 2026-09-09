import { hasLoginFailed, identityUser, isConnecting } from '../../shared/identity';
import { attribution, holdCode } from './code';
import type { CheckpointSettings, SignedRequest } from '../../shared/types';

/**
 * Sign-in, browser side. Open a popup on the click, point it at a signed
 * connect request, and take WordPress.com's postMessage result:
 * { type, challenge, code, name, avatar } or { type, challenge, error }. The
 * code is held for the comment to carry; the server exchanges it then.
 *
 * The first attempt uses the request minted with the page; every later one
 * re-mints, since a challenge is good for one attempt and a page can sit
 * open past the signature's two hours.
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
 * A signature this close to lapsing is re-minted rather than sent.
 */
const EXPIRY_MARGIN_MS = 60 * 1000;

/**
 * Outcomes the reader chose, so nothing to apologise for.
 */
const SILENT = [ 'cancelled', 'access_denied' ];

/**
 * The request minted with the page, until it is used or lapses.
 */
let minted: SignedRequest | null = JetpackComments.checkpoint.enabled
	? JetpackComments.checkpoint.connect
	: null;

/**
 * The checkpoint settings, narrowed to the enabled shape.
 *
 * @return The enabled settings, or null when the checkpoint is off.
 */
function enabledCheckpoint(): Checkpoint | null {
	return JetpackComments.checkpoint.enabled ? JetpackComments.checkpoint : null;
}

/**
 * Mint a fresh signed request. Throws the WP_Error code on failure.
 *
 * @param checkpoint - The enabled checkpoint settings.
 * @return The signed request.
 */
async function mint( checkpoint: Checkpoint ): Promise< SignedRequest > {
	const response = await fetch( checkpoint.signUrl, {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': checkpoint.nonce },
		body: JSON.stringify( { origin: window.location.origin } ),
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
 * The signed request for this attempt: the page's own while it is fresh and
 * was signed for this origin, otherwise a new one. Either way it is spent.
 *
 * @param checkpoint - The enabled checkpoint settings.
 * @return The signed request.
 */
async function take( checkpoint: Checkpoint ): Promise< SignedRequest > {
	const ready = minted;
	minted = null;

	if (
		ready &&
		ready.origin === window.location.origin &&
		ready.expires * 1000 - Date.now() > EXPIRY_MARGIN_MS
	) {
		return ready;
	}

	return mint( checkpoint );
}

type OpenOptions = {
	/** Ask WordPress.com to offer a choice even when it already knows the reader. */
	prompt?: boolean;
};

/**
 * Sign in through the checkpoint. Holds the code and sets the page-global
 * identity on success; on failure shows the error line, unless the reader
 * just closed the popup. Callers only need to know which way it went.
 *
 * @param options        - Options.
 * @param options.prompt - Whether to force the account choice.
 * @return Resolves once the code is held, rejects with the error slug.
 */
export function openCheckpoint( { prompt = false }: OpenOptions = {} ): Promise< void > {
	const checkpoint = enabledCheckpoint();
	hasLoginFailed.value = false;

	return new Promise( ( resolve, reject ) => {
		if ( ! checkpoint ) {
			reject( new Error( 'not_available' ) );
			return;
		}

		// Opened blank on the click itself; opening after the signing round trip
		// would be blocked.
		const popup = window.open( '', 'jetpack-comment-identity', 'width=420,height=560' );

		if ( ! popup ) {
			hasLoginFailed.value = true;
			reject( new Error( 'popup_blocked' ) );
			return;
		}

		isConnecting.value = true;
		let settled = false;
		let challenge = '';

		const fail = ( slug: string ) => {
			isConnecting.value = false;
			hasLoginFailed.value = ! SILENT.includes( slug );
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
				name: typeof data.name === 'string' ? data.name : '',
				avatar: typeof data.avatar === 'string' ? data.avatar : '',
			};

			holdCode( held );
			identityUser.value = attribution( held );
			isConnecting.value = false;
			resolve();
		}

		window.addEventListener( 'message', onMessage );

		take( checkpoint ).then(
			signed => {
				if ( settled ) {
					return;
				}
				challenge = signed.challenge;
				popup.location.href = prompt ? signed.url + '&prompt=1' : signed.url;
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
