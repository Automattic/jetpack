import { type Threat, getFixerState } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from 'react';
import CredentialsGate from './credentials-gate';
import styles from './styles.module.scss';
import ThreatActions from './threat-actions';
import ThreatDetailsGate from './threat-details-gate';
import ThreatFixDetails from './threat-fix-details';
import ThreatNotice from './threat-notice';
import ThreatSummary from './threat-summary';
import ThreatTechnicalDetails from './threat-technical-details';
import UserConnectionGate from './user-connection-gate';

/**
 * ThreatDetailsModal component
 *
 * @param {object}   props                           - The props.
 * @param {object}   props.threat                    - The threat.
 * @param {boolean}  props.isUserConnected           - Whether the user is connected.
 * @param {boolean}  props.hasConnectedOwner         - Whether the user has a connected owner.
 * @param {boolean}  props.userIsConnecting          - Whether the user is connecting.
 * @param {Function} props.handleConnectUser         - The handleConnectUser function.
 * @param {object}   props.credentials               - The credentials.
 * @param {boolean}  props.credentialsIsFetching     - Whether the credentials are fetching.
 * @param {string}   props.credentialsRedirectUrl    - The credentials redirect URL.
 * @param {Function} props.handleUpgradeClick        - The handleUpgradeClick function.
 * @param {Function} props.handleFixThreatClick      - The handleFixThreatClick function.
 * @param {Function} props.handleIgnoreThreatClick   - The handleIgnoreThreatClick function.
 * @param {Function} props.handleUnignoreThreatClick - The handleUnignoreThreatClick function.
 *
 * @return {JSX.Element} The threat details modal.
 */
export default function ThreatDetailsModal( {
	threat,
	isUserConnected,
	hasConnectedOwner,
	userIsConnecting,
	handleConnectUser,
	credentials,
	credentialsIsFetching,
	credentialsRedirectUrl,
	handleUpgradeClick,
	handleFixThreatClick,
	handleIgnoreThreatClick,
	handleUnignoreThreatClick,
	...modalProps
}: {
	threat: Threat;
	isUserConnected: boolean;
	hasConnectedOwner: boolean;
	userIsConnecting: boolean;
	handleConnectUser: () => void;
	credentials: false | Record< string, unknown >[];
	credentialsIsFetching: boolean;
	credentialsRedirectUrl: string;
	handleUpgradeClick?: () => void;
	handleFixThreatClick?: ( threats: Threat[] ) => void;
	handleIgnoreThreatClick?: ( threats: Threat[] ) => void;
	handleUnignoreThreatClick?: ( threats: Threat[] ) => void;
	[ key: string ]: unknown;
} ): JSX.Element {
	const [ showThreatDetails, setShowThreatDetails ] = useState( true );

	const fixerState = useMemo( () => {
		return getFixerState( threat.fixer );
	}, [ threat.fixer ] );

	const title = useMemo( () => {
		if ( threat.title ) {
			return threat.title;
		}

		if ( threat.status === 'fixed' ) {
			return __( 'What was the problem?', 'jetpack' );
		}

		return __( 'What is the problem?', 'jetpack' );
	}, [ threat ] );

	return (
		<Modal size="large" __experimentalHideHeader { ...modalProps }>
			<div className={ styles[ 'threat-details' ] }>
				<ThreatDetailsGate
					title={ title }
					threat={ threat }
					fixerState={ fixerState }
					handleUpgradeClick={ handleUpgradeClick }
					handleFixThreatClick={ handleFixThreatClick }
					handleIgnoreThreatClick={ handleIgnoreThreatClick }
					handleUnignoreThreatClick={ handleUnignoreThreatClick }
					closeModal={ modalProps.onRequestClose as () => void }
					showThreatDetails={ showThreatDetails }
					setShowThreatDetails={ setShowThreatDetails }
				>
					<UserConnectionGate
						closeModal={ modalProps.onRequestClose as () => void }
						isUserConnected={ isUserConnected }
						hasConnectedOwner={ hasConnectedOwner }
						userIsConnecting={ userIsConnecting }
						handleConnectUser={ handleConnectUser }
						showThreatDetails={ showThreatDetails }
						setShowThreatDetails={ setShowThreatDetails }
					>
						<CredentialsGate
							closeModal={ modalProps.onRequestClose as () => void }
							credentials={ credentials }
							credentialsIsFetching={ credentialsIsFetching }
							credentialsRedirectUrl={ credentialsRedirectUrl }
							showThreatDetails={ showThreatDetails }
							setShowThreatDetails={ setShowThreatDetails }
						>
							<ThreatNotice fixerState={ fixerState } />
							<ThreatSummary threat={ threat } title={ title } />
							<ThreatFixDetails threat={ threat } handleUpgradeClick={ handleUpgradeClick } />
							<ThreatTechnicalDetails threat={ threat } />
							<ThreatActions
								threat={ threat }
								closeModal={ modalProps.onRequestClose as () => void }
								handleFixThreatClick={ handleFixThreatClick }
								handleIgnoreThreatClick={ handleIgnoreThreatClick }
								handleUnignoreThreatClick={ handleUnignoreThreatClick }
								showThreatDetails={ showThreatDetails }
								setShowThreatDetails={ setShowThreatDetails }
								fixerState={ fixerState }
							/>
						</CredentialsGate>
					</UserConnectionGate>
				</ThreatDetailsGate>
			</div>
		</Modal>
	);
}
