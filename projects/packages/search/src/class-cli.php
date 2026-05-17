<?php
/**
 * CLI class exposed by WPCLI
 *
 * @package    automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use WP_CLI;
use WP_CLI_Command;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( 'WP_CLI_Command' ) ) {
	return;
}

/**
 * Provide functionality by WPCLI.
 */
class CLI extends WP_CLI_Command {
	/**
	 * Auto config instant search, including set result format, set up overlay widgets and add a search input to the home page thru widgets or blocks.
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack-search auto_config user_login
	 *
	 * wp jetpack-search auto_config user_id
	 *
	 * @param array $args - Args passsed in.
	 */
	public function auto_config( $args ) {
		try {
			if ( empty( $args ) ) {
				WP_CLI::error( 'A user login or ID is required.' );
			}

			// Some functions may require admin capabilities to run.
			$ret = $this->set_user( $args[0] );
			if ( is_wp_error( $ret ) ) {
				WP_CLI::error( $ret->get_error_message() );
			}

			WP_CLI::line( 'Running as user ' . $ret->user_login . '…' );
			$blog_id = Helper::get_wpcom_site_id();
			Instant_Search::instance( $blog_id )->auto_config_search();
			WP_CLI::success( 'Auto config success!' );
		} catch ( \Exception $e ) {
			WP_CLI::error( $e->getMessage() );
		}
	}

	/**
	 * Backfill the reserved-slot taxonomy projection for any user-facing
	 * taxonomies declared in `jetpack_search_custom_taxonomy_map`.
	 *
	 * Wraps `Custom_Taxonomy_Slot_Mapping::backfill()` so operators don't have
	 * to reach for `wp eval` and a fully-qualified static call. The auto-mirror
	 * on `set_object_terms` / `deleted_term_relationships` / `delete_term`
	 * keeps the slot in sync from the moment the mapping is declared — this
	 * subcommand only needs to run once after the mapping is first turned on,
	 * or after a gap during which the auto-mirror was inactive.
	 *
	 * ## OPTIONS
	 *
	 * [--mode=<mode>]
	 * : Backfill mode.
	 * ---
	 * default: mirror
	 * options:
	 *   - mirror
	 *   - rebuild
	 * ---
	 *
	 * ## EXAMPLES
	 *
	 *     # Per-post mirror — cheap, idempotent, safe to re-run.
	 *     wp jetpack-search backfill_taxonomy_slot_mapping
	 *
	 *     # Full sweep — wipes the slot taxonomy first, then re-projects.
	 *     wp jetpack-search backfill_taxonomy_slot_mapping --mode=rebuild
	 *
	 * @param array $args       Positional args (unused).
	 * @param array $assoc_args Associative args. Supports `mode`.
	 */
	public function backfill_taxonomy_slot_mapping( $args, $assoc_args ) {
		$mode = isset( $assoc_args['mode'] ) ? (string) $assoc_args['mode'] : 'mirror';
		if ( ! in_array( $mode, Custom_Taxonomy_Slot_Mapping::BACKFILL_MODES, true ) ) {
			WP_CLI::error( sprintf( 'Unknown mode "%s"; expected one of: %s.', $mode, implode( ', ', Custom_Taxonomy_Slot_Mapping::BACKFILL_MODES ) ) );
		}

		if ( empty( Custom_Taxonomy_Slot_Mapping::get_map() ) ) {
			WP_CLI::warning( 'jetpack_search_custom_taxonomy_map is empty; nothing to backfill.' );
			return;
		}

		WP_CLI::line( sprintf( 'Running backfill in %s mode…', $mode ) );
		try {
			$count = Custom_Taxonomy_Slot_Mapping::backfill( $mode );
			WP_CLI::success( sprintf( 'Backfilled %d (post, taxonomy) pair(s).', $count ) );
		} catch ( \Exception $e ) {
			WP_CLI::error( $e->getMessage() );
		}
	}

	/**
	 * Set current user by ID or login
	 *
	 * @param string|int $user User ID or login.
	 */
	protected function set_user( $user ) {
		$get_user_by = 'login';
		if ( filter_var( $user, FILTER_VALIDATE_INT ) > 0 ) {
			$get_user_by = 'ID';
		}
		$user_info = get_user_by( $get_user_by, (string) $user );
		if ( ! $user_info ) {
			return new WP_Error( 'user_not_found', "Could not find user '{$user}' by {$get_user_by}." );
		}
		return wp_set_current_user( $user_info->ID );
	}
}
