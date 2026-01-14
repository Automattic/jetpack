import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { Connection } from '../../../social-store/types';
import { useConnectionState } from '../../form/use-connection-state';

export type ConnectionToggleProps = {
	connection?: Connection;
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
				/* translators: %s: social media account title */
				__( 'Share to %s', 'jetpack-publicize-pkg' ),
				connection.display_name
			) }
			checked={ isEnabled }
			onChange={ onClickConnectionToggle }
			disabled={ isDisabled }
		/>
	);
}
