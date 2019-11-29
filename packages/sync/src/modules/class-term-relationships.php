<?php
/**
 * Term relationships sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Sync\Listener;
use Automattic\Jetpack\Sync\Settings;

/**
 * Class to handle sync for term relationships.
 */
class Term_Relationships extends Module {

	/**
	 * Max terms to return in one single query
	 *
	 * @access public
	 *
	 * @const int
	 */
	const QUERY_LIMIT = 1000;

	/**
	 * Max value for a signed INT in MySQL - https://dev.mysql.com/doc/refman/8.0/en/integer-types.html
	 *
	 * @access public
	 *
	 * @const int
	 */
	const MAX_INT = 2147483647;

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
	 * Initialize the module in the sender.
	 *
	 * @access public
	 */
	public function init_before_send() {
		// Full sync.
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_term_relationships', array( $this, 'expand_term_relationships' ) );
	}

	/**
	 * Return the initial last sent object.
	 *
	 * @return string|array initial status.
	 */
	public function get_initial_last_sent() {
		return array(
			'object_id'        => self::MAX_INT,
			'term_taxonomy_id' => self::MAX_INT,
		);
	}

	/**
	 * Given the Module Full Sync Configuration and Status return the next chunk of items to send.
	 *
	 * @param array $config This module Full Sync configuration.
	 * @param array $status This module Full Sync status.
	 * @param int   $chunk_size Chunk size.
	 *
	 * @return array|object|null
	 */
	public function get_next_chunk( $config, $status, $chunk_size ) {
		global $wpdb;

		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT object_id, term_taxonomy_id 
				FROM $wpdb->term_relationships 
				WHERE ( object_id = %d AND term_taxonomy_id < %d ) OR ( object_id < %d ) 
				ORDER BY object_id DESC, term_taxonomy_id 
				DESC LIMIT %d",
				$status['last_sent']['object_id'],
				$status['last_sent']['term_taxonomy_id'],
				$status['last_sent']['object_id'],
				$chunk_size
			),
			ARRAY_A
		);
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
