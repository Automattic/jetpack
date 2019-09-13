<?php

if ( ! class_exists( 'WP_CLI' ) ) {
	return;
}

/**
 * Public methods of this class which are not marked as "Not a WP CLI command"
 * are WP CLI commands which can be used to perform actions on an AT site.
 *
 *
 * Class WPCOMSH_CLI_Commands
 */
class WPCOMSH_CLI_Commands extends WP_CLI_Command {
}

WP_CLI::add_command( 'wpcomsh', 'WPCOMSH_CLI_Commands' );
