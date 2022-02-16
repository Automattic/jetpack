<?php
/**
 * CLI class exposed by WPCLI
 *
 * @package    automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use \WP_CLI;
use \WP_CLI_Command;

/**
 * Provide functionality by WPCLI.
 */
class CLI extends WP_CLI_Command {
	/**
	 * Auto config instant search, including set result format, set up overlay widgets and add a search input to the home page thru widgets or blocks.
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack-search auto_config
	 */
	public function auto_config() {
		try {
			// Some functions requires admin capabilities to run.
			$this->set_admin_user();
			$blog_id = Helper::get_wpcom_site_id();
			Instant_Search::instance( $blog_id )->auto_config_search();
			WP_CLI::line( 'Jetpack Search: auto config success!' );
		} catch ( \Exception $e ) {
			WP_CLI::error( $e->getMessage() );
		}
	}

	/**
	 * Choose a admin user and set it.
	 */
	protected function set_admin_user() {
		$user = get_user_by( 'ID', 1 );
		if ( user_can( $user, 'administrator' ) ) {
			wp_set_current_user( 1 );
			return;
		}

		$users = get_users();
		foreach ( $users as $user ) {
			if ( user_can( $user, 'administrator' ) ) {
				wp_set_current_user( $user->ID );
				return;
			}
		}
	}
}
