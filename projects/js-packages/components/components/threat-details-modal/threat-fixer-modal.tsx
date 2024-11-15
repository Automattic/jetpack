import { type Threat } from '@automattic/jetpack-scan';
import CredentialsGate from './credentials-gate';
import ThreatActions from './threat-actions';
import ThreatFixDetails from './threat-fix-details';
import ThreatNotice from './threat-notice';
import ThreatSummary from './threat-summary';
import ThreatTechnicalDetails from './threat-technical-details';
import UserConnectionGate from './user-connection-gate';

const ThreatFixerModal = ( {
	title,
	threat,
	isUserConnected,
	hasConnectedOwner,
	userIsConnecting,
	handleConnectUser,
	credentials,
	credentialsIsFetching,
	credentialsRedirectUrl,
	fixerState,
	handleUpgradeClick,
	handleFixThreatClick,
	handleIgnoreThreatClick,
	handleUnignoreThreatClick,
}: {
	title: string;
	threat: Threat;
	isUserConnected: boolean;
	hasConnectedOwner: boolean;
	userIsConnecting: boolean;
	handleConnectUser: () => void;
	credentials: false | Record< string, unknown >[];
	credentialsIsFetching: boolean;
	credentialsRedirectUrl: string;
	fixerState: { inProgress: boolean; error: boolean; stale: boolean };
	handleUpgradeClick: () => void;
	handleFixThreatClick?: ( threats: Threat[] ) => void;
	handleIgnoreThreatClick?: ( threats: Threat[] ) => void;
	handleUnignoreThreatClick?: ( threats: Threat[] ) => void;
} ) => {
	return (
		<UserConnectionGate
			isUserConnected={ isUserConnected }
			hasConnectedOwner={ hasConnectedOwner }
			userIsConnecting={ userIsConnecting }
			handleConnectUser={ handleConnectUser }
		>
			<CredentialsGate
				credentials={ credentials }
				credentialsIsFetching={ credentialsIsFetching }
				credentialsRedirectUrl={ credentialsRedirectUrl }
			>
				<ThreatNotice fixerState={ fixerState } />
				<ThreatSummary threat={ threat } title={ title } />
				<ThreatFixDetails threat={ threat } handleUpgradeClick={ handleUpgradeClick } />
				<ThreatTechnicalDetails threat={ threat } />
				<ThreatActions
					threat={ threat }
					handleFixThreatClick={ handleFixThreatClick }
					handleIgnoreThreatClick={ handleIgnoreThreatClick }
					handleUnignoreThreatClick={ handleUnignoreThreatClick }
					fixerState={ fixerState }
				/>
			</CredentialsGate>
		</UserConnectionGate>
	);
};

export default ThreatFixerModal;
