import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { Connection } from '../../../social-store/types';
import { useConnectionState } from '../../form/use-connection-state';
import styles from './styles.module.scss';

export type ConnectionToggleProps = {
	connection: Connection;
};

/**
 * Connection Toggle component for the customize and preview modal.
 *
 * @param {ConnectionToggleProps} props - The component props.
 * @return - Connection Toggle component.
 */
export function ConnectionToggle( { connection }: ConnectionToggleProps ) {
	const { toggleById } = useSocialMediaConnections();
	const { recordEvent } = useAnalytics();
	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();

	const onClickConnectionToggle = useCallback( () => {
		toggleById( connection.connection_id );

		recordEvent( 'jetpack_social_connection_toggled', {
			location: 'preview_modal',
			enabled: ! connection.enabled,
			service_name: connection.service_name,
		} );
	}, [
		connection.connection_id,
		connection.enabled,
		connection.service_name,
		recordEvent,
		toggleById,
	] );

	const isEnabled = Boolean( canBeTurnedOn( connection ) && connection.enabled );
	const isDisabled = shouldBeDisabled( connection );

	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ sprintf(
				/* translators: %1$s: social media account name, %2$s: social media platform name (e.g. Facebook, LinkedIn) */
				__( 'Share to %1$s on %2$s', 'jetpack-publicize-pkg' ),
				connection.display_name,
				connection.service_label
			) }
			className={ styles[ 'connection-toggle' ] }
			checked={ isEnabled }
			onChange={ onClickConnectionToggle }
			disabled={ isDisabled }
		/>
	);
}
