import { type Threat } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { createContext } from 'react';
import Text from '../text/index.js';
import ThreatSeverityBadge from '../threat-severity-badge/index.js';
import styles from './styles.module.scss';
import ThreatFixConfirmation from './threat-fix-confirmation.js';

interface ThreatModalContextType {
	closeModal: () => void;
	threat: Threat;
	handleUpgradeClick?: () => void;
	userConnectionNeeded: boolean;
	handleConnectUser: () => void;
	userIsConnecting: boolean;
	siteCredentialsNeeded: boolean;
	credentialsIsFetching: boolean;
	credentialsRedirectUrl: string;
	handleFixThreatClick?: ( threats: Threat[] ) => void;
	handleIgnoreThreatClick?: ( threats: Threat[] ) => void;
	handleUnignoreThreatClick?: ( threats: Threat[] ) => void;
}

export const ThreatModalContext = createContext< ThreatModalContextType | null >( null );

/**
 * ThreatModal component
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
 * @return {JSX.Element} The threat modal.
 */
export default function ThreatModal( {
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
} & React.ComponentProps< typeof Modal > ): JSX.Element {
	const userConnectionNeeded = ! isUserConnected || ! hasConnectedOwner;
	const siteCredentialsNeeded = ! credentials || credentials.length === 0;

	return (
		<Modal
			title={
				<div className={ styles.title }>
					<Text variant="title-small">{ threat.title }</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</div>
			}
			size="large"
			{ ...modalProps }
		>
			<div className={ styles[ 'threat-details' ] }>
				<ThreatModalContext.Provider
					value={ {
						closeModal: modalProps.onRequestClose,
						threat,
						handleUpgradeClick,
						userConnectionNeeded,
						handleConnectUser,
						userIsConnecting,
						siteCredentialsNeeded,
						credentialsIsFetching,
						credentialsRedirectUrl,
						handleFixThreatClick,
						handleIgnoreThreatClick,
						handleUnignoreThreatClick,
					} }
				>
					<ThreatFixConfirmation />
				</ThreatModalContext.Provider>
			</div>
		</Modal>
	);
}
