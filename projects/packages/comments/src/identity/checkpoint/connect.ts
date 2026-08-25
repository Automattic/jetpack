import { identityUser, isConnecting } from '../../shared/identity';
import type { CurrentUser, CheckpointSettings } from '../../shared/types';

/**
 * The comment identity checkpoint, browser side.
 *
 * A provider button opens a popup to WordPress.com's connect endpoint, which
 * sends it back to a same-origin landing page with a one-time code in the URL
 * fragment. The landing broadcasts { state, code } back here; this window, which
 * issued the state, checks it and trades the code for the identity server to
 * server. The code and the identity never travel together, and no access token
 * reaches the page. When the popup is blocked, a top-level redirect takes over
 * and the landing redeems and returns the reader itself.
 */

export type RedeemedIdentity = {
	provider: string;
	name: string;
	avatar: string;
};

type Checkpoint = Extract< CheckpointSettings, { enabled: true } >;

/**
 * The checkpoint settings, narrowed to the enabled shape.
 *
 * @return The enabled settings, or null when the checkpoint is off.
 */
function enabledCheckpoint(): Checkpoint | null {
	return JetpackComments.checkpoint.enabled ? JetpackComments.checkpoint : null;
}

/**
 * A fresh state value, comfortably over the connect endpoint's 32-char floor.
 *
 * @return A 48-character hex string.
 */
function randomState(): string {
	const bytes = new Uint8Array( 24 );
	crypto.getRandomValues( bytes );
	return Array.from( bytes, byte => byte.toString( 16 ).padStart( 2, '0' ) ).join( '' );
}

/**
 * Build the connect URL for one attempt.
 *
 * @param checkpoint  - The enabled checkpoint settings.
 * @param provider    - The provider slug.
 * @param state       - The state this window issued.
 * @param redirectUri - The landing URL to return to.
 * @return The absolute connect URL.
 */
function connectUrl(
	checkpoint: Checkpoint,
	provider: string,
	state: string,
	redirectUri: string
): string {
	const url = new URL( checkpoint.connectUrl );
	url.searchParams.set( 'blog_id', String( checkpoint.blogId ) );
	url.searchParams.set( 'provider', provider );
	url.searchParams.set( 'state', state );
	url.searchParams.set( 'redirect_uri', redirectUri );
	return url.toString();
}

/**
 * The landing URL for a given close mode.
 *
 * @param checkpoint - The enabled checkpoint settings.
 * @param mode       - Either 'popup' or 'redirect'.
 * @return The landing URL with its mode set.
 */
function landingUrl( checkpoint: Checkpoint, mode: string ): string {
	const url = new URL( checkpoint.landingUrl );
	url.searchParams.set( 'mode', mode );
	return url.toString();
}

/**
 * Trade a one-time code for the identity, server to server. Failures surface as
 * the thrown message; nothing retries, which blog_mismatch and code_used need.
 *
 * @param checkpoint - The enabled checkpoint settings.
 * @param code       - The one-time code.
 * @return The identity the form renders.
 */
async function redeem( checkpoint: Checkpoint, code: string ): Promise< RedeemedIdentity > {
	const response = await fetch( checkpoint.redeemUrl, {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': checkpoint.nonce },
		body: JSON.stringify( { code } ),
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
 * The page-global attribution: the avatar and a "Commenting as …" label, never
 * the email or the sub, which stay in the cookie.
 *
 * @param checkpoint - The enabled checkpoint settings.
 * @param result     - The redeemed identity.
 * @return The attribution to show.
 */
function attribution( checkpoint: Checkpoint, result: RedeemedIdentity ): CurrentUser {
	const providerLabel = checkpoint.providers.find( p => p.id === result.provider )?.label;

	return {
		avatarUrl: result.avatar,
		commentingAs: JetpackComments.strings.commentingAs.replace(
			'%s',
			result.name || providerLabel || result.provider
		),
		isPassport: true,
	};
}

/**
 * Sign in with a provider. On success the page-global identity is set here, so
 * callers only handle failure. Never resolves when the popup was blocked and a
 * top-level redirect took over.
 *
 * @param provider - The provider slug, one of the offered set.
 * @return Resolves once the identity is set.
 */
export function connect( provider: string ): Promise< void > {
	const checkpoint = enabledCheckpoint();

	return new Promise( ( resolve, reject ) => {
		if ( ! checkpoint ) {
			reject( new Error( 'not_available' ) );
			return;
		}

		const state = randomState();
		const popup = window.open(
			connectUrl( checkpoint, provider, state, landingUrl( checkpoint, 'popup' ) ),
			'jetpack-comment-identity',
			'width=780,height=700'
		);

		if ( ! popup || popup.closed || typeof popup.closed === 'undefined' ) {
			// Popup blocked: a top-level redirect finishes at the landing, which reads
			// these back to check state and return here.
			try {
				sessionStorage.setItem( 'jetpack-comment-identity-state', state );
				sessionStorage.setItem( 'jetpack-comment-identity-return', window.location.href );
			} catch {
				// Without storage the landing cannot check state, so it returns home.
			}
			window.location.assign(
				connectUrl( checkpoint, provider, state, landingUrl( checkpoint, 'redirect' ) )
			);
			return;
		}

		isConnecting.value = true;

		const channel = new BroadcastChannel( checkpoint.channel );
		let settled = false;

		const fail = ( slug: string ) => {
			isConnecting.value = false;
			reject( new Error( slug ) );
		};

		const onWindowRefocused = () => {
			// Grace so a result landing as the popup closes still wins.
			setTimeout( () => {
				if ( ! settled ) {
					cleanup();
					fail( 'cancelled' );
				}
			}, 1000 );
		};

		const onPopupFocused = () => {
			window.addEventListener( 'focus', onWindowRefocused, { once: true } );
		};

		// Five minutes, matching WordPress.com's code-record lifetime.
		const timer = setTimeout(
			() => {
				if ( ! settled ) {
					cleanup();
					fail( 'timeout' );
				}
			},
			5 * 60 * 1000
		);

		/**
		 * Stop listening and cancel the timers for this attempt.
		 */
		function cleanup() {
			settled = true;
			clearTimeout( timer );
			channel.close();
			window.removeEventListener( 'blur', onPopupFocused );
			window.removeEventListener( 'focus', onWindowRefocused );
		}

		channel.addEventListener( 'message', event => {
			const data = event.data;
			if ( ! data || data.type !== checkpoint.channel || data.state !== state ) {
				return;
			}

			cleanup();

			if ( data.error ) {
				fail( data.error );
			} else if ( ! data.code ) {
				fail( 'invalid_request' );
			} else {
				redeem( checkpoint, data.code ).then(
					result => {
						identityUser.value = attribution( checkpoint, result );
						isConnecting.value = false;
						resolve();
					},
					error => fail( ( error as Error ).message )
				);
			}
		} );

		window.addEventListener( 'blur', onPopupFocused, { once: true } );
	} );
}

/**
 * Clear the site's cookie and drop the page-global identity.
 *
 * @return Whether the cookie was cleared.
 */
export async function disconnect(): Promise< boolean > {
	const checkpoint = enabledCheckpoint();
	if ( ! checkpoint ) {
		return false;
	}

	try {
		const response = await fetch( checkpoint.logoutUrl, {
			method: 'DELETE',
			credentials: 'same-origin',
			headers: { 'X-WP-Nonce': checkpoint.nonce },
		} );

		if ( response.ok ) {
			identityUser.value = null;
		}

		return response.ok;
	} catch {
		return false;
	}
}
