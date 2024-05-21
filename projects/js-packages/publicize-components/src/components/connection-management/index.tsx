import { Button } from '@automattic/jetpack-components';
import { Disabled } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useReducer, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store } from '../../social-store';
import AddConnectionModal from '../add-connection-modal';
import { SupportedService, useSupportedServices } from '../services/use-supported-services';
import { ConnectionInfo } from './connection-info';
import styles from './style.module.scss';

const ConnectionManagement = ( { className = null } ) => {
	const { refresh } = useSocialMediaConnections();

	const [ expandedService, setExpandedService ] = useState< SupportedService >( null );

	const { connections, deletingConnections, updatingConnections } = useSelect( select => {
		const { getConnections, getDeletingConnections, getUpdatingConnections } = select( store );

		return {
			connections: getConnections(),
			deletingConnections: getDeletingConnections(),
			updatingConnections: getUpdatingConnections(),
		};
	}, [] );

	connections.sort( ( a, b ) => {
		if ( a.service_name === b.service_name ) {
			return a.connection_id.localeCompare( b.connection_id );
		}
		return a.service_name.localeCompare( b.service_name );
	} );

	const [ isModalOpen, toggleModal ] = useReducer( state => ! state, false );

	useEffect( () => {
		refresh();
	}, [ refresh ] );

	const supportedServices = useSupportedServices();

	const onReconnect = useCallback(
		( serviceName: string ) => () => {
			const service = supportedServices.find( _service => _service.ID === serviceName );

			setExpandedService( service );
			toggleModal();
		},
		[ supportedServices ]
	);

	const onCloseModal = useCallback( () => {
		setExpandedService( null );
		toggleModal();
	}, [] );

	return (
		<div className={ classNames( styles.wrapper, className ) }>
			<h3>{ __( 'My Connections', 'jetpack' ) }</h3>
			{ connections.length ? (
				<ul className={ styles[ 'connection-list' ] }>
					{ connections.map( connection => {
						const isUpdatingOrDeleting =
							updatingConnections.includes( connection.connection_id ) ||
							deletingConnections.includes( connection.connection_id );

						return (
							<li className={ styles[ 'connection-list-item' ] } key={ connection.connection_id }>
								<Disabled isDisabled={ isUpdatingOrDeleting }>
									<ConnectionInfo
										connection={ connection }
										onReconnect={ onReconnect( connection.service_name ) }
									/>
								</Disabled>
							</li>
						);
					} ) }
				</ul>
			) : (
				<span>{ __( 'There are no connections added yet.', 'jetpack' ) }</span>
			) }
			<Button onClick={ toggleModal } variant={ connections.length ? 'secondary' : 'primary' }>
				{ __( 'Add connection', 'jetpack' ) }
			</Button>
			{ isModalOpen && (
				<AddConnectionModal
					onCloseModal={ onCloseModal }
					defaultExpandedService={ expandedService }
				/>
			) }
		</div>
	);
};

export default ConnectionManagement;
