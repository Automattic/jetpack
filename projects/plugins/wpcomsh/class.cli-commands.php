<?php

if ( ! class_exists( 'WP_CLI' ) ) {
	return;
}

/**
 *  Force WordPress to always output English at the command line.
 */
WP_CLI::add_wp_hook( 'pre_option_WPLANG', function() {
    return 'en_US';
});

/**
 * Public methods of this class which are not marked as "Not a WP CLI command"
 * are WP CLI commands which can be used to perform actions on an AT site.
 *
 *
 * Class WPCOMSH_CLI_Commands
 */
class WPCOMSH_CLI_Commands extends WP_CLI_Command {
}
/*
 * This works just like plugin verify-checksums except it filters language translation files.
 * Language files are not part of WordPress.org's checksums so they are listed as added and
 * they obfuscate the output. This makes it hard to spot actual checksum verification errors.
 */
class Checksum_Plugin_Command_WPCOMSH extends Checksum_Plugin_Command {
	protected function filter_file( $filepath ) {
		return ! preg_match( '#^(languages/)?[a-z0-9-]+-[a-z]{2}_[A-Z]{2}(_[a-z]+)?([.](mo|po)|-[a-f0-9]{32}[.]json)$#', $filepath );
	}
}

WP_CLI::add_command( 'wpcomsh', 'WPCOMSH_CLI_Commands' );
WP_CLI::add_command( 'wpcomsh plugin verify-checksums', 'Checksum_Plugin_Command_WPCOMSH' );
