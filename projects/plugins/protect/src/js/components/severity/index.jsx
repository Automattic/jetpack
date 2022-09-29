import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

const severityClassNames = severity => {
	if ( severity >= 5 ) {
		return 'is-critical';
	}

	if ( severity >= 3 ) {
		return 'is-high';
	}

	return 'is-low';
};

const severityText = severity => {
	if ( severity >= 5 ) {
		return __( 'Critical', 'jetpack-protect' );
	}

	if ( severity >= 3 ) {
		return __( 'High', 'jetpack-protect' );
	}

	return __( 'Low', 'jetpack-protect' );
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
