import { Button, Text } from '@automattic/jetpack-components';
import { useRestoreConnection } from '@automattic/jetpack-connection';
import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from 'react';
import preventWidows from '../../../utils/prevent-widows';
import styles from './styles.module.scss';

const AtomicConnectionForm = () => {
	const [ autoReconnect, setAutoReconnect ] = useState( false );
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();

	const handleReconnect = useCallback( () => {
		restoreConnection( autoReconnect );
	}, [ autoReconnect, restoreConnection ] );

	const handleCheckboxChange = useCallback( () => {
		setAutoReconnect( prevState => ! prevState );
	}, [] );

	// Define button text strings separately to avoid ternary inside __()
	const reconnectingText = __( 'Reconnecting…', 'jetpack-my-jetpack' );
	const reconnectText = __( 'Reconnect', 'jetpack-my-jetpack' );
	const buttonText = isRestoringConnection ? reconnectingText : reconnectText;

	// Display error if there's any
	const errorMessage = restoreConnectionError ? (
		<Text className={ styles[ 'error-message' ] }>
			{ __( 'Connection error. Please try again.', 'jetpack-my-jetpack' ) }
		</Text>
	) : null;

	return (
		<div className={ styles[ 'connection-form' ] }>
			<Text variant="headline-medium" className={ styles.title }>
				{ preventWidows( __( 'Reconnect your site', 'jetpack-my-jetpack' ) ) }
			</Text>

			<Text variant="body" className={ styles.description }>
				{ preventWidows(
					__(
						'Reconnect site owner WordPress.com account to restore Jetpack functionality.',
						'jetpack-my-jetpack'
					)
				) }
			</Text>

			{ errorMessage }

			<Button
				fullWidth
				variant="primary"
				onClick={ handleReconnect }
				className={ styles[ 'submit-button' ] }
				disabled={ isRestoringConnection }
				isLoading={ isRestoringConnection }
			>
				{ buttonText }
			</Button>

			<div className={ styles.tos }>
				<CheckboxControl
					checked={ autoReconnect }
					onChange={ handleCheckboxChange }
					label={ __(
						'Enable auto-reconnect. This feature will auto create owner user account if missing.',
						'jetpack-my-jetpack'
					) }
					disabled={ isRestoringConnection }
				/>
			</div>
		</div>
	);
};

export default AtomicConnectionForm;
