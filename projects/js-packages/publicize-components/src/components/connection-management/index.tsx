import { Button, Spinner } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { useCallback, useEffect, useReducer } from 'react';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store } from '../../social-store';
import AddConnectionModal from '../add-connection-modal';
import ConnectionIcon from '../connection-icon';
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

	const [ isModalOpen, toggleModal ] = useReducer( state => ! state, false );

	useEffect( () => {
		refresh();
	}, [ refresh ] );

	const onDisconnect = useCallback(
		conn_id => () => {
			apiFetch( {
				method: 'POST',
				path: '/jetpack/v4/publicize/delete-connection/' + conn_id,
			} ).then( () => {
				// Handle disconnection
			} );
		},
		[]
	);

	const renderConnectionName = connection => {
		if ( connection.display_name ) {
			if ( ! connection.profile_link ) {
				return connection.display_name;
			}
			return (
				<ExternalLink className={ styles[ 'profile-link' ] } href={ connection.profile_link }>
					{ connection.display_name }
				</ExternalLink>
			);
		}
		return <Spinner color="black" />;
	};

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
								<td className={ styles.name }>{ renderConnectionName( connection ) }</td>
								<td>
									{ connection.can_disconnect && (
										<Button
											size="small"
											variant="secondary"
											onClick={ onDisconnect( connection.connection_id ) }
										>
											{ __( 'Disconnect', 'jetpack' ) }
										</Button>
									) }
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
			{ isModalOpen && <AddConnectionModal onCloseModal={ toggleModal } /> }
		</div>
	);
};

export default ConnectionManagement;
