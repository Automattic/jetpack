<?php
/**
 * Term relationships sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Listener;
use Automattic\Jetpack\Sync\Settings;

/**
 * Class to handle sync for term relationships.
 */
class Term_Relationships extends Module {
	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'term_relationships';
	}

	/**
	 * The id field in the database.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function id_field() {
		return 'object_id';
	}

	/**
	 * The table in the database.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function table_name() {
		return 'term_relationships';
	}

	/**
	 * Initialize term relationships action listeners for full sync.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_term_relationships', $callable, 10, 2 );
	}

	/**
	 * Initialize the module in the sender.
	 *
	 * @access public
	 */
	public function init_before_send() {
		// Full sync.
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_term_relationships', array( $this, 'expand_term_relationships' ) );
	}

	/**
	 * Enqueue the term relationships actions for full sync.
	 *
	 * @access public
	 *
	 * @todo This method has similarities with Automattic\Jetpack\Sync\Modules\Module::enqueue_all_ids_as_action. Refactor to keep DRY.
	 * @see Automattic\Jetpack\Sync\Modules\Module::enqueue_all_ids_as_action
	 *
	 * @param array   $config               Full sync configuration for this sync module.
	 * @param int     $max_items_to_enqueue Maximum number of items to enqueue.
	 * @param boolean $state                True if full sync has finished enqueueing this module, false otherwise.
	 * @return array Number of actions enqueued, and next module state.
	 */
	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		global $wpdb;
		$items_per_page        = 1000;
		$chunk_count           = 0;
		$previous_interval_end = $state ? $state : array(
			'object_id'        => '~0',
			'term_taxonomy_id' => '~0',
		);
		$listener              = Listener::get_instance();
		$action_name           = 'jetpack_full_sync_term_relationships';

		// Count down from max_id to min_id so we get term relationships for the newest posts and terms first.
		// phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		while ( $ids = $wpdb->get_results( "SELECT object_id, term_taxonomy_id FROM $wpdb->term_relationships WHERE object_id <= {$previous_interval_end['object_id']} AND term_taxonomy_id < {$previous_interval_end['term_taxonomy_id']} ORDER BY object_id DESC, term_taxonomy_id DESC LIMIT {$items_per_page}", ARRAY_A ) ) {
			// Request term relationships in groups of N for efficiency.
			$chunked_ids = array_chunk( $ids, self::ARRAY_CHUNK_SIZE );

			// If we hit our row limit, process and return.
			if ( $chunk_count + count( $chunked_ids ) >= $max_items_to_enqueue ) {
				$remaining_items_count                      = $max_items_to_enqueue - $chunk_count;
				$remaining_items                            = array_slice( $chunked_ids, 0, $remaining_items_count );
				$remaining_items_with_previous_interval_end = $this->get_chunks_with_preceding_end( $remaining_items, $previous_interval_end );
				$listener->bulk_enqueue_full_sync_actions( $action_name, $remaining_items_with_previous_interval_end );

				$last_chunk = end( $remaining_items );
				return array( $remaining_items_count + $chunk_count, end( $last_chunk ) );
			}
			$chunked_ids_with_previous_end = $this->get_chunks_with_preceding_end( $chunked_ids, $previous_interval_end );

			$listener->bulk_enqueue_full_sync_actions( $action_name, $chunked_ids_with_previous_end );

			$chunk_count += count( $chunked_ids );

			// The $ids are ordered in descending order.
			$previous_interval_end = end( $ids );
		}

		return array( $chunk_count, true );
	}

	/**
	 * Retrieve an estimated number of actions that will be enqueued.
	 *
	 * @access public
	 *
	 * @param array $config Full sync configuration for this sync module.
	 * @return int Number of items yet to be enqueued.
	 */
	public function estimate_full_sync_actions( $config ) {
		global $wpdb;

		$query = "SELECT COUNT(*) FROM $wpdb->term_relationships";

		// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared
		$count = $wpdb->get_var( $query );

		return (int) ceil( $count / self::ARRAY_CHUNK_SIZE );
	}

	/**
	 * Retrieve the actions that will be sent for this module during a full sync.
	 *
	 * @access public
	 *
	 * @return array Full sync actions of this module.
	 */
	public function get_full_sync_actions() {
		return array( 'jetpack_full_sync_term_relationships' );
	}

	/**
	 * Expand the term relationships within a hook before they are serialized and sent to the server.
	 *
	 * @access public
	 *
	 * @param array $args The hook parameters.
	 * @return array $args The expanded hook parameters.
	 */
	public function expand_term_relationships( $args ) {
		list( $term_relationships, $previous_end ) = $args;

		return array(
			'term_relationships' => $term_relationships,
			'previous_end'       => $previous_end,
		);
	}
}
