import { useState, useEffect, useContext } from 'preact/hooks';
import wpcomRequest from 'wpcom-proxy-request';
import { VerbumSignals } from '../state';
import { serviceData, setUserInfoCookie } from '../utils';
import type { UserInfo } from '../types';

export type SocialServiceName = Exclude< keyof typeof serviceData, 'mail' >;

export const addIframe = ( src: string ) => {
	const iframe = document.createElement( 'iframe' );
	iframe.height = '1';
	iframe.width = '1';
	iframe.style.display = 'none';
	iframe.src = src;
	document.body.appendChild( iframe );
	return new Promise< void >( resolve => {
		iframe.onload = () => {
			resolve();
			iframe.remove();
		};
	} );
};

const addWordPressDomain = window.location.hostname.endsWith( '.wordpress.com' )
	? ' Domain=.wordpress.com'
	: '';

/**
 * Ask the browser to grant this (cross-origin) frame access to its first-party cookies.
 *
 * On Atomic/Jetpack, Verbum runs inside a third-party iframe where the `.wordpress.com` auth
 * cookies can't be read or written, so a social login never sticks — and the comment POST back to
 * jetpack.wordpress.com arrives without a session, which WP.com downgrades to a guest comment.
 *
 * Best-effort: not awaited, so the login popup still opens on the same click. `window.open()` and
 * this both want the user gesture, and the popup is the one that breaks visibly without it. If
 * access is denied the visitor stays logged out and the top-level login link remains available.
 */
const requestCookieAccess = () => {
	try {
		document.requestStorageAccess?.().catch( () => {} );
	} catch {
		// Unsupported — the caller handles the still-logged-out case.
	}
};

/**
 * Hook to retrieve user info from server, handle social login, and logout functionality.
 *
 * @return {object} login, loginWindowRef, logout - login is a function to open the social login popup, loginWindowRef is a reference to the login popup window, and logout is a function to logout the user.
 */
export default function useSocialLogin() {
	const [ loginWindowRef, setLoginWindowRef ] = useState< Window >();
	const { userInfo } = useContext( VerbumSignals );

	useEffect( () => {
		wpcomRequest< UserInfo >( {
			path: '/verbum/auth',
			apiNamespace: 'wpcom/v2',
		} )
			.then( res => {
				userInfo.value = res;
			} )
			.catch( () => {
				// User may not be logged in.
			} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	if ( VerbumComments.isJetpackCommentsLoggedIn ) {
		userInfo.value = {
			avatar: VerbumComments.jetpackAvatar,
			name: VerbumComments.jetpackUsername,
			access_token: VerbumComments.jetpackSignature,
			uid: VerbumComments.jetpackUserId,
			service: 'jetpack',
		};

		return {
			login: null,
			loginWindowRef,
			logout: null,
		};
	}

	const logout = () => {
		const serviceName = userInfo.value?.service as SocialServiceName;
		const cookieName = serviceData[ serviceName ].cookieName;

		// Firefox: Logout from Verbum UI and clear cookies
		document.cookie = `${ cookieName }=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure=True;${ addWordPressDomain }`;
	};

	const login = ( service: SocialServiceName ) => {
		const { connectURL } = VerbumComments;

		// BroadcastChannel needs storage access, which a cookie-blocked iframe doesn't have — Firefox
		// throws SecurityError. It's a secondary channel: the popup also posts back via
		// window.postMessage, picked up by the listener below, so carry on without it.
		let broadcastChannel: BroadcastChannel | null = null;
		try {
			broadcastChannel = new BroadcastChannel( 'verbum_post_message' );
		} catch {
			// No channel available.
		}

		const loginWindow = window.open(
			`${ connectURL }&blog_id=${ VerbumComments.siteId }&post_id=${ VerbumComments.postId }&service=${ service }`,
			'VerbumCommentsLogin',
			`status=0,toolbar=0,location=1,menubar=0,directories=0,resizable=1,scrollbars=0${ serviceData[ service ].popup }`
		);

		// Requested once the popup is open, so it resolves while the visitor is still logging in.
		if ( VerbumComments.isJetpackComments ) {
			requestCookieAccess();
		}

		const waitForLogin = ( event: MessageEvent ) => {
			if (
				event.origin !== document.location.origin &&
				! event.origin.endsWith( '.wordpress.com' )
			) {
				return;
			}

			if ( event.data.service === service && event.data.access_token ) {
				userInfo.value = event.data;

				setUserInfoCookie( event.data );

				const highlanderNonce = document.getElementById(
					'highlander_comment_nonce'
				) as HTMLInputElement;
				if ( highlanderNonce ) {
					highlanderNonce.value = event.data.nonce;
				}
				window.removeEventListener( 'message', waitForLogin );

				// Ensure that the login window is closed after success
				if ( ! loginWindow?.closed ) {
					loginWindow?.close();
				}
			}
		};

		// Listen for login data
		window.addEventListener( 'message', waitForLogin );
		broadcastChannel?.addEventListener( 'message', waitForLogin );

		// Clean up loginWindow to reset activeService
		const loginClosed = setInterval( () => {
			if ( loginWindow?.closed ) {
				clearInterval( loginClosed );
				setLoginWindowRef( undefined );
				window.removeEventListener( 'message', waitForLogin );
				broadcastChannel?.removeEventListener( 'message', waitForLogin );
				broadcastChannel?.close();
			}
		}, 100 );

		setLoginWindowRef( loginWindow ?? undefined );
	};

	return { login, loginWindowRef, logout };
}
