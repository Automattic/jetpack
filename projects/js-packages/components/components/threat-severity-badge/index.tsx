import { _x } from '@wordpress/i18n';
import Badge from '../badge';

const ThreatSeverityBadge = ( { severity } ) => {
	if ( severity >= 5 ) {
		return (
			<Badge variant="danger">
				{ _x( 'Critical', 'Severity label for issues rated 5 or higher.', 'jetpack' ) }
			</Badge>
		);
	}

	if ( severity >= 3 && severity < 5 ) {
		return (
			<Badge variant="warning">
				{ _x( 'High', 'Severity label for issues rated between 3 and 5.', 'jetpack' ) }
			</Badge>
		);
	}

	return <Badge>{ _x( 'Low', 'Severity label for issues rated below 3.', 'jetpack' ) }</Badge>;
};

export default ThreatSeverityBadge;
