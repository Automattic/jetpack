import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import ErrorMessage from './error-message';
import styles from './styles.module.scss';
import type { SubmitType, UseOauthConnectionReturn } from '../../../hooks/use-oauth-connection';
import type { ChangeEvent, FC, FormEvent } from 'react';
interface EmailInputProps {
	onSubmit: ( submitType: SubmitType ) => void;
	loading: boolean;
	isDisabled: boolean;
	lastClicked: SubmitType | null;
	oauthConnectionData: UseOauthConnectionReturn;
}

const EmailInput: FC< EmailInputProps > = ( {
	isDisabled,
	onSubmit,
	loading,
	lastClicked,
	oauthConnectionData,
} ) => {
	const { userEmail, setUserEmail, errorType } = oauthConnectionData;

	const handleOnInput = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			setUserEmail( event.target.value );
		},
		[ setUserEmail ]
	);

	const handleOnSubmit = useCallback(
		async ( event: FormEvent< HTMLFormElement > ) => {
			event.preventDefault();
			onSubmit?.( 'email' );
		},
		[ onSubmit ]
	);

	const isLastClicked = useMemo( () => {
		return lastClicked === 'email';
	}, [ lastClicked ] );

	// Purpose of this is to only show errors and loading indicators
	// on the last clicked button, not on all buttons.
	const isThisLoading = useMemo( () => {
		return loading && isLastClicked;
	}, [ loading, isLastClicked ] );

	const getAriaLabel = useMemo( () => {
		if ( isThisLoading ) {
			return __( 'Connecting…', 'jetpack-my-jetpack', 0 );
		}

		return __( 'Start with email', 'jetpack-my-jetpack' );
	}, [ isThisLoading ] );

	const isInputDisabled = useMemo( () => {
		return isDisabled || isThisLoading;
	}, [ isDisabled, isThisLoading ] );

	const isFormDisabled = useMemo( () => {
		return isInputDisabled || errorType === 'email-validation';
	}, [ isInputDisabled, errorType ] );

	return (
		<form onSubmit={ handleOnSubmit } className={ styles[ 'email-input-container' ] }>
			<input
				className={ `${ styles[ 'email-input' ] } ${
					errorType === 'email-validation' ? styles[ 'email-input-error' ] : ''
				}` }
				type="email"
				autoComplete="email"
				spellCheck={ false }
				autoCorrect="off"
				name="user-email"
				placeholder={ __( 'Enter your email address', 'jetpack-my-jetpack' ) }
				aria-label={ __( 'Email address', 'jetpack-my-jetpack' ) }
				aria-invalid={ errorType === 'email-validation' }
				aria-describedby={ errorType ? 'email-error-message' : undefined }
				value={ userEmail }
				disabled={ isInputDisabled }
				onInput={ handleOnInput }
			/>
			{ isLastClicked && <ErrorMessage errorType={ errorType } /> }
			<button
				className={ styles[ 'submit-button' ] }
				disabled={ isFormDisabled }
				aria-busy={ isThisLoading }
				aria-label={ getAriaLabel }
				type="submit"
			>
				{ isThisLoading ? (
					<Spinner className={ styles.spinner } />
				) : (
					<span>{ __( 'Start with email', 'jetpack-my-jetpack' ) }</span>
				) }
			</button>
		</form>
	);
};

export default EmailInput;
