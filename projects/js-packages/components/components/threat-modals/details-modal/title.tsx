import { ThreatsContext } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { useContext } from 'react';
import ThreatSeverityBadge from '../../threat-severity-badge';
import styles from '../styles.module.scss';

const ThreatDetailsModalTitle = () => {
	const { selectedThreat: threat } = useContext( ThreatsContext );

	let title: string;
	switch ( threat.status ) {
		case 'ignored':
			title = __( 'Ignored Threat', 'jetpack-components' );
			break;
		case 'fixed':
			title = __( 'Fixed Threat', 'jetpack-components' );
			break;
		case 'current':
		default:
			title = __( 'Active Threat', 'jetpack-components' );
			break;
	}

	return (
		<div className={ styles[ 'threat-modal__title' ] }>
			{ title }
			{ !! threat.severity && threat.status === 'current' && (
				<ThreatSeverityBadge severity={ threat.severity } showLabel />
			) }
		</div>
	);
};

export default ThreatDetailsModalTitle;
