<?php
/**
 * Term relationships sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

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
	 * The table name.
	 *
	 * @access public
	 *
	 * @return string
	 * @deprecated since 3.11.0 Use table() instead.
	 */
	public function table_name() {
		_deprecated_function( __METHOD__, '3.11.0', 'Automattic\\Jetpack\\Sync\\Term_Relationships->table' );
		return 'term_relationships';
	}

	/**
	 * The table in the database with the prefix.
	 *
	 * @access public
	 *
	 * @return string|bool
	 */
	public function table() {
		global $wpdb;
		return $wpdb->term_relationships;
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
	 * Return last_item to send for Module Full Sync Configuration.
	 *
	 * @param array $config This module Full Sync configuration.
	 *
	 * @return array|object|null
	 */
	public function get_last_item( $config ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery
		return $wpdb->get_results(
			"SELECT object_id, term_taxonomy_id 
			FROM $wpdb->term_relationships 
			ORDER BY object_id , term_taxonomy_id
			LIMIT 1",
			ARRAY_A
		);
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
