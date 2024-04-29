import { Button } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useReducer } from 'react';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store } from '../../social-store';
import AddConnectionModal from '../add-connection-modal';
import ConnectionIcon from '../connection-icon';
import styles from './style.module.scss';

const ConnectionManagement = () => {
	const { refresh } = useSocialMediaConnections();

	const connections = useSelect( select => {
		return select( store ).getConnections();
	}, [] );

	const [ isModalOpen, toggleModal ] = useReducer( state => ! state, false );

	useEffect( () => {
		refresh();
	}, [ refresh ] );

	const onDisconnect = useCallback(
		conn_id => () => {
			apiFetch( {
				method: 'POST',
				path: '/jetpack/v4/publicize/delete-connection/' + conn_id,
			} ).then( res => {
				console.log( { res } );
			} );
		},
		[]
	);

	return (
		<div className={ styles.wrapper }>
			<ul>
				{ connections.map( connection => (
					<li className={ styles.item } key={ connection.connection_id }>
						<ConnectionIcon
							serviceName={ connection.service_name }
							label={ connection.display_name }
							profilePicture={ connection.profile_picture }
						/>
						{ connection.display_name }
						{ connection.can_disconnect && (
							<button onClick={ onDisconnect( connection.connection_id ) }>Disconnect</button>
						) }
					</li>
				) ) }
			</ul>
			<Button onClick={ toggleModal }>{ __( 'Add connection', 'jetpack' ) }</Button>
			{ isModalOpen && <AddConnectionModal onCloseModal={ toggleModal } /> }
		</div>
	);
};

export default ConnectionManagement;
