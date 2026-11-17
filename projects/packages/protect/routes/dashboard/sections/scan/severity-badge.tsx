import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import type { ComponentProps } from 'react';

/**
 * The severity as a badge: "Critical severity", "High severity" or "Low severity".
 *
 * @param props          - Component props.
 * @param props.severity - The severity, 0 to 10.
 * @return The badge, or null when the threat has no severity.
 */
export default function SeverityBadge( { severity }: { severity?: number | null } ) {
	if ( typeof severity !== 'number' ) {
		return null;
	}
	let intent: ComponentProps< typeof Badge >[ 'intent' ] = 'draft';
	let label: string = __( 'Low severity', 'jetpack-protect-pkg' );
	if ( severity >= 5 ) {
		intent = 'high';
		label = __( 'Critical severity', 'jetpack-protect-pkg' );
	} else if ( severity >= 3 ) {
		intent = 'medium';
		label = __( 'High severity', 'jetpack-protect-pkg' );
	}
	return <Badge intent={ intent }>{ label }</Badge>;
}
