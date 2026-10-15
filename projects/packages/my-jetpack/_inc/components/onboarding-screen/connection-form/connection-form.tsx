import { JetpackLogo, TermsOfService, Text } from '@automattic/jetpack-components';
import {
	getRegistrationErrorCode,
	getRegistrationErrorDisplay,
	useConnection,
} from '@automattic/jetpack-connection';
import { Button, Spinner, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import preventWidows from '../../../utils/prevent-widows';
import styles from './styles.module.scss';

const ConnectionForm = () => {
	const { userIsConnecting, siteIsRegistering, handleRegisterSite, registrationError } =
		useConnection( { from: 'jetpack-onboarding' } );

	const isConnecting = userIsConnecting || siteIsRegistering;

	const { recordEvent } = useAnalytics();

	const onClickConnect = useCallback( () => {
		recordEvent( 'jetpack_my_jetpack_onboarding_click' );
		handleRegisterSite();
	}, [ recordEvent, handleRegisterSite ] );

	const errorDisplay = getRegistrationErrorDisplay( registrationError );

	useEffect( () => {
		if ( registrationError ) {
			recordEvent( 'jetpack_my_jetpack_onboarding_error', {
				error: registrationError,
				// Not `unknown` or `unknown_error`: both are real registration error codes.
				error_code: getRegistrationErrorCode( registrationError ) ?? 'no_error_code',
			} );
		}
	}, [ registrationError, recordEvent ] );

	return (
		<div className={ styles[ 'connection-form' ] }>
			<JetpackLogo height={ 24 } className={ styles[ 'jetpack-logo' ] } />

			<Text variant="headline-medium" className={ styles.title }>
				{ preventWidows( __( 'Start with Jetpack for free', 'jetpack-my-jetpack' ) ) }
			</Text>

			<Text variant="body" className={ styles.description }>
				{ preventWidows(
					__(
						'Supercharge your WordPress site with powerful security, speed, and growth tools.',
						'jetpack-my-jetpack'
					)
				) }
			</Text>

			<Button
				variant="primary"
				className={ styles[ 'submit-button' ] }
				disabled={ isConnecting }
				aria-busy={ isConnecting }
				onClick={ onClickConnect }
				// Ensure that we have the label when the button is disabled
				aria-label={ __( 'Supercharge my site', 'jetpack-my-jetpack' ) }
			>
				{ isConnecting ? (
					<Spinner className={ styles.spinner } />
				) : (
					__( 'Supercharge my site', 'jetpack-my-jetpack' )
				) }
			</Button>

			{ registrationError ? (
				<Notice
					status="error"
					isDismissible={ false }
					// Announce only what's visible: a collapsed detail stays out of the spoken message.
					spokenMessage={
						errorDisplay.detailCollapsed && typeof errorDisplay.message === 'string'
							? errorDisplay.message
							: undefined
					}
				>
					<p>
						{ errorDisplay.message ||
							__( 'An error occurred. Please try again.', 'jetpack-my-jetpack' ) }
					</p>
					{ errorDisplay.detail &&
						( errorDisplay.detailCollapsed ? (
							<details>
								<summary>{ __( 'Details', 'jetpack-my-jetpack' ) }</summary>
								<p>{ errorDisplay.detail }</p>
							</details>
						) : (
							<p>{ errorDisplay.detail }</p>
						) ) }
				</Notice>
			) : null }

			<TermsOfService
				className={ styles.tos }
				agreeButtonLabel={ __( 'Supercharge my site', 'jetpack-my-jetpack' ) }
			/>
		</div>
	);
};

export default ConnectionForm;
