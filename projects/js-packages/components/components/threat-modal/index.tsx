import { type Threat, getFixerState } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState, createContext, useCallback } from 'react';
import Text from '../text';
import ThreatSeverityBadge from '../threat-severity-badge';
import styles from './styles.module.scss';
import ThreatDetailsGate from './threat-details-gate';
import ThreatFixConfirmation from './threat-fix-confirmation';
interface ThreatModalContextType {
	closeModal: () => void;
	showThreatDetails: boolean;
	onShowThreatDetailsClick: () => void;
	onContinueClick: () => void;
}

export const ThreatModalContext = createContext< ThreatModalContextType | null >( null );

/**
 * ThreatModal component
 *
 * @param {object}   props                           - The props.
 * @param {object}   props.threat                    - The threat.
 * @param {boolean}  props.showDetails               - Whether to show the details.
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
	showDetails = true,
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
	showDetails?: boolean;
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
	const userConnectionNeeded = ! isUserConnected || ! hasConnectedOwner;
	const siteCredentialsNeeded = ! credentials || credentials.length === 0;

	const [ showThreatDetails, setShowThreatDetails ] = useState( showDetails );

	const fixerState = useMemo( () => {
		return getFixerState( threat.fixer );
	}, [ threat.fixer ] );

	const getModalTitle = useMemo( () => {
		if ( userConnectionNeeded && ! showThreatDetails ) {
			return <Text variant="title-small">{ __( 'User connection needed', 'jetpack' ) }</Text>;
		}

		if ( siteCredentialsNeeded && ! showThreatDetails ) {
			return <Text variant="title-small">{ __( 'Site credentials needed', 'jetpack' ) }</Text>;
		}

		return (
			<>
				<Text variant="title-small">{ threat.title }</Text>
				{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
			</>
		);
	}, [
		userConnectionNeeded,
		siteCredentialsNeeded,
		showThreatDetails,
		threat.title,
		threat.severity,
	] );

	return (
		<Modal
			title={ <div className={ styles.title }>{ getModalTitle }</div> }
			size="large"
			{ ...modalProps }
		>
			<div className={ styles[ 'threat-details' ] }>
				<ThreatModalContext.Provider
					value={ {
						showThreatDetails,
						closeModal: modalProps.onRequestClose as () => void,
						onShowThreatDetailsClick: useCallback(
							() => setShowThreatDetails( true ),
							[ setShowThreatDetails ]
						),
						onContinueClick: useCallback(
							() => setShowThreatDetails( false ),
							[ setShowThreatDetails ]
						),
					} }
				>
					<ThreatDetailsGate
						threat={ threat }
						fixerState={ fixerState }
						handleUpgradeClick={ handleUpgradeClick }
					>
						<ThreatFixConfirmation
							threat={ threat }
							fixerState={ fixerState }
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
					</ThreatDetailsGate>
				</ThreatModalContext.Provider>
			</div>
		</Modal>
	);
}
