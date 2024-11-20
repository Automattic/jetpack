import { Text, Button } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React, { ReactElement } from 'react';
import styles from './styles.module.scss';

const UserConnectionGate = ( {
	userConnectionNeeded,
	userIsConnecting,
	handleConnectUser,
	children,
}: {
	userConnectionNeeded: boolean;
	userIsConnecting: boolean;
	handleConnectUser: () => void;
	children: ReactElement;
} ): JSX.Element => {
	if ( ! userConnectionNeeded ) {
		return children;
	}
	return (
		<>
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
};

export default UserConnectionGate;
