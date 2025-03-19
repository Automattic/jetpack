import { Badge } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { getSeverityLabel, getSeverityVariant } from '@automattic/jetpack-scan';

const ThreatSeverityBadge = ( { severity, showLabel = false } ) => {
	const title = getSeverityLabel( severity );
	const variant = getSeverityVariant( severity );

	return (
		<Badge variant={ variant !== 'info' ? variant : undefined }>
			{ showLabel
				? sprintf(
						// translators: placeholder is the severity title, i.e. "Critical Severity".
						__( '%s Severity', 'jetpack-scan' ),
						title
				  )
				: title }
		</Badge>
	);
};

export default ThreatSeverityBadge;
