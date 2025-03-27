import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from 'react';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import useOauthConnection from '../../../hooks/use-oauth-connection';
import styles from './styles.module.scss';
import type { ChangeEvent, FC, FormEvent } from 'react';

interface EmailInputProps {
	onSubmit?: () => void;
	isDisabled: boolean;
}

const EmailInput: FC< EmailInputProps > = ( { isDisabled, onSubmit } ) => {
	const [ isClicked, setIsClicked ] = useState( false );
	const {
		userEmail,
		setUserEmail,
		isValidEmail,
		handleSubmitEmail,
		isLoadingAuthorizeUrl,
		isError,
		isRedirecting,
	} = useOauthConnection();

	const { siteIsRegistering } = useMyJetpackConnection();

	const handleOnInput = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			setUserEmail( event.target.value );
		},
		[ setUserEmail ]
	);

	const handleOnSubmit = useCallback(
		async ( event: FormEvent< HTMLFormElement > ) => {
			setIsClicked( true );
			event.preventDefault();
			onSubmit?.();
			handleSubmitEmail();
		},
		[ onSubmit, handleSubmitEmail ]
	);

	const getErrorMessage = () => {
		if ( ! isValidEmail ) {
			// Third argument is to avoid a compilation issue with ternary operator
			return __( 'Please enter a valid email address', 'jetpack-my-jetpack', 0 );
		}

		return __( 'An error occurred. Please try again.', 'jetpack-my-jetpack' );
	};

	const isLoading = isLoadingAuthorizeUrl || isRedirecting || ( isClicked && siteIsRegistering );

	const getAriaLabel = useMemo( () => {
		if ( isLoading ) {
			return __( 'Connecting…', 'jetpack-my-jetpack', 0 );
		}

		return __( 'Start with email', 'jetpack-my-jetpack' );
	}, [ isLoading ] );

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
				aria-label={ __( 'Email address', 'jetpack-my-jetpack' ) }
				aria-invalid={ ! isValidEmail || isError }
				aria-describedby={ ! isValidEmail || isError ? 'email-error-message' : undefined }
				value={ userEmail }
				disabled={ isDisabled }
				onInput={ handleOnInput }
			/>
			{ ( ! isValidEmail || isError ) && (
				<div
					id="email-error-message"
					role="alert"
					aria-live="polite"
					className={ styles[ 'email-error-message' ] }
				>
					{ getErrorMessage() }
				</div>
			) }
			<button
				className={ styles[ 'submit-button' ] }
				disabled={ isDisabled || ! userEmail || isLoading }
				aria-busy={ isLoading }
				aria-label={ getAriaLabel }
				type="submit"
			>
				{ isLoading ? (
					<Spinner className={ styles.spinner } />
				) : (
					<span>{ __( 'Start with email', 'jetpack-my-jetpack' ) }</span>
				) }
			</button>
		</form>
	);
};

export default EmailInput;
