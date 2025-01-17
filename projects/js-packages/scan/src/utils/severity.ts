import { _x } from '@wordpress/i18n';

/**
 * Get Severity Label based on CVSS score.
 *
 * @param {number} severity - The severity score, i.e. 5.4.
 *
 * @return {string} The severity label, i.e. "Critical".
 */
export function getSeverityLabel( severity: number ) {
	if ( severity >= 5 ) {
		return _x(
			'Critical',
			'Severity label for threats with CVSS of 5 or greater.',
			'jetpack-scan'
		);
	}

	if ( severity >= 3 && severity < 5 ) {
		return _x( 'High', 'Severity label for threats with CVSS between 3 and 5.', 'jetpack-scan' );
	}

	return _x( 'Low', 'Severity label for threats with a CVSS lower than 3.', 'jetpack-scan' );
}

/**
 * Get Severity Variant based on CVSS score.
 *
 * @param {number} severity - The severity score, i.e. 5.4.
 * @return {string} The severity variant, i.e. "danger".
 */
export function getSeverityVariant( severity: number ): 'danger' | 'warning' | 'info' {
	if ( severity >= 5 ) {
		return 'danger';
	}

	if ( severity >= 3 && severity < 5 ) {
		return 'warning';
	}

	return 'info';
}
