import { __, _n, sprintf } from '@wordpress/i18n';

export const getVulnerableCoreMessage = ( version?: string ) => {
	if ( version ) {
		return sprintf(
			// translators: placeholder is the WordPress version number (example: 6.3)
			__( 'The installed version of WordPress (%s) has a known vulnerability.', 'jetpack-scan' ),
			version
		);
	}

	return __( 'The installed version of WordPress has a known vulnerability.', 'jetpack-scan' );
};

export const getCompromisedCoreFileMessage = ( file: string ) => {
	return sprintf(
		// translators: placeholder is the compromised file name (example: wp-login.php)
		__( 'Compromised WordPress core file: %s', 'jetpack-scan' ),
		file
	);
};

export const getCompromisedFileMessage = ( file: string ) => {
	return sprintf(
		// translators: placeholder is the compromised file name (example: functions.php)
		__( 'Malicious code found in file: %s', 'jetpack-scan' ),
		file
	);
};

export const getVulnerablePluginMessage = ( pluginSlug: string, pluginVersion: string ) => {
	return sprintf(
		// translators: placeholders are the plugin name (example: Jetpack) and version number (example: 6.3)
		__( 'Vulnerable Plugin: %(pluginSlug)s (version %(version)s)', 'jetpack-scan' ),
		pluginSlug,
		pluginVersion
	);
};

export const getVulnerableThemeMessage = ( themeSlug: string, themeVersion: string ) => {
	return sprintf(
		// translators: placeholders are the theme name (example: Jetpack) and version number (example: 6.3)
		__( 'Vulnerable Theme: %(themeSlug)s (version %(version)s)', 'jetpack-scan' ),
		themeSlug,
		themeVersion
	);
};

export const getDatabaseThreatMessage = ( rows: string, table: string ) => {
	if ( ! rows || ! table ) {
		return __( 'Database threat', 'jetpack-scan' );
	}
	return sprintf(
		// translators: placeholders are the number of rows affected and the table name (example: 1 row affected on table wp_users)
		_n(
			'Database threat on table %1$s affecting %2$s row',
			'Database threat on %1$s affecting %2$s rows',
			parseInt( rows ),
			'jetpack-scan'
		),
		table,
		rows
	);
};
