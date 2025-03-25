import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ChangeEvent, FormEvent, useCallback, useState, useEffect } from 'react';
import {
	QUERY_GET_MAGIC_LINK_AUTHORIZE_URL_KEY,
	REST_API_GET_MAGIC_LINK_AUTHORIZE_URL,
} from '../../../data/constants';
import useSimpleQuery from '../../../data/use-simple-query';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import styles from './styles.module.scss';
interface EmailInputProps {
	onSubmit?: () => void;
	isDisabled: boolean;
}

const EmailInput = ( { isDisabled, onSubmit }: EmailInputProps ) => {
	const [ userEmail, setUserEmail ] = useState( '' );
	const [ isValidEmail, setIsValidEmail ] = useState( true );
	const [ shouldFetchUrl, setShouldFetchUrl ] = useState( false );

	const validateEmail = ( email: string ) => {
		const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		return emailRegex.test( email );
	};

	const {
		data,
		isError,
		isLoading: isLoadingAuthorizeUrl,
	} = useSimpleQuery< { authorizeUrl: string } >( {
		name: QUERY_GET_MAGIC_LINK_AUTHORIZE_URL_KEY,
		query: {
			path: `${ REST_API_GET_MAGIC_LINK_AUTHORIZE_URL }?email_address=${ encodeURIComponent(
				userEmail
			) }`,
		},
		options: { enabled: shouldFetchUrl && validateEmail( userEmail ) },
		errorMessage: __(
			'Something went wrong while sending the login link. Please try again. If the issue persists, contact support.',
			'jetpack-my-jetpack'
		),
	} );

	const { handleRegisterSite, siteIsRegistering, siteIsRegistered } = useMyJetpackConnection( {
		skipUserConnection: true,
	} );

	const handleOnInput = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			const email = event.target.value;
			setUserEmail( email );
			setIsValidEmail( true );
			setShouldFetchUrl( false );
		},
		[ setUserEmail ]
	);

	const handleOnSubmit = useCallback(
		async ( event: FormEvent< HTMLFormElement > ) => {
			event.preventDefault();

			onSubmit?.();

			if ( ! validateEmail( userEmail ) ) {
				setIsValidEmail( false );
				return;
			}

			try {
				await handleRegisterSite();
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.error( error );
				// Fail silently
			}

			setShouldFetchUrl( true );
		},
		[ userEmail, onSubmit, handleRegisterSite ]
	);

	const getErrorMessage = () => {
		return __( 'An error occurred. Please try again.', 'jetpack-my-jetpack' );
	};

	// Handle redirection when we get the authorize URL
	useEffect( () => {
		if ( data?.authorizeUrl && siteIsRegistered ) {
			window.location.href = data.authorizeUrl;
		}
	}, [ data, siteIsRegistered ] );

	const isLoading = isLoadingAuthorizeUrl || siteIsRegistering;

	return (
		<form onSubmit={ handleOnSubmit } className={ styles[ 'email-input-container' ] }>
			<input
				className={ `${ styles[ 'email-input' ] } ${
					! isValidEmail ? styles[ 'email-input-error' ] : ''
				}` }
				type="email"
				autoComplete="email"
				spellCheck={ false }
				autoCorrect="off"
				name="user-email"
				placeholder={ __( 'Enter your email address', 'jetpack-my-jetpack' ) }
				value={ userEmail }
				disabled={ isDisabled }
				onInput={ handleOnInput }
			/>
			{ ! isValidEmail ||
				( isError && (
					<div className={ styles[ 'email-error-message' ] }>{ getErrorMessage() }</div>
				) ) }
			<button
				className={ styles[ 'submit-button' ] }
				disabled={ isDisabled || ! userEmail || isLoading }
				type="submit"
			>
				{ isLoading ? (
					<Spinner />
				) : (
					<span>{ __( 'Start with email', 'jetpack-my-jetpack' ) }</span>
				) }
			</button>
		</form>
	);
};

export default EmailInput;
