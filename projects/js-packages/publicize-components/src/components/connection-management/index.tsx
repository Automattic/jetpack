import { Button } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useReducer, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store } from '../../social-store';
import AddConnectionModal from '../add-connection-modal';
import { SupportedService, getSupportedServices } from '../add-connection-modal/constants';
import ConnectionIcon from '../connection-icon';
import { ConnectionInfo } from './connection-info';
import { Disconnect } from './disconnect';
import styles from './style.module.scss';

const ConnectionManagement = ( { className = null } ) => {
	const { refresh } = useSocialMediaConnections();

	const [ currentService, setCurrentService ] = useState< SupportedService >( null );

	const connections = useSelect( select => {
		return select( store ).getConnections();
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

	const onReconnect = useCallback(
		( serviceName: string ) => () => {
			const service = getSupportedServices().find( _service => _service.name === serviceName );

			setCurrentService( service );
			toggleModal();
		},
		[]
	);

	const onCloseModal = useCallback( () => {
		setCurrentService( null );
		toggleModal();
	}, [] );

	return (
		<div className={ classNames( styles.wrapper, className ) }>
			<h3>{ __( 'Connections', 'jetpack' ) }</h3>
			{ connections.length ? (
				<table>
					<thead>
						<tr>
							<th className={ styles[ 'column-icon' ] }></th>
							<th className={ styles[ 'column-name' ] }></th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{ connections.map( connection => (
							<tr className={ styles.item } key={ connection.connection_id }>
								<td className={ styles.icon }>
									<ConnectionIcon
										serviceName={ connection.service_name }
										label={ connection.display_name }
										profilePicture={ connection.profile_picture }
									/>
								</td>
								<td className={ styles.name }>
									<ConnectionInfo
										connection={ connection }
										onReconnect={ onReconnect( connection.service_name ) }
									/>
								</td>
								<td className={ styles.actions }>
									<Disconnect connection={ connection } />
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			) : (
				<span>{ __( 'There are no connections added yet.', 'jetpack' ) }</span>
			) }
			<Button onClick={ toggleModal } size="small">
				{ __( 'Add new connection', 'jetpack' ) }
			</Button>
			{ isModalOpen && (
				<AddConnectionModal
					onCloseModal={ onCloseModal }
					currentService={ currentService }
					setCurrentService={ setCurrentService }
				/>
			) }
		</div>
	);
};

export default ConnectionManagement;
