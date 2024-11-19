import { Button, ThreatSeverityBadge } from '@automattic/jetpack-components';
import { type Threat, getFixerState } from '@automattic/jetpack-scan';
import { Modal, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import Text from '../text';
import CredentialsGate from './credentials-gate';
import styles from './styles.module.scss';
import ThreatActions from './threat-actions';
import ThreatFixDetails from './threat-fix-details';
import ThreatTechnicalDetails from './threat-technical-details';
import UserConnectionGate from './user-connection-gate';

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

	const fixerState = useMemo( () => {
		return getFixerState( threat.fixer );
	}, [ threat.fixer ] );

	const getModalTitle = useMemo( () => {
		if ( userConnectionNeeded ) {
			return <Text variant="title-small">{ __( 'User connection needed', 'jetpack' ) }</Text>;
		}

		if ( siteCredentialsNeeded ) {
			return <Text variant="title-small">{ __( 'Site credentials needed', 'jetpack' ) }</Text>;
		}

		return (
			<>
				<Text variant="title-small">{ threat.title }</Text>
				{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
			</>
		);
	}, [ userConnectionNeeded, siteCredentialsNeeded, threat.title, threat.severity ] );

	return (
		<Modal
			size="large"
			title={ <div className={ styles.title }>{ getModalTitle }</div> }
			{ ...modalProps }
		>
			<div className={ styles[ 'threat-details' ] }>
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
							{ fixerState.error && (
								<Notice isDismissible={ false } status="error">
									<Text>{ __( 'An error occurred auto-fixing this threat.', 'jetpack' ) }</Text>
								</Notice>
							) }
							{ fixerState.stale && (
								<Notice isDismissible={ false } status="error">
									<Text>{ __( 'The auto-fixer is taking longer than expected.', 'jetpack' ) }</Text>
								</Notice>
							) }
							{ fixerState.inProgress && ! fixerState.stale && (
								<Notice isDismissible={ false } status="success">
									<Text>{ __( 'The auto-fixer is in progress.', 'jetpack' ) }</Text>
								</Notice>
							) }
							<div className={ styles.section }>
								{ !! threat.description && <Text>{ threat.description }</Text> }

								{ !! threat.source && (
									<div>
										<Button
											variant="link"
											isExternalLink={ true }
											weight="regular"
											href={ threat.source }
										>
											{ __( 'See more technical details of this threat', 'jetpack' ) }
										</Button>
									</div>
								) }
							</div>

							<ThreatFixDetails threat={ threat } handleUpgradeClick={ handleUpgradeClick } />

							<ThreatTechnicalDetails threat={ threat } />

							<ThreatActions
								threat={ threat }
								closeModal={ modalProps.onRequestClose }
								handleFixThreatClick={ handleFixThreatClick }
								handleIgnoreThreatClick={ handleIgnoreThreatClick }
								handleUnignoreThreatClick={ handleUnignoreThreatClick }
								fixerState={ fixerState }
							/>
						</>
					</CredentialsGate>
				</UserConnectionGate>
			</div>
		</Modal>
	);
}
