import { _x } from '@wordpress/i18n';

export const SEVERITY_LEVEL_CRITICAL = 'critical';
export const SEVERITY_LEVEL_HIGH = 'high';
export const SEVERITY_LEVEL_LOW = 'low';

export type SeverityLevel =
	| typeof SEVERITY_LEVEL_CRITICAL
	| typeof SEVERITY_LEVEL_HIGH
	| typeof SEVERITY_LEVEL_LOW;

/**
 * Get Severity Level based on CVSS score.
 *
 * @param {number} severity - The severity score, i.e. 5.4.
 *
 * @return {string} The severity type, i.e. SEVERITY_LEVEL_CRITICAL.
 */
export function getSeverityLevel( severity: number ): SeverityLevel {
	if ( severity >= 5 ) {
		return SEVERITY_LEVEL_CRITICAL;
	}

	if ( severity >= 3 && severity < 5 ) {
		return SEVERITY_LEVEL_HIGH;
	}

	return SEVERITY_LEVEL_LOW;
}

/**
 * Get Severity Label based on CVSS score.
 *
 * @param {number} severity - The severity score, i.e. 5.4.
 *
 * @return {string} The severity label, i.e. "Critical".
 */
export function getSeverityLabel( severity: number ): string {
	switch ( getSeverityLevel( severity ) ) {
		case SEVERITY_LEVEL_CRITICAL:
			return _x(
				'Critical',
				'Severity label for threats with CVSS of 5 or greater.',
				'jetpack-scan'
			);
		case SEVERITY_LEVEL_HIGH:
			return _x( 'High', 'Severity label for threats with CVSS between 3 and 5.', 'jetpack-scan' );
		case SEVERITY_LEVEL_LOW:
		default:
			return _x( 'Low', 'Severity label for threats with a CVSS lower than 3.', 'jetpack-scan' );
	}
}
