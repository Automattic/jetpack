import { type Threat, getFixerState } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, createContext } from 'react';
import styles from './styles.module.scss';
import ThreatDetailsGate from './threat-details-gate';
import ThreatFixConfirmation from './threat-fix-confirmation';

interface ThreatModalContextType {
	closeModal: () => void;
	showThreatDetails: boolean;
	onShowThreatDetailsClick: () => void;
	onHideThreatDetailsClick: () => void;
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
 * @param {boolean}  props.showThreatDetails         - Whether the threat details are shown.
 * @param {Function} props.onShowThreatDetailsClick  - The onShowThreatDetailsClick function.
 * @param {Function} props.onHideThreatDetailsClick  - The onHideThreatDetailsClick function.
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
	showThreatDetails,
	onShowThreatDetailsClick,
	onHideThreatDetailsClick,
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
	showThreatDetails: boolean;
	onShowThreatDetailsClick: () => void;
	onHideThreatDetailsClick: () => void;
	[ key: string ]: unknown;
} ): JSX.Element {
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
				<ThreatModalContext.Provider
					value={ {
						closeModal: modalProps.onRequestClose as () => void,
						showThreatDetails,
						onShowThreatDetailsClick,
						onHideThreatDetailsClick,
					} }
				>
					<ThreatDetailsGate
						title={ title }
						threat={ threat }
						fixerState={ fixerState }
						handleUpgradeClick={ handleUpgradeClick }
					>
						<ThreatFixConfirmation
							title={ title }
							threat={ threat }
							fixerState={ fixerState }
							isUserConnected={ isUserConnected }
							hasConnectedOwner={ hasConnectedOwner }
							userIsConnecting={ userIsConnecting }
							handleConnectUser={ handleConnectUser }
							credentials={ credentials }
							credentialsIsFetching={ credentialsIsFetching }
							credentialsRedirectUrl={ credentialsRedirectUrl }
							handleFixThreatClick={ handleFixThreatClick }
							handleIgnoreThreatClick={ handleIgnoreThreatClick }
							handleUnignoreThreatClick={ handleUnignoreThreatClick }
						/>
					</ThreatDetailsGate>
				</ThreatModalContext.Provider>
			</div>
		</Modal>
	);
}
