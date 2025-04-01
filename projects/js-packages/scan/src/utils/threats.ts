import { __ } from '@wordpress/i18n';
import { Threat } from '../types/threats.js';

export const getThreatType = ( threat: Threat ) => {
	if ( threat.signature === 'Vulnerable.WP.Core' ) {
		return 'core';
	}
	if ( threat.extension ) {
		return threat.extension.type;
	}
	if ( threat.filename ) {
		return 'file';
	}

	return null;
};

export const getThreatIcon = ( threat: Threat ) => {
	switch ( getThreatType( threat ) ) {
		case 'core':
			return 'wordpress-alt';
		case 'plugins':
			return 'plugins';
		case 'themes':
			return 'appearance';
		case 'file':
			return 'media-code';
		default:
			return 'shield-alt';
	}
};

export const getThreatSubtitle = ( threat: Threat ) => {
	switch ( getThreatType( threat ) ) {
		case 'core':
			return __( 'Vulnerable WordPress Version', 'jetpack-scan' );
		case 'plugins':
			return __( 'Vulnerable Plugin', 'jetpack-scan' );
		case 'themes':
			return __( 'Vulnerable Theme', 'jetpack-scan' );
		case 'file':
			return __( 'File Threat', 'jetpack-scan' );
		default:
			return __( 'Threat', 'jetpack-scan' );
	}
};

/**
 * Determines if the threat should be referred to as a "vulnerability" and not a "threat".
 *
 * @param {Threat} threat - The threat to check.
 * @return {boolean} True if the threat should be phrased as a vulnerability, false otherwise.
 */
export const shouldUseVulnerabilityPhrasingForThreat = ( threat: Threat ): boolean => {
	if ( threat.signature ) {
		if (
			threat.signature === 'Vulnerable.WP.Core' ||
			threat.signature === 'Vulnerable.WP.Extension'
		) {
			return true;
		}
	} else if ( [ 'plugins', 'themes', 'core' ].includes( getThreatType( threat ) ) ) {
		return true;
	}

	return false;
};
