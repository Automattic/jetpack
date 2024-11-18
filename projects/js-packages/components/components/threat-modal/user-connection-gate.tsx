import { Text, Button } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React, { ReactNode } from 'react';
import styles from './styles.module.scss';

const UserConnectionGate = ( {
	closeModal,
	isUserConnected,
	hasConnectedOwner,
	userIsConnecting,
	handleConnectUser,
	children,
}: {
	closeModal: () => void;
	isUserConnected: boolean;
	hasConnectedOwner: boolean;
	userIsConnecting: boolean;
	handleConnectUser: () => void;
	children: ReactNode;
} ) => {
	if ( ! isUserConnected || ! hasConnectedOwner ) {
		return (
			<>
				<Text variant="title-small">{ __( 'User connection needed', 'jetpack' ) }</Text>

				<Notice
					status="warning"
					isDismissible={ false }
					children={
						<Text>
							{ __(
								'Before Jetpack can ignore and auto-fix threats on your site, a user connection is needed.',
								'jetpack'
							) }
						</Text>
					}
				/>

				<Text>
					{ __(
						'A user connection provides Jetpack the access necessary to perform these tasks.',
						'jetpack'
					) }
				</Text>

				<Text>
					{ __(
						'Once you’ve secured a user connection, all Jetpack features will be available for use.',
						'jetpack'
					) }
				</Text>

				<div className={ styles[ 'modal-actions' ] }>
					<Button variant="secondary" onClick={ closeModal }>
						{ __( 'Not now', 'jetpack' ) }
					</Button>
					<Button
						isExternalLink={ true }
						weight="regular"
						isLoading={ userIsConnecting }
						onClick={ handleConnectUser }
					>
						{ __( 'Connect your user account', 'jetpack' ) }
					</Button>
				</div>
			</>
		);
	}

	return <>{ children }</>;
};

export default UserConnectionGate;
