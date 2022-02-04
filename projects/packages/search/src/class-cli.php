<?php
/**
 * CLI class exposed by WPCLI
 *
 * @package    automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use \Jetpack_Options;
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
			$blog_id = ( defined( 'IS_WPCOM' ) && constant( 'IS_WPCOM' ) ) ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
			Instant_Search::initialize( $blog_id );
			Instant_Search::instance()->auto_config_search();
			WP_CLI::line( 'Jetpack Search: auto config success!' );
		} catch ( \Exception $e ) {
			WP_CLI::error( $e->getMessage() );
		}
	}
}
