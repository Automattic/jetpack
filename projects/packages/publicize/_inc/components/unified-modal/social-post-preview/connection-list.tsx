import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Icon, NavigableMenu } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback } from 'react';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { store as socialStore } from '../../../social-store';
import { Connection } from '../../../social-store/types';
import { getA11yLabelForConnectionPreview } from '../../../utils/misc';
import ConnectionIcon from '../../connection-icon';
import { useConnectionState } from '../../form/use-connection-state';
import styles from './styles.module.scss';

type ConnectionListProps = {
	baseId: string;
	onSelectConnection: ( connection: Connection ) => void;
	selectedConnection: Connection | null;
};

const preventModalScrollOnNavigate = ( event: React.KeyboardEvent ) => {
	// Prevent scrolling the modal sidebar when navigating connections with arrow keys
	const arrowKeys = [ 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight' ];
	if ( arrowKeys.includes( event.key ) ) {
		event.preventDefault();
	}
};

/**
 * Connection List component for the social preview modal sidebar.
 *
 * @param {ConnectionListProps} props - The component props.
 * @return - Connection List component.
 */
export function ConnectionList( {
	baseId,
	onSelectConnection,
	selectedConnection,
}: ConnectionListProps ) {
	const { recordEvent } = useAnalytics();
	const { getConnectionById } = useSelect( socialStore, [] );
	const { connections } = useSocialMediaConnections();
	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();

	const onClickConnection = useCallback(
		( connection: Connection ) => () => {
			onSelectConnection( connection );

			recordEvent( 'jetpack_social_connection_previewed', {
				location: 'preview_modal',
				service_name: connection.service_name,
			} );
		},
		[ onSelectConnection, recordEvent ]
	);

	const onNavigate = useCallback(
		( index: number, target: HTMLElement | null ) => {
			if ( ! target || target.ariaDisabled === 'true' ) {
				return;
			}

			const connectionId = target.dataset.connectionId;

			if ( ! connectionId ) {
				return;
			}

			const connection = getConnectionById( connectionId );
			if ( connection ) {
				onSelectConnection( connection );
			}
		},
		[ getConnectionById, onSelectConnection ]
	);

	return (
		<NavigableMenu // Using navigable menu for keyboard navigation between tabs
			role="tablist"
			orientation="vertical"
			aria-label={ __( 'Preview social posts', 'jetpack-publicize-pkg' ) }
			onNavigate={ onNavigate }
			onKeyDown={ preventModalScrollOnNavigate }
		>
			{ connections.map( connection => {
				const isConnectionEnabled = canBeTurnedOn( connection ) && connection.enabled;

				const isSelected = selectedConnection?.connection_id === connection.connection_id;
				const isDisabled = ! isConnectionEnabled || shouldBeDisabled( connection );

				return (
					<Button
						__next40pxDefaultSize
						key={ connection.connection_id }
						role="tab"
						data-connection-id={ connection.connection_id }
						className={ clsx( styles[ 'connection-button' ], {
							[ styles[ 'selected-connection' ] ]: isSelected,
						} ) }
						icon={
							<Icon
								className={ clsx( {
									[ styles[ 'active-chevron' ] ]: isSelected,
								} ) }
								icon={ isRTL() ? chevronLeft : chevronRight }
							/>
						}
						iconPosition="right"
						onClick={ onClickConnection( connection ) }
						id={ `${ baseId }-preview-tab-${ connection.connection_id }` }
						// Make the tab focusable even if disabled for accessibility reasons
						accessibleWhenDisabled
						disabled={ isDisabled }
						aria-selected={ isSelected }
						aria-controls={ `${ baseId }-preview-content-${ connection.connection_id }` }
						aria-label={ getA11yLabelForConnectionPreview( connection ) }
						// Disable navigation via tab key
						tabIndex={ isSelected ? 0 : -1 }
					>
						<div className={ styles[ 'connection-info' ] }>
							<div className={ styles[ 'display-name' ] } title={ connection.display_name }>
								{ connection.display_name }
							</div>
							<ConnectionIcon
								serviceName={ connection.service_name }
								// Avoid screen reader reading the label twice when the item is focused
								label=""
								profilePicture={ connection.profile_picture }
								disabled={ isDisabled }
							/>
						</div>
					</Button>
				);
			} ) }
		</NavigableMenu>
	);
}
