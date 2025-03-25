import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from 'react';
import {
	QUERY_GET_OAUTH_AUTHORIZE_URL_KEY,
	REST_API_GET_OAUTH_AUTHORIZE_URL,
} from '../../data/constants';
import useSimpleQuery from '../../data/use-simple-query';
import useMyJetpackConnection from '../use-my-jetpack-connection';

export type SocialService = 'google' | 'apple' | 'github' | 'jetpack';

type UseOauthConnectionReturn = {
	userEmail: string;
	setUserEmail: ( email: string ) => void;
	isValidEmail: boolean;
	validateEmail: ( email: string ) => boolean;
	handleSubmitEmail: ( email?: string ) => void;
	handleSocialLogin: ( service: SocialService ) => void;
	isLoadingAuthorizeUrl: boolean;
	isError: boolean;
	authorizeUrl: string | null;
	isRedirecting: boolean;
};

const useOauthConnection = (): UseOauthConnectionReturn => {
	const [ userEmail, setUserEmail ] = useState( '' );
	const [ isValidEmail, setIsValidEmail ] = useState( true );
	const [ shouldFetchUrl, setShouldFetchUrl ] = useState( false );
	const [ isRedirecting, setIsRedirecting ] = useState( false );
	const [ socialService, setSocialService ] = useState< SocialService | null >( null );

	const validateEmail = useCallback( ( email: string ) => {
		const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		return emailRegex.test( email );
	}, [] );

	const { handleRegisterSite, siteIsRegistered } = useMyJetpackConnection( {
		skipUserConnection: true,
		redirectUri: '',
	} );

	const {
		data,
		isError,
		isLoading: isLoadingAuthorizeUrl,
	} = useSimpleQuery< { authorizeUrl: string } >( {
		name: `${ QUERY_GET_OAUTH_AUTHORIZE_URL_KEY }_${ userEmail ? 'link' : socialService ?? '' }`,
		query: {
			path: `${ REST_API_GET_OAUTH_AUTHORIZE_URL }/${ userEmail ? 'link' : socialService ?? '' }${
				userEmail ? `?email_address=${ encodeURIComponent( userEmail ) }` : ''
			}`,
		},
		options: {
			enabled: shouldFetchUrl && ( !! socialService || validateEmail( userEmail ) ),
		},
		errorMessage: __(
			'Something went wrong while requesting the authentication URL. Please try again. If the issue persists, contact us!',
			'jetpack-my-jetpack'
		),
	} );

	const handleConnectionSetup = useCallback(
		async ( service: SocialService | null = null ) => {
			try {
				await handleRegisterSite();
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.error( error );
				// Fail silently
			}

			setSocialService( service );
			setShouldFetchUrl( true );
		},
		[ handleRegisterSite ]
	);

	const handleSubmitEmail = useCallback(
		( email?: string ) => {
			const emailToUse = email || userEmail;

			if ( ! validateEmail( emailToUse ) ) {
				setIsValidEmail( false );
				return;
			}

			setIsValidEmail( true );

			if ( email ) {
				setUserEmail( email );
			}

			handleConnectionSetup();
		},
		[ userEmail, validateEmail, handleConnectionSetup ]
	);

	const handleSocialLogin = useCallback(
		( service: SocialService ) => {
			handleConnectionSetup( service );
		},
		[ handleConnectionSetup ]
	);

	// Handle redirection when we get the authorize URL
	useEffect( () => {
		if ( data?.authorizeUrl && siteIsRegistered && ! isRedirecting ) {
			setIsRedirecting( true );
			window.location.href = data.authorizeUrl;
		}
	}, [ data, siteIsRegistered, isRedirecting ] );

	return {
		userEmail,
		setUserEmail,
		isValidEmail,
		validateEmail,
		handleSubmitEmail,
		handleSocialLogin,
		isLoadingAuthorizeUrl,
		isError,
		authorizeUrl: data?.authorizeUrl || null,
		isRedirecting,
	};
};

export default useOauthConnection;
