import { Button, Container, Col, JetpackLogo, Text } from '@automattic/jetpack-components';
import { ConnectionStatus } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from 'react';
import { useFullScreen } from '../../hooks/use-fullscreen';
import Testimonials from '../testimonials';
import styles from './styles.module.scss';
import type { FC } from 'react';

// API endpoints from constants.ts
const REST_API_NAMESPACE = 'my-jetpack/v1';

// Define response types
interface ReconnectResponse {
	success: boolean;
	status: 'in_progress' | 'completed';
	authorizeUrl?: string;
}

const api = {
	updateWoaAutoReconnect: ( enabled: boolean ) => {
		return apiFetch< { success: boolean } >( {
			path: `${ REST_API_NAMESPACE }/site/woa-auto-reconnect`,
			method: 'POST',
			data: { enabled },
		} );
	},

	tryReconnect: () => {
		return apiFetch< ReconnectResponse >( {
			path: `${ REST_API_NAMESPACE }/site/try-reconnect`,
			method: 'POST',
		} );
	},
};

const WoaOnboardingScreen: FC = () => {
	const [ isAutoReconnectEnabled, setIsAutoReconnectEnabled ] = useState( false );
	const [ isReconnecting, setIsReconnecting ] = useState( false );
	const [ reconnectError, setReconnectError ] = useState( null );
	const [ settingError, setSettingError ] = useState( false );
	const [ reconnectStatus, setReconnectStatus ] = useState< 'idle' | 'in_progress' | 'completed' >(
		'idle'
	);

	useFullScreen();

	// Function to handle reconnection
	const handleReconnect = useCallback( async () => {
		setIsReconnecting( true );
		setReconnectError( null );

		try {
			const response = await api.tryReconnect();

			if ( response.status === 'in_progress' && response.authorizeUrl ) {
				// Redirect to the authorization URL
				window.location.href = response.authorizeUrl;
				return;
			}

			if ( response.status === 'completed' ) {
				setReconnectStatus( 'completed' );
				// Reload the page after a short delay to show completion state
				setTimeout( () => window.location.reload(), 1500 );
				return;
			}

			throw new Error( 'Reconnection failed with unknown status' );
		} catch ( error ) {
			setReconnectError( error );
			setIsReconnecting( false );
		}
	}, [] );

	// Function to handle auto-reconnect checkbox change
	const handleAutoReconnectChange = useCallback( async ( checked: boolean ) => {
		setIsAutoReconnectEnabled( checked );
		setSettingError( false );

		try {
			await api.updateWoaAutoReconnect( checked );
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch ( _ ) {
			// If there's an error, revert the UI state
			setIsAutoReconnectEnabled( ! checked );
			setSettingError( true );
		}
	}, [] );

	return (
		<Container
			horizontalSpacing={ 3 }
			horizontalGap={ 0 }
			className={ styles[ 'woa-onboarding-screen' ] }
		>
			<JetpackLogo height={ 24 } showText={ false } className={ styles[ 'jetpack-logo' ] } />
			<Col sm={ 4 } md={ 4 } lg={ 6 } className={ styles.column }>
				<div className={ styles[ 'connection-form' ] }>
					<Text variant="headline-medium" className={ styles.title }>
						{ __( 'Reconnect Jetpack', 'jetpack-my-jetpack' ) }
					</Text>

					<Text variant="body" className={ styles.description }>
						{ __(
							'Your site needs to reconnect to WordPress.com to continue using Jetpack features.',
							'jetpack-my-jetpack'
						) }
					</Text>

					<ConnectionStatus />

					{ reconnectStatus === 'completed' ? (
						<div className={ styles.successMessage }>
							<Text>{ __( 'Reconnection successful! Reloading…', 'jetpack-my-jetpack' ) }</Text>
						</div>
					) : (
						<>
							<Button
								onClick={ handleReconnect }
								isLoading={ isReconnecting }
								disabled={ isReconnecting }
								className={ styles.reconnectButton }
							>
								{ __( 'Reconnect Jetpack', 'jetpack-my-jetpack' ) }
							</Button>

							<div className={ styles.autoReconnectOption }>
								<CheckboxControl
									checked={ isAutoReconnectEnabled }
									onChange={ handleAutoReconnectChange }
									label={ __(
										'Allow Jetpack to reconnect automatically in the future. This option includes recreating owner account if missing.',
										'jetpack-my-jetpack'
									) }
								/>
								{ settingError && (
									<Text className={ styles.settingError }>
										{ __( 'There was an error saving your preference.', 'jetpack-my-jetpack' ) }
									</Text>
								) }
							</div>

							{ reconnectError && (
								<div className={ styles.errorMessage }>
									<Text>
										{ __(
											'There was an error reconnecting Jetpack. Please try again.',
											'jetpack-my-jetpack'
										) }
									</Text>
								</div>
							) }
						</>
					) }
				</div>
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 6 } className={ styles.testimonials }>
				<Testimonials />
			</Col>
		</Container>
	);
};

export default WoaOnboardingScreen;
