import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { TabPanel, ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import { store as socialStore } from '../../social-store';
import ConnectionIcon from '../connection-icon';
import { useConnectionState } from '../form/use-connection-state';
import { PostPreview } from './post-preview';
import styles from './styles.module.scss';

/**
 * Preview section of the social post modal.
 *
 * @return - Preview section of the social post modal.
 */
export function PreviewSection() {
	const { recordEvent } = useAnalytics();

	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();

	const allConnections = useSelect( select => select( socialStore ).getConnections(), [] );
	const unsupportedServices = useSelect(
		select => select( socialStore ).getServicesBy( 'status', 'unsupported' ),
		[]
	);

	const connections = useMemo( () => {
		const unsupportedServiceIds = unsupportedServices.map( service => service.id );
		// Ensure the service is supported
		// to avoid errors for old connections like Twitter
		return allConnections
			.filter( ( { service_name } ) => ! unsupportedServiceIds.includes( service_name ) )
			.map( connection => {
				const title = connection.display_name;
				const name = `${ connection.service_name }-${ connection.connection_id }`;
				const icon = (
					<ConnectionIcon
						label={ title }
						serviceName={ connection.service_name }
						profilePicture={ connection.profile_picture }
					/>
				);
				const disabled =
					shouldBeDisabled( connection ) || ! canBeTurnedOn( connection ) || ! connection.enabled;

				return {
					...connection,
					// Add the props needed for the TabPanel component
					className: disabled ? styles[ 'disabled-tab' ] : '',
					name,
					title,
					icon,
				};
			} );
	}, [ allConnections, canBeTurnedOn, shouldBeDisabled, unsupportedServices ] );

	const { toggleConnectionById } = useDispatch( socialStore );

	const toggleConnection = useCallback(
		( connectionId: string, connection ) => () => {
			toggleConnectionById( connectionId );
			recordEvent( 'jetpack_social_connection_toggled', {
				location: 'preview-modal',
				enabled: ! connection.enabled,
				service_name: connection.service_name,
			} );
		},
		[ recordEvent, toggleConnectionById ]
	);

	return (
		<div className={ styles[ 'preview-section' ] }>
			<TabPanel tabs={ connections }>
				{ ( tab: ( typeof connections )[ number ] ) => {
					const isEnabled = Boolean( canBeTurnedOn( tab ) && tab.enabled );

					return (
						<div className={ styles[ 'preview-content' ] }>
							{
								// If the connection should be disabled
								// it means that there is some validation error
								// or the connection is broken
								// in that case we won't show the toggle
								! shouldBeDisabled( tab ) ? (
									<ToggleControl
										label={
											isEnabled
												? _x( 'Connection enabled', '', 'jetpack-publicize-components' )
												: __( 'Connection disabled', 'jetpack-publicize-components' )
										}
										checked={ isEnabled }
										onChange={ toggleConnection( tab.connection_id, tab ) }
										__nextHasNoMarginBottom={ true }
									/>
								) : null
							}
							<PostPreview connection={ tab } />
						</div>
					);
				} }
			</TabPanel>
		</div>
	);
}
