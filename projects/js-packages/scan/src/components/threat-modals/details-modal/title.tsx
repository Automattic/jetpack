import { __ } from '@wordpress/i18n';
import { shouldUseVulnerabilityPhrasingForThreat, Threat } from '@automattic/jetpack-scan';
import ThreatSeverityBadge from '../../threat-severity-badge/index.js';
import styles from '../styles.module.scss';

/**
 * ThreatDetailsModalTitle component
 *
 * @param {object} props        - The component props.
 * @param {Threat} props.threat - The threat to display.
 *
 * @return {JSX.Element} The rendered threat details modal title.
 */
const ThreatDetailsModalTitle = ( { threat }: { threat: Threat } ): JSX.Element => {
	const useVulnerabilityPhrasing = shouldUseVulnerabilityPhrasingForThreat( threat );

	let title: string;
	switch ( threat.status ) {
		case 'ignored':
			title = useVulnerabilityPhrasing
				? __( 'Ignored Vulnerability', 'jetpack-scan' )
				: __( 'Ignored Threat', 'jetpack-scan' );
			break;
		case 'fixed':
			title = useVulnerabilityPhrasing
				? __( 'Fixed Vulnerability', 'jetpack-scan' )
				: __( 'Fixed Threat', 'jetpack-scan' );
			break;
		case 'current':
		default:
			title = useVulnerabilityPhrasing
				? __( 'Active Vulnerability', 'jetpack-scan' )
				: __( 'Active Threat', 'jetpack-scan' );
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
