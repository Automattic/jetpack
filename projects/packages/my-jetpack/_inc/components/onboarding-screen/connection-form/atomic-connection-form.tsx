import { Button, Text } from '@automattic/jetpack-components';
import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from 'react';
import preventWidows from '../../../utils/prevent-widows';
import styles from './styles.module.scss';

const AtomicConnectionForm = () => {
	const [ autoReconnect, setAutoReconnect ] = useState( false );

	const handleReconnect = useCallback( () => {
		// This is a placeholder - no functionality yet
	}, [] );

	const handleCheckboxChange = useCallback( () => {
		setAutoReconnect( prevState => ! prevState );
	}, [] );

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

			<Button
				fullWidth
				variant="primary"
				onClick={ handleReconnect }
				className={ styles[ 'submit-button' ] }
			>
				{ __( 'Reconnect', 'jetpack-my-jetpack' ) }
			</Button>

			<div className={ styles.tos }>
				<CheckboxControl
					checked={ autoReconnect }
					onChange={ handleCheckboxChange }
					label={ __( 'Auto-reconnect in the future', 'jetpack-my-jetpack' ) }
				/>
			</div>
		</div>
	);
};

export default AtomicConnectionForm;
