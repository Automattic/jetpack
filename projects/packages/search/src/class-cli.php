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
	 * wp jetpack-search auto_config --force
	 *
	 * @param array $args Positional args.
	 * @param array $assoc_args Named args.
	 */
	public function auto_config( $args, $assoc_args ) {
		try {
			$is_force_run = ! empty( $assoc_args['force'] );
			if ( ! $is_force_run && get_option( Options::OPTION_PREFIX . 'result_format' ) !== false ) {
				WP_CLI::error( 'Jetpack Search: auto config has run already. You could add option `--force` to force run.' );
			}
			$blog_id = ( defined( 'IS_WPCOM' ) && constant( 'IS_WPCOM' ) ) ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
			Instant_Search::initialize( $blog_id );
			Instant_Search::instance()->auto_config_search_no_pri();
			WP_CLI::line( 'Jetpack Search: auto config success!' );
		} catch ( \Exception $e ) {
			WP_CLI::error( $e->getMessage() );
		}
	}
}
