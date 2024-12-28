import { type Threat } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { createContext } from 'react';
import Text from '../text';
import ThreatSeverityBadge from '../threat-severity-badge';
import styles from './styles.module.scss';
import ThreatFixConfirmation from './threat-fix-confirmation';

interface ThreatModalContextType {
	closeModal: () => void;
	threat: Threat;
	connection: {
		isUserConnected?: boolean;
		hasConnectedOwner?: boolean;
		userIsConnecting?: boolean;
		onConnectUser?: () => void;
	};
	credentials?: {
		hasCredentials?: boolean;
		isFetching?: boolean;
		redirectUrl?: string;
	};
	onUpgrade?: () => void;
	actions?: {
		upgrade?: () => void;
		connectUser: () => void;
		fixThreat?: ( threats: Threat[] ) => void;
		ignoreThreat?: ( threats: Threat[] ) => void;
		unignoreThreat?: ( threats: Threat[] ) => void;
	};
}

export const ThreatModalContext = createContext< ThreatModalContextType | null >( null );

/**
 * ThreatModal component
 *
 * @param {object}   props             - The props.
 * @param {object}   props.threat      - The threat.
 * @param {object}   props.connection  - The connection.
 * @param {object}   props.credentials - The credentials.
 * @param {Function} props.onUpgrade   - The onUpgrade function.
 *
 * @return {JSX.Element} The threat modal.
 */
export default function ThreatModal( {
	threat,
	connection,
	credentials,
	onUpgrade,
	...modalProps
}: {
	threat: Threat;
	connection: ThreatModalContextType[ 'connection' ];
	credentials: ThreatModalContextType[ 'credentials' ];
	onUpgrade: ThreatModalContextType[ 'onUpgrade' ];
} & React.ComponentProps< typeof Modal > ): JSX.Element {
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
						connection,
						credentials,
						onUpgrade,
					} }
				>
					<ThreatFixConfirmation />
				</ThreatModalContext.Provider>
			</div>
		</Modal>
	);
}
