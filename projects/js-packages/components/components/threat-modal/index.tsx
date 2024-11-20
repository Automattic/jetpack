import { type Threat, getFixerState } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { useMemo, createContext } from 'react';
import Text from '../text';
import ThreatSeverityBadge from '../threat-severity-badge';
import styles from './styles.module.scss';
import ThreatFixConfirmation from './threat-fix-confirmation';
interface ThreatModalContextType {
	closeModal: () => void;
	actionToConfirm: string | null;
	setActionToConfirm: ( action: string ) => void;
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
 * @param {string}   props.actionToConfirm           - The action to confirm.
 * @param {Function} props.setActionToConfirm        - The setActionToConfirm function.
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
	actionToConfirm,
	setActionToConfirm,
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
	actionToConfirm: string | null;
	setActionToConfirm: ( action: string ) => void;
} & React.ComponentProps< typeof Modal > ): JSX.Element {
	const userConnectionNeeded = ! isUserConnected || ! hasConnectedOwner;
	const siteCredentialsNeeded = ! credentials || credentials.length === 0;

	const fixerState = useMemo( () => {
		return getFixerState( threat.fixer );
	}, [ threat.fixer ] );

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
						actionToConfirm,
						setActionToConfirm,
					} }
				>
					<ThreatFixConfirmation
						threat={ threat }
						fixerState={ fixerState }
						handleUpgradeClick={ handleUpgradeClick }
						userConnectionNeeded={ userConnectionNeeded }
						userIsConnecting={ userIsConnecting }
						handleConnectUser={ handleConnectUser }
						siteCredentialsNeeded={ siteCredentialsNeeded }
						credentialsIsFetching={ credentialsIsFetching }
						credentialsRedirectUrl={ credentialsRedirectUrl }
						handleFixThreatClick={ handleFixThreatClick }
						handleIgnoreThreatClick={ handleIgnoreThreatClick }
						handleUnignoreThreatClick={ handleUnignoreThreatClick }
					/>
				</ThreatModalContext.Provider>
			</div>
		</Modal>
	);
}
