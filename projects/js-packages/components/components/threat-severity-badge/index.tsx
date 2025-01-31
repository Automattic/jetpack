import { getSeverityLabel, getSeverityVariant } from '@automattic/jetpack-scan';
import { __, sprintf } from '@wordpress/i18n';
import Badge from '../badge/index.js';

const ThreatSeverityBadge = ( { severity, showLabel = false } ) => {
	const title = getSeverityLabel( severity );
	const variant = getSeverityVariant( severity );

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
