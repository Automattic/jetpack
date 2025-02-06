import { useState, useEffect, useContext } from 'preact/hooks';
import wpcomRequest from 'wpcom-proxy-request';
import { VerbumSignals } from '../state';
import { UserInfo } from '../types';
import { serviceData, setUserInfoCookie } from '../utils';

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
		const serviceName = userInfo.value?.service;
		const cookieName = serviceData[ serviceName ].cookieName;

		// Firefox: Logout from Verbum UI and clear cookies
		document.cookie = `${ cookieName }=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure=True;${ addWordPressDomain }`;
	};

	const login = async ( service: string ) => {
		const { connectURL } = VerbumComments;
		const broadcastChannel = new BroadcastChannel( 'verbum_post_message' );

		const loginWindow = window.open(
			`${ connectURL }&blog_id=${ VerbumComments.siteId }&post_id=${ VerbumComments.postId }&service=${ service }`,
			'VerbumCommentsLogin',
			`status=0,toolbar=0,location=1,menubar=0,directories=0,resizable=1,scrollbars=0${ serviceData[ service ].popup }`
		);

		const waitForLogin = event => {
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
					loginWindow.close();
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

		setLoginWindowRef( loginWindow );
	};

	return { login, loginWindowRef, logout };
}
