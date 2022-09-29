import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

const severityClassNames = severity => {
	if ( severity >= 5 ) {
		return 'is-critical';
	} else if ( severity >= 3 && severity < 5 ) {
		return 'is-high';
	}
	return 'is-low';
};

const severityText = severity => {
	const critical = __( 'Critical', 'jetpack-protect' );
	const high = __( 'High', 'jetpack-protect' );
	const low = __( 'Low', 'jetpack-protect' );

	if ( severity >= 5 ) {
		return critical;
	} else if ( severity >= 3 && severity < 5 ) {
		return high;
	}
	return low;
};

const ThreatSeverityBadge = ( { severity } ) => {
	return (
		<div
			className={ `${ styles[ 'threat-severity-badge' ] } ${
				styles[ severityClassNames( severity ) ]
			}` }
		>
			{ severityText( severity ) }
		</div>
	);
};

export default ThreatSeverityBadge;
