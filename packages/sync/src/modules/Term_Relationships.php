<?php
/**
 * Term relationships sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Sync\Defaults;
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
	 * @param array   $config               Full sync configuration for this sync module.
	 * @param int     $max_items_to_enqueue Maximum number of items to enqueue.
	 * @param boolean $state                True if full sync has finished enqueueing this module, false otherwise.
	 * @return array Number of actions enqueued, and next module state.
	 */
	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		global $wpdb;
		return $this->enqueue_all_ids_as_action(
			'jetpack_full_sync_term_relationships',
			$wpdb->term_relationships,
			'object_id',
			'1=1',
			$max_items_to_enqueue,
			$state
		);
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
