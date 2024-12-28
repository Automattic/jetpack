import { __, _x, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import Badge from '../badge';

const ThreatSeverityBadge = ( { severity, inline = false } ) => {
	const { label, variant } = useMemo( () => {
		if ( severity >= 5 ) {
			return {
				variant: 'danger' as const,
				label: _x(
					'Critical',
					'Severity label for issues rated 5 or higher.',
					'jetpack-components'
				),
			};
		}

		if ( severity >= 3 && severity < 5 ) {
			return {
				variant: 'warning' as const,
				label: _x(
					'High',
					'Severity label for issues rated between 3 and 5.',
					'jetpack-components'
				),
			};
		}

		return {
			variant: undefined,
			label: _x( 'Low', 'Severity label for issues rated below 3.', 'jetpack-components' ),
		};
	}, [ severity ] );

	if ( inline ) {
		return sprintf(
			/** translators: placeholder is the threat severity label, i.e. "Critical", "High", or "Low". */
			__( 'Severity: %s', 'jetpack-components' ),
			label,
			0 /** prevent bad minification */
		);
	}

	return <Badge variant={ variant }>{ label }</Badge>;
};

export default ThreatSeverityBadge;
