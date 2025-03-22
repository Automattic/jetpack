import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ChangeEvent, FormEvent, useCallback, useState, useEffect } from 'react';
import {
	QUERY_GET_MAGIC_LINK_AUTHORIZE_URL_KEY,
	REST_API_GET_MAGIC_LINK_AUTHORIZE_URL,
} from '../../../data/constants';
import useSimpleQuery from '../../../data/use-simple-query';
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
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test( email );
	};

	const { data, isError, isLoading } = useSimpleQuery< { authorizeUrl: string } >( {
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

			if ( ! validateEmail( userEmail ) ) {
				setIsValidEmail( false );
				return;
			}

			setShouldFetchUrl( true );
			onSubmit?.();
		},
		[ userEmail, onSubmit ]
	);

	const getErrorMessage = () => {
		if ( ! isValidEmail ) {
			return __( 'Please enter a valid email address', 'jetpack-my-jetpack' );
		}

		return __( 'An error occurred. Please try again.', 'jetpack-my-jetpack' );
	};

	// Handle redirection when we get the authorize URL
	useEffect( () => {
		if ( data?.authorizeUrl ) {
			window.location.href = data.authorizeUrl;
		}
	}, [ data ] );

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
