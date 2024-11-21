import { type Threat } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { useContext } from 'react';
import ThreatActions from './threat-actions';
import ThreatFixDetails from './threat-fix-details';
import ThreatIgnoreDetails from './threat-ignore-details';
import ThreatNotice from './threat-notice';
import ThreatSummary from './threat-summary';
import ThreatTechnicalDetails from './threat-technical-details';
import { ThreatModalContext } from '.';

const ThreatFixConfirmation = ( {
	threat,
	fixerState,
	handleUpgradeClick,
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
	handleUpgradeClick: () => void;
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
	const { actionToConfirm } = useContext( ThreatModalContext );

	return (
		<>
			<ThreatSummary threat={ threat } />
			<ThreatTechnicalDetails threat={ threat } />
			<ThreatFixDetails threat={ threat } handleUpgradeClick={ handleUpgradeClick } />
			{ actionToConfirm === 'all' && <ThreatIgnoreDetails /> }
			{ siteCredentialsNeeded && userConnectionNeeded && (
				<ThreatNotice
					title={ 'Additional connections needed' }
					content={ __(
						'A user connection and server credentials provide Jetpack the access necessary to ignore and auto-fix threats on your site.',
						'jetpack'
					) }
					handleConnectUser={ handleConnectUser }
					userIsConnecting={ userIsConnecting }
					credentialsRedirectUrl={ credentialsRedirectUrl }
					credentialsIsFetching={ credentialsIsFetching }
				/>
			) }
			{ ! siteCredentialsNeeded && userConnectionNeeded && (
				<ThreatNotice
					title={ __( 'User connection needed', 'jetpack' ) }
					content={ __(
						'A user connection provides Jetpack the access necessary to ignore and auto-fix threats on your site.',
						'jetpack'
					) }
					handleConnectUser={ handleConnectUser }
					userIsConnecting={ userIsConnecting }
				/>
			) }
			{ siteCredentialsNeeded && ! userConnectionNeeded && (
				<ThreatNotice
					title={ __( 'Site credentials needed', 'jetpack' ) }
					content={ __(
						'Your server credentials allow Jetpack to access the server that’s powering your website. This information is securely saved and only used to ignore and auto-fix threats detected on your site.',
						'jetpack'
					) }
					credentialsIsFetching={ credentialsIsFetching }
					credentialsRedirectUrl={ credentialsRedirectUrl }
				/>
			) }
			<ThreatActions
				threat={ threat }
				fixerState={ fixerState }
				disabled={ siteCredentialsNeeded || userConnectionNeeded }
				handleFixThreatClick={ handleFixThreatClick }
				handleIgnoreThreatClick={ handleIgnoreThreatClick }
				handleUnignoreThreatClick={ handleUnignoreThreatClick }
			/>
		</>
	);
};

export default ThreatFixConfirmation;
