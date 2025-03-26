import { Badge } from '@automattic/jetpack-components';
import { _x } from '@wordpress/i18n';

const ThreatSeverityBadge = ( { severity } ) => {
	if ( severity >= 5 ) {
		return (
			<Badge variant="danger">
				{ _x( 'Critical', 'Severity label for issues rated 5 or higher.', 'jetpack-scan' ) }
			</Badge>
		);
	}

	if ( severity >= 3 && severity < 5 ) {
		return (
			<Badge variant="warning">
				{ _x( 'High', 'Severity label for issues rated between 3 and 5.', 'jetpack-scan' ) }
			</Badge>
		);
	}

	return <Badge>{ _x( 'Low', 'Severity label for issues rated below 3.', 'jetpack-scan' ) }</Badge>;
};

export default ThreatSeverityBadge;
