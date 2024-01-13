import { useState, useEffect } from 'preact/hooks';
import { serviceData, setUserInfoCookie } from '../utils';
import { UserInfo } from '../types';
import wpcomRequest from 'wpcom-proxy-request';
import { userInfo } from '../state';

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

export default function useSocialLogin() {
	const [ loginWindowRef, setLoginWindowRef ] = useState< Window >();

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

	useEffect( () => {
		wpcomRequest< UserInfo >( {
			path: '/verbum/auth',
			apiNamespace: 'wpcom/v2',
		} ).then( res => {
			userInfo.value = res;
		} );
	}, [] );

	const login = async ( service: string ) => {
		const { connectURL } = VerbumComments;

		const loginWindow = window.open(
			`${ connectURL }&service=${ service }`,
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
			}
		};

		// Listen for login data
		window.addEventListener( 'message', waitForLogin );

		// Clean up loginWindow to reset activeService
		const loginClosed = setInterval( () => {
			if ( loginWindow?.closed ) {
				clearInterval( loginClosed );
				setLoginWindowRef( undefined );
				window.removeEventListener( 'message', waitForLogin );
			}
		}, 100 );

		setLoginWindowRef( loginWindow );
	};

	return { login, loginWindowRef, logout };
}
