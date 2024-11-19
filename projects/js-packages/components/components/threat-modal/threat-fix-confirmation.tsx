import { type Threat } from '@automattic/jetpack-scan';
import CredentialsGate from './credentials-gate';
import ThreatActions from './threat-actions';
import ThreatFixDetails from './threat-fix-details';
import ThreatNotice from './threat-notice';
import ThreatSummary from './threat-summary';
import UserConnectionGate from './user-connection-gate';

const ThreatFixConfirmation = ( {
	threat,
	fixerState,
	userConnectionNeeded,
	userIsConnecting,
	handleConnectUser,
	siteCredentialsNeeded,
	credentialsIsFetching,
	credentialsRedirectUrl,
	handleFixThreatClick,
	handleIgnoreThreatClick,
	handleUnignoreThreatClick,
}: {
	threat: Threat;
	fixerState: { inProgress: boolean; error: boolean; stale: boolean };
	userConnectionNeeded: boolean;
	userIsConnecting: boolean;
	handleConnectUser: () => void;
	siteCredentialsNeeded: boolean;
	credentialsIsFetching: boolean;
	credentialsRedirectUrl: string;
	handleFixThreatClick?: ( threats: Threat[] ) => void;
	handleIgnoreThreatClick?: ( threats: Threat[] ) => void;
	handleUnignoreThreatClick?: ( threats: Threat[] ) => void;
} ) => {
	return (
		<UserConnectionGate
			userConnectionNeeded={ userConnectionNeeded }
			userIsConnecting={ userIsConnecting }
			handleConnectUser={ handleConnectUser }
		>
			<CredentialsGate
				siteCredentialsNeeded={ siteCredentialsNeeded }
				credentialsIsFetching={ credentialsIsFetching }
				credentialsRedirectUrl={ credentialsRedirectUrl }
			>
				<>
					{ /* TODO: Determine what we want to display here */ }
					<ThreatNotice fixerState={ fixerState } />
					<ThreatSummary threat={ threat } />
					<ThreatFixDetails threat={ threat } />
					<ThreatActions
						threat={ threat }
						fixerState={ fixerState }
						handleFixThreatClick={ handleFixThreatClick }
						handleIgnoreThreatClick={ handleIgnoreThreatClick }
						handleUnignoreThreatClick={ handleUnignoreThreatClick }
					/>
				</>
			</CredentialsGate>
		</UserConnectionGate>
	);
};

export default ThreatFixConfirmation;
