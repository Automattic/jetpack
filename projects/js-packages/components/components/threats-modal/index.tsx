import { type Threat } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { createContext } from 'react';
import Text from '../text';
import ThreatSeverityBadge from '../threat-severity-badge';
import styles from './styles.module.scss';
import ThreatFixConfirmation from './threat-fix-confirmation';

interface ThreatModalContextType {
	closeModal: () => void;
	currentThreats: Threat[];
	isBulk: boolean;
	actionToConfirm: string | null;
	isSupportedEnvironment: boolean;
	userConnectionNeeded: boolean;
	handleConnectUser: () => void;
	userIsConnecting: boolean;
	siteCredentialsNeeded: boolean;
	credentialsIsFetching: boolean;
	credentialsRedirectUrl: string;
	handleUpgradeClick?: () => void;
	handleFixThreatClick?: ( threats: Threat[] ) => void;
	handleIgnoreThreatClick?: ( threats: Threat[] ) => void;
	handleUnignoreThreatClick?: ( threats: Threat[] ) => void;
}

export const ThreatsModalContext = createContext< ThreatModalContextType | null >( null );

/**
 * ThreatsModal component
 *
 * @param {object}       props                           - The props.
 * @param {Threat[]}     props.currentThreats            - The fixable threats.
 * @param {boolean|null} props.actionToConfirm           - The action to confirm.
 * @param {boolean}      props.isSupportedEnvironment    - Whether the environment is supported.
 * @param {boolean}      props.isUserConnected           - Whether the user is connected.
 * @param {boolean}      props.hasConnectedOwner         - Whether the user has a connected owner.
 * @param {boolean}      props.userIsConnecting          - Whether the user is connecting.
 * @param {Function}     props.handleConnectUser         - The handleConnectUser function.
 * @param {object}       props.credentials               - The credentials.
 * @param {boolean}      props.credentialsIsFetching     - Whether the credentials are fetching.
 * @param {string}       props.credentialsRedirectUrl    - The credentials redirect URL.
 * @param {Function}     props.handleUpgradeClick        - The handleUpgradeClick function.
 * @param {Function}     props.handleFixThreatClick      - The handleFixThreatClick function.
 * @param {Function}     props.handleIgnoreThreatClick   - The handleIgnoreThreatClick function.
 * @param {Function}     props.handleUnignoreThreatClick - The handleUnignoreThreatClick function.
 *
 * @return {JSX.Element} The threats modal.
 */
export default function ThreatsModal( {
	currentThreats,
	actionToConfirm,
	isSupportedEnvironment,
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
	currentThreats: Threat[];
	actionToConfirm: string | null;
	isSupportedEnvironment: boolean;
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
	const isBulk = currentThreats.length > 1;

	return (
		<Modal
			title={
				<div className={ styles.title }>
					{ isBulk ? (
						<Text variant="title-small">{ 'Fix all threats' }</Text>
					) : (
						<div className={ styles.title }>
							<Text variant="title-small">{ currentThreats[ 0 ].title }</Text>
							{ !! currentThreats[ 0 ].severity && (
								<ThreatSeverityBadge severity={ currentThreats[ 0 ].severity } />
							) }
						</div>
					) }
				</div>
			}
			size="large"
			{ ...modalProps }
		>
			<div className={ styles[ 'threat-details' ] }>
				<ThreatsModalContext.Provider
					value={ {
						closeModal: modalProps.onRequestClose,
						currentThreats,
						isBulk,
						actionToConfirm,
						isSupportedEnvironment,
						userConnectionNeeded,
						handleConnectUser,
						userIsConnecting,
						siteCredentialsNeeded,
						credentialsIsFetching,
						credentialsRedirectUrl,
						handleUpgradeClick,
						handleFixThreatClick,
						handleIgnoreThreatClick,
						handleUnignoreThreatClick,
					} }
				>
					<ThreatFixConfirmation />
				</ThreatsModalContext.Provider>
			</div>
		</Modal>
	);
}
