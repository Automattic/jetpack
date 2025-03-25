import { __ } from '@wordpress/i18n';
import { ChangeEvent, FormEvent, useCallback, useState } from 'react';
import styles from './connection-form.module.scss';

interface EmailInputProps {
	isDisabled: boolean;
}

const EmailInput = ( { isDisabled }: EmailInputProps ) => {
	const [ userEmail, setUserEmail ] = useState( '' );

	const handleOnInput = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			setUserEmail( event.target.value );
		},
		[ setUserEmail ]
	);

	const handleOnSubmit = useCallback( ( event: FormEvent< HTMLFormElement > ) => {
		event.preventDefault();
	}, [] );

	return (
		<form onSubmit={ handleOnSubmit } className={ styles[ 'email-input-container' ] }>
			<input
				className={ styles[ 'email-input' ] }
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
			<button className={ styles[ 'submit-button' ] } disabled={ isDisabled || ! userEmail }>
				{ __( 'Start with email', 'jetpack-my-jetpack' ) }
			</button>
		</form>
	);
};

export default EmailInput;
