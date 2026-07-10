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
 * cookies can't be read/written, so the social login state can't be established. The Storage
 * Access API restores first-party cookie access, but only from a user gesture — so this must be
 * called synchronously off the login click. If it's denied or unsupported we fall through: the
 * popup + postMessage flow still authenticates for the current session, only persistence is lost.
 */
const ensureCookieAccess = async () => {
	try {
		if (
			typeof document.hasStorageAccess === 'function' &&
			typeof document.requestStorageAccess === 'function' &&
			! ( await document.hasStorageAccess() )
		) {
			await document.requestStorageAccess();
		}
	} catch {
		// Access denied or unsupported — social login still works in-session via postMessage.
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

	const login = async ( service: SocialServiceName ) => {
		const { connectURL } = VerbumComments;

		// Restore first-party cookie access before logging in, so the login state can persist
		// inside the iframe. Runs off the login-button gesture, which the Storage Access API requires.
		if ( VerbumComments.isJetpackComments ) {
			await ensureCookieAccess();
		}

		const broadcastChannel = new BroadcastChannel( 'verbum_post_message' );

		const loginWindow = window.open(
			`${ connectURL }&blog_id=${ VerbumComments.siteId }&post_id=${ VerbumComments.postId }&service=${ service }`,
			'VerbumCommentsLogin',
			`status=0,toolbar=0,location=1,menubar=0,directories=0,resizable=1,scrollbars=0${ serviceData[ service ].popup }`
		);

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
		broadcastChannel.addEventListener( 'message', waitForLogin );

		// Clean up loginWindow to reset activeService
		const loginClosed = setInterval( () => {
			if ( loginWindow?.closed ) {
				clearInterval( loginClosed );
				setLoginWindowRef( undefined );
				window.removeEventListener( 'message', waitForLogin );
				broadcastChannel.removeEventListener( 'message', waitForLogin );
				broadcastChannel.close();
			}
		}, 100 );

		setLoginWindowRef( loginWindow ?? undefined );
	};

	return { login, loginWindowRef, logout };
}
