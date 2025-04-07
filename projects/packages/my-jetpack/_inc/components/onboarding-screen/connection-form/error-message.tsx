import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import styles from './styles.module.scss';
import type { OauthErrorType, SocialService } from '../../../hooks/use-oauth-connection';
import type { FC } from 'react';

interface ErrorMessageProps {
	errorType: OauthErrorType;
	service?: SocialService;
}

const ErrorMessage: FC< ErrorMessageProps > = ( { errorType, service = 'Wordpress' } ) => {
	const getMessage = useCallback( () => {
		switch ( errorType ) {
			case 'email-validation':
				// Third argument is to avoid a compilation issue with ternary operator
				return __( 'Please enter a valid email address', 'jetpack-my-jetpack', 0 );
			case 'site-connection':
				return __( 'Site connection failed. Please try again.', 'jetpack-my-jetpack' );
			case 'authorization-url':
				return createInterpolateElement(
					sprintf(
						// translators: %s is the name of the service we are trying to connect to
						__(
							"We couldn't connect to <span>%s</span> at this time. Please try again or select another sign-in method.",
							'jetpack-my-jetpack'
						),
						service
					),
					{
						span: <span className={ styles.capitalize }>{ service }</span>,
					}
				);
			default:
				return __( 'An error occurred. Please try again.', 'jetpack-my-jetpack' );
		}
	}, [ errorType, service ] );

	if ( ! errorType ) {
		return null;
	}

	return (
		<div
			id="email-error-message"
			role="alert"
			aria-live="polite"
			className={ styles[ 'error-message' ] }
		>
			{ getMessage() }
		</div>
	);
};

export default ErrorMessage;
