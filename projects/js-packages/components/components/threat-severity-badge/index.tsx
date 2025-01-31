import {
	getSeverityLabel,
	getSeverityLevel,
	SEVERITY_LEVEL_CRITICAL,
	SEVERITY_LEVEL_HIGH,
	SEVERITY_LEVEL_LOW,
} from '@automattic/jetpack-scan';
import { __, sprintf } from '@wordpress/i18n';
import Badge from '../badge';

const ThreatSeverityBadge = ( { severity, showLabel = false } ) => {
	const title = getSeverityLabel( severity );

	let variant: 'danger' | 'warning';
	switch ( getSeverityLevel( severity ) ) {
		case SEVERITY_LEVEL_CRITICAL:
			variant = 'danger';
			break;
		case SEVERITY_LEVEL_HIGH:
			variant = 'warning';
			break;
		case SEVERITY_LEVEL_LOW:
		default:
			// Default variant.
			break;
	}

	return (
		<Badge variant={ variant }>
			{ showLabel
				? sprintf(
						// translators: placeholder is the severity title, i.e. "Critical Severity".
						__( '%s Severity', 'jetpack-components' ),
						title
				  )
				: title }
		</Badge>
	);
};

export default ThreatSeverityBadge;
