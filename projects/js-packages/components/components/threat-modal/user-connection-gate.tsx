import { Text, Button } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React, { ReactNode, useContext } from 'react';
import styles from './styles.module.scss';
import { ThreatDetailsModalContext } from '.';

/**
 * UserConnectionGate component
 *
 * @param {object}    props                   - The component props.
 * @param {boolean}   props.isUserConnected   - Whether the current user is connected.
 * @param {boolean}   props.hasConnectedOwner - Whether the site has a connected owner.
 * @param {boolean}   props.userIsConnecting  - Whether the user connection process is in progress.
 * @param {Function}  props.handleConnectUser - Function to handle the user connection process.
 * @param {ReactNode} props.children          - The child components to render if the user is connected.
 *
 * @return {JSX.Element} The rendered UserConnectionGate component.
 */
const UserConnectionGate = ( {
	isUserConnected,
	hasConnectedOwner,
	userIsConnecting,
	handleConnectUser,
	children,
}: {
	isUserConnected: boolean;
	hasConnectedOwner: boolean;
	userIsConnecting: boolean;
	handleConnectUser: () => void;
	children: ReactNode;
} ) => {
	const { closeModal, showThreatDetails, onShowThreatDetailsClick } =
		useContext( ThreatDetailsModalContext );

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
					<div className={ styles[ 'threat-actions' ] }>
						{ ! showThreatDetails && (
							<Button onClick={ onShowThreatDetailsClick }>
								{ __( 'Threat Details', 'jetpack' ) }
							</Button>
						) }
						<Button variant="secondary" onClick={ closeModal }>
							{ __( 'Close', 'jetpack' ) }
						</Button>
					</div>
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
