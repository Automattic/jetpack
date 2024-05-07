import { Button } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { useCallback, useEffect, useReducer } from 'react';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store } from '../../social-store';
import ConnectionIcon from '../connection-icon';
import { ConnectionInfo } from './connection-info';
import { Disconnect } from './disconnect';
import { Snackbars } from './snackbars';
import styles from './style.module.scss';

const ConnectionManagement = ( { className = null } ) => {
	const { refresh } = useSocialMediaConnections();

	const connections = useSelect( select => {
		return select( store ).getConnections();
	}, [] );

	connections.sort( ( a, b ) => {
		if ( a.service_name === b.service_name ) {
			return a.connection_id.localeCompare( b.connection_id );
		}
		return a.service_name.localeCompare( b.service_name );
	} );

	const [ , /* isModalOpen, */ toggleModal ] = useReducer( state => ! state, false );

	useEffect( () => {
		refresh();
	}, [ refresh ] );

	const onReconnect = useCallback(
		( _serviceName: string ) => () => {
			toggleModal();

			// TODO Pass the service name to the modal
		},
		[]
	);

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
								<td>
									<Disconnect connection={ connection } />
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			) : (
				<span>{ __( 'There are no connections added yet.', 'jetpack' ) }</span>
			) }
			<Snackbars />
			<Button size="small">{ __( 'Add new connection', 'jetpack' ) }</Button>
			{ /* { isModalOpen && <AddConnectionModal onCloseModal={ toggleModal } /> } */ }
		</div>
	);
};

export default ConnectionManagement;
