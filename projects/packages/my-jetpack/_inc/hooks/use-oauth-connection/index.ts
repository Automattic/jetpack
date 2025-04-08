import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
	QUERY_GET_OAUTH_AUTHORIZE_URL_KEY,
	REST_API_GET_OAUTH_AUTHORIZE_URL,
} from '../../data/constants';
import useSimpleQuery from '../../data/use-simple-query';
import sideloadTracks from '../../utils/side-load-tracks';
import useAnalytics from '../use-analytics';
import useMyJetpackConnection from '../use-my-jetpack-connection';

export type SocialService = 'google' | 'apple' | 'github' | 'jetpack';
export type SubmitType = 'email' | SocialService;
export type OauthErrorType = 'email-validation' | 'site-connection' | 'authorization-url';

export type UseOauthConnectionReturn = {
	userEmail: string;
	setUserEmail: ( email: string ) => void;
	validateEmail: ( email: string ) => boolean;
	handleSubmitEmail: ( email?: string ) => void;
	handleSocialLogin: ( service: SocialService ) => void;
	isLoading: boolean;
	errorType: OauthErrorType;
	authorizeUrl: string | null;
	resetState: () => void;
};

const useOauthConnection = (): UseOauthConnectionReturn => {
	const [ userEmail, setUserEmail ] = useState( '' );
	const [ shouldFetchUrl, setShouldFetchUrl ] = useState( false );
	const [ isRedirecting, setIsRedirecting ] = useState( false );
	const [ socialService, setSocialService ] = useState< SocialService | null >( null );
	const [ errorType, setErrorType ] = useState< OauthErrorType | null >( null );

	const { recordEvent } = useAnalytics();

	const validateEmail = useCallback( ( email: string ) => {
		const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		return emailRegex.test( email );
	}, [] );

	const { handleRegisterSite, siteIsRegistered, siteIsRegistering } = useMyJetpackConnection( {
		skipUserConnection: true,
		redirectUri: '',
	} );

	const {
		data,
		isError: isErrorAuthorizeUrl,
		isLoading: isLoadingAuthorizeUrl,
	} = useSimpleQuery< { authorizeUrl: string } >( {
		name: `${ QUERY_GET_OAUTH_AUTHORIZE_URL_KEY }_${ userEmail ? 'link' : socialService ?? '' }`,
		query: {
			path: `${ REST_API_GET_OAUTH_AUTHORIZE_URL }/${ userEmail ? 'link' : socialService ?? '' }${
				userEmail
					? `?email_address=${ encodeURIComponent( userEmail ) }&from=jetpack-onboarding`
					: '?from=jetpack-onboarding'
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

	const resetState = useCallback( () => {
		setShouldFetchUrl( false );
		setSocialService( null );
		setErrorType( null );
		setIsRedirecting( false );
	}, [] );

	useEffect( () => {
		if ( isErrorAuthorizeUrl ) {
			recordEvent( 'jetpack_my_jetpack_onboarding_error', {
				error_type: 'authorization-url',
				service: socialService ?? 'email',
			} );
			setErrorType( 'authorization-url' );
		} else {
			setErrorType( null );
		}
	}, [ isErrorAuthorizeUrl, recordEvent, socialService ] );

	const handleSetUserEmail = useCallback(
		( email: string ) => {
			if ( shouldFetchUrl || errorType ) {
				resetState();
			}

			setUserEmail( email );
		},
		[ resetState, shouldFetchUrl, errorType ]
	);

	const handleConnectionSetup = useCallback(
		async ( service: SocialService | null = null ) => {
			try {
				await handleRegisterSite();
				await sideloadTracks();
				recordEvent( 'jetpack_my_jetpack_onboarding_click', {
					service: service ?? 'email',
					// Overriding this value as we're waiting for the site to be registered to run this event.
					is_site_connected: true,
				} );
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.error( error );
				setErrorType( 'site-connection' );
				return;
			}

			setSocialService( service );
			setShouldFetchUrl( true );
		},
		[ handleRegisterSite, recordEvent ]
	);

	const handleSubmitEmail = useCallback(
		( email?: string ) => {
			const emailToUse = email || userEmail;

			if ( ! validateEmail( emailToUse ) ) {
				setErrorType( 'email-validation' );
				return;
			}

			setErrorType( null );

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

	const isLoading = useMemo( () => {
		if ( errorType ) {
			return false;
		}

		return isLoadingAuthorizeUrl || isRedirecting || siteIsRegistering;
	}, [ isLoadingAuthorizeUrl, isRedirecting, siteIsRegistering, errorType ] );

	return {
		userEmail,
		setUserEmail: handleSetUserEmail,
		validateEmail,
		handleSubmitEmail,
		handleSocialLogin,
		isLoading,
		errorType,
		authorizeUrl: data?.authorizeUrl || null,
		resetState,
	};
};

export default useOauthConnection;
