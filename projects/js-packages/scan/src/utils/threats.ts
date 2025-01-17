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
