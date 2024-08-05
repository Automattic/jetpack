import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { TabPanel } from '@wordpress/components';
import { ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { store as socialStore } from '../../social-store';
import ConnectionIcon from '../connection-icon';
import { useConnectionState } from '../form/use-connection-state';
import { useService } from '../services/use-service';
import { PostPreview } from './post-preview';
import styles from './styles.module.scss';

/**
 * Preview section of the social post modal.
 *
 * @returns {import('react').ReactNode} - Preview section of the social post modal.
 */
export function PreviewSection() {
	const { recordEvent } = useAnalytics();

	const getService = useService();

	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();

	const connections = useSelect(
		select => {
			const store = select( socialStore );

			return (
				store
					.getConnections()
					// Ensure the service is supported
					// to avoid errors for old connections like Twitter
					.filter( ( { service_name } ) => getService( service_name ) )
					.map( connection => {
						const title = connection.display_name || connection.external_display;
						const name = `${ connection.service_name }-${ connection.connection_id }`;
						const icon = (
							<ConnectionIcon
								label={ title }
								serviceName={ connection.service_name }
								profilePicture={ connection.profile_picture }
							/>
						);
						const disabled =
							shouldBeDisabled( connection ) ||
							! canBeTurnedOn( connection ) ||
							! connection.enabled;

						return {
							...connection,
							// Add the props needed for the TabPanel component
							className: disabled ? styles[ 'disabled-tab' ] : '',
							name,
							title,
							icon,
						};
					} )
			);
		},
		[ getService, shouldBeDisabled ]
	);

	const { toggleConnectionById } = useDispatch( socialStore );

	const toggleConnection = useCallback(
		( connectionId: string, connection ) => () => {
			toggleConnectionById( connectionId );
			recordEvent( 'jetpack_social_connection_toggled', {
				location: 'preview-modal',
				new_state: ! connection.enabled,
				service_name: connection.service_name,
			} );
		},
		[ recordEvent, toggleConnectionById ]
	);

	return (
		<div className={ styles[ 'preview-section' ] }>
			<TabPanel tabs={ connections }>
				{ ( tab: ( typeof connections )[ number ] ) => (
					<div className={ styles[ 'preview-content' ] }>
						<PostPreview connection={ tab } />
						<ToggleControl
							label={ __( 'Share to this account', 'jetpack' ) }
							disabled={ shouldBeDisabled( tab ) }
							checked={ canBeTurnedOn( tab ) && tab.enabled }
							onChange={ toggleConnection( tab.connection_id, tab ) }
						/>
					</div>
				) }
			</TabPanel>
		</div>
	);
}
