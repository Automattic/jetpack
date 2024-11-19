import { Text, Button } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React, { ReactElement, useContext } from 'react';
import styles from './styles.module.scss';
import { ThreatModalContext } from '.';

/**
 * UserConnectionGate component
 *
 * @param {object}       props                      - The component props.
 * @param {boolean}      props.userConnectionNeeded - Whether the current user is connected or the site has a connected owner.
 * @param {boolean}      props.userIsConnecting     - Whether the user connection process is in progress.
 * @param {Function}     props.handleConnectUser    - Function to handle the user connection process.
 * @param {ReactElement} props.children             - The child components to render if the user is connected.
 *
 * @return {JSX.Element} The rendered UserConnectionGate component.
 */
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
	const { showThreatDetails, onShowThreatDetailsClick } = useContext( ThreatModalContext );

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
				{ ! showThreatDetails && (
					<Button variant="secondary" onClick={ onShowThreatDetailsClick }>
						{ __( 'Threat Details', 'jetpack' ) }
					</Button>
				) }
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
