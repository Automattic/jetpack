import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { FormToggle, MenuGroup, MenuItem } from '@wordpress/components';
import { useCallback } from 'react';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { Connection } from '../../social-store/types';
import { ConnectionIcon } from '../connection-icon';
import { useConnectionState } from '../form/use-connection-state';
import styles from './styles.module.scss';

/**
 * The component to render a list of social media connections as a toggle list.
 *
 * @return React element
 */
export function ConnectionsToggleList() {
	const { recordEvent } = useAnalytics();

	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();
	const { connections, toggleById } = useSocialMediaConnections();

	const toggleConnection = useCallback(
		( connectionId: string, connection: Connection ) => () => {
			toggleById( connectionId );
			recordEvent( 'jetpack_social_connection_toggled', {
				location: 'editor',
				enabled: ! connection.enabled,
				service_name: connection.service_name,
			} );
		},
		[ recordEvent, toggleById ]
	);

	return (
		<MenuGroup className={ styles.wrapper }>
			{ connections.map( connection => {
				const isSelected = canBeTurnedOn( connection ) && connection.enabled;
				const isDisabled = shouldBeDisabled( connection );

				return (
					<MenuItem
						key={ connection.connection_id }
						role="menuitemcheckbox"
						disabled={ isDisabled }
						icon={
							<FormToggle
								tabIndex={ -1 }
								checked={ isSelected }
								disabled={ isDisabled }
								aria-hidden="true"
							/>
						}
						isSelected={ isSelected }
						onClick={ toggleConnection( connection.connection_id, connection ) }
						aria-label={ connection.display_name }
						className={ styles.item }
					>
						<div className={ styles[ 'item-content' ] }>
							<ConnectionIcon
								serviceName={ connection.service_name }
								label={ connection.display_name }
								profilePicture={ connection.profile_picture }
								disabled={ isDisabled }
							/>
							<div className={ styles[ 'display-name' ] } title={ connection.display_name }>
								{ connection.display_name }
							</div>
						</div>
					</MenuItem>
				);
			} ) }
		</MenuGroup>
	);
}
