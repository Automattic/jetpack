import { _x } from '@wordpress/i18n';
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
	if ( severity >= 5 ) {
		return _x( 'Critical', 'Severity label for issues rated 5 or higher.', 'jetpack' );
	} else if ( severity >= 3 && severity < 5 ) {
		return _x( 'High', 'Severity label for issues rated between 3 and 5.', 'jetpack' );
	}
	return _x( 'Low', 'Severity label for issues rated below 3.', 'jetpack' );
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
