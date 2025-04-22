import { __, sprintf } from '@wordpress/i18n';
import { FIXER_IS_STALE_THRESHOLD } from '../constants/index.ts';
import { type ThreatFixStatus } from '../types/fixers.ts';
import { type Threat } from '../types/threats.ts';

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

export const fixerTimestampIsStale = ( lastUpdatedTimestamp: string ) => {
	const now = new Date();
	const lastUpdated = new Date( lastUpdatedTimestamp );
	return now.getTime() - lastUpdated.getTime() >= FIXER_IS_STALE_THRESHOLD;
};

export const fixerIsInError = ( fixerStatus: ThreatFixStatus ): boolean => {
	return !! ( 'error' in fixerStatus && fixerStatus.error );
};

export const fixerIsInProgress = ( fixerStatus: ThreatFixStatus ): boolean => {
	return !! ( 'status' in fixerStatus && fixerStatus.status === 'in_progress' );
};

export const fixerStatusIsStale = ( fixerStatus: ThreatFixStatus ): boolean => {
	return (
		fixerIsInProgress( fixerStatus ) &&
		'lastUpdated' in fixerStatus &&
		!! fixerTimestampIsStale( fixerStatus.lastUpdated )
	);
};

export const getFixerState = ( fixerStatus: ThreatFixStatus ) => {
	return {
		inProgress: fixerStatus && fixerIsInProgress( fixerStatus ),
		error: fixerStatus && fixerIsInError( fixerStatus ),
		stale: fixerStatus && fixerStatusIsStale( fixerStatus ),
	};
};

export const getFixerAction = ( threat: Threat ) => {
	switch ( threat.fixable && threat.fixable.fixer ) {
		case 'delete':
			return __( 'Delete', 'jetpack-scan' );
		case 'update':
			return __( 'Update', 'jetpack-scan' );
		case 'replace':
		case 'rollback':
			return __( 'Replace', 'jetpack-scan' );
		default:
			return __( 'Auto-fix', 'jetpack-scan' );
	}
};

export const getDetailedFixerAction = ( threat: Threat ) => {
	switch ( threat.fixable && threat.fixable.fixer ) {
		case 'delete':
			if ( threat.filename ) {
				return __( 'Delete file', 'jetpack-scan' );
			}

			if ( threat.extension?.type === 'plugins' ) {
				return __( 'Delete plugin from site', 'jetpack-scan' );
			}

			if ( threat.extension?.type === 'themes' ) {
				return __( 'Delete theme from site', 'jetpack-scan' );
			}
			break;
		case 'update':
			if ( threat.extension?.type === 'plugins' ) {
				return __( 'Update plugin to newer version', 'jetpack-scan' );
			}
			if ( threat.extension?.type === 'themes' ) {
				return __( 'Update theme to newer version', 'jetpack-scan' );
			}
			return __( 'Update', 'jetpack-scan' );
		case 'replace':
		case 'rollback':
			if ( threat.filename ) {
				return __( 'Replace from backup', 'jetpack-scan' );
			}

			if ( threat.signature === 'php_hardening_WP_Config_NoSalts_001' ) {
				return __( 'Replace default salts', 'jetpack-scan' );
			}
			break;
		default:
			return __( 'Auto-fix', 'jetpack-scan' );
	}
};

export const getFixerDescription = ( threat: Threat ) => {
	switch ( threat.fixable && threat.fixable.fixer ) {
		case 'delete':
			if ( threat.filename ) {
				if ( threat.filename.endsWith( '/' ) ) {
					return __( 'Delete the directory that the infected file is in.', 'jetpack-scan' );
				}

				if ( threat.signature === 'Core.File.Modification' ) {
					return __( 'Delete the unexpected file in a core WordPress directory.', 'jetpack-scan' );
				}

				return __( 'Delete the infected file.', 'jetpack-scan' );
			}

			if ( threat.extension?.type === 'plugins' ) {
				return __( 'Delete the plugin directory to fix the threat.', 'jetpack-scan' );
			}

			if ( threat.extension?.type === 'themes' ) {
				return __( 'Delete the theme directory to fix the threat.', 'jetpack-scan' );
			}
			break;
		case 'update':
			if ( threat.fixedIn && threat.extension.name ) {
				return sprintf(
					/* translators: Translates to Updates to version. %1$s: Name. %2$s: Fixed version */
					__( 'Update %1$s to version %2$s', 'jetpack-scan' ),
					threat.extension.name,
					threat.fixedIn
				);
			}
			return __( 'Upgrade the plugin or theme to a newer version.', 'jetpack-scan' );
		case 'replace':
		case 'rollback':
			if ( threat.filename ) {
				return threat.signature === 'Core.File.Modification'
					? __(
							'Replace the modified core WordPress file with the original clean version from the WordPress source code.',
							'jetpack-scan'
					  )
					: __(
							'Replace the infected file with a previously backed up version that is clean.',
							'jetpack-scan'
					  );
			}

			if ( threat.signature === 'php_hardening_WP_Config_NoSalts_001' ) {
				return __(
					'Replace the default salt keys in wp-config.php with unique ones.',
					'jetpack-scan'
				);
			}
			break;
		default:
			return __( 'Jetpack will auto-fix the threat.', 'jetpack-scan' );
	}
};
