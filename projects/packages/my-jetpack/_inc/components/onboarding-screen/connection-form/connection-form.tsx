import { JetpackLogo, TermsOfService, Text } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { Button, Spinner, Notice } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import preventWidows from '../../../utils/prevent-widows';
import styles from './styles.module.scss';

const ConnectionForm = () => {
	const {
		userIsConnecting,
		siteIsRegistering,
		handleRegisterSite,
		handleConnectUser,
		registrationError,
		isRegistered,
	} = useConnection( { from: 'jetpack-onboarding' } );

	const isConnecting = userIsConnecting || siteIsRegistering;

	const { recordEvent } = useAnalytics();

	const onClickConnectSite = useCallback( () => {
		recordEvent( 'jetpack_my_jetpack_onboarding_click' );
		handleRegisterSite();
	}, [ recordEvent, handleRegisterSite ] );

	const onClickConnectUser = useCallback( () => {
		recordEvent( 'jetpack_my_jetpack_connect_user_click' );
		handleConnectUser();
	}, [ recordEvent, handleConnectUser ] );

	useEffect( () => {
		if ( registrationError ) {
			recordEvent( 'jetpack_my_jetpack_onboarding_error', {
				error: registrationError,
			} );
		}
	}, [ registrationError, recordEvent ] );

	return (
		<div className={ styles[ 'connection-form' ] }>
			<JetpackLogo height={ 24 } className={ styles[ 'jetpack-logo' ] } />

			<Text variant="headline-medium" className={ styles.title }>
				{ preventWidows(
					isRegistered
						? _x(
								'Connect your user account to unlock powerful features',
								'',
								'jetpack-my-jetpack'
						  )
						: __( 'Start with Jetpack for free', 'jetpack-my-jetpack' )
				) }
			</Text>

			<Text variant="body" className={ styles.description }>
				{ preventWidows(
					isRegistered
						? _x(
								'Log in to supercharge your site with powerful security, speed, and growth tools.',
								'',
								'jetpack-my-jetpack'
						  )
						: __(
								'Supercharge your WordPress site with powerful security, speed, and growth tools.',
								'jetpack-my-jetpack'
						  )
				) }
			</Text>

			<Button
				className={ styles[ 'submit-button' ] }
				disabled={ isConnecting }
				aria-busy={ isConnecting }
				onClick={ isRegistered ? onClickConnectUser : onClickConnectSite }
				// Ensure that we have the label when the button is disabled
				aria-label={ __( 'Supercharge my site', 'jetpack-my-jetpack' ) }
			>
				{
					// Use IIFE to avoid nested ternary for readability
					( ( connecting, registered ) => {
						if ( connecting ) {
							return <Spinner className={ styles.spinner } />;
						}

						if ( registered ) {
							return _x( 'Connect your account', '', 'jetpack-my-jetpack' );
						}

						return __( 'Supercharge my site', 'jetpack-my-jetpack' );
					} )( isConnecting, isRegistered )
				}
			</Button>

			{ registrationError ? (
				<Notice status="error" isDismissible={ false }>
					{ registrationError.message ||
						__( 'An error occurred. Please try again.', 'jetpack-my-jetpack' ) }
				</Notice>
			) : null }

			<TermsOfService
				className={ styles.tos }
				agreeButtonLabel={
					isRegistered
						? _x( 'Connect your account', '', 'jetpack-my-jetpack' )
						: __( 'Supercharge my site', 'jetpack-my-jetpack' )
				}
			/>
		</div>
	);
};

export default ConnectionForm;
