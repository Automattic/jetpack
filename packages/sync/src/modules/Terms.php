<?php

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Sync\Defaults;
use Automattic\Jetpack\Sync\Settings;

class Terms extends Module {
	private $taxonomy_whitelist;

	function name() {
		return 'terms';
	}

	/**
	 * Allows WordPress.com servers to retrieve a term object via the sync API.
	 *
	 * @param string $object_type The type of object.
	 * @param int    $id The id of the object.
	 *
	 * @return bool|\WP_Term
	 */
	public function get_object_by_id( $object_type, $id ) {

		if ( $object_type === 'term' ) {

			$term = get_term( intval( $id ) );

			if ( is_wp_error( $term ) && $term->get_error_code() === 'invalid_taxonomy' ) {
				// get raw term
				global $wpdb;
				$columns = implode( ', ', array_unique( array_merge( Defaults::$default_term_checksum_columns, [ 'term_group' ] ) ) );
				$term    = $wpdb->get_row( $wpdb->prepare( "SELECT $columns FROM $wpdb->terms WHERE term_id = %d", $id ) );
			}
			return $term ? $term : false;
		}

		return false;
	}

	function init_listeners( $callable ) {
		add_action( 'created_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'edited_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'jetpack_sync_save_term', $callable );
		add_action( 'jetpack_sync_add_term', $callable );
		add_action( 'delete_term', $callable, 10, 4 );
		add_action( 'set_object_terms', $callable, 10, 6 );
		add_action( 'deleted_term_relationships', $callable, 10, 2 );
		add_filter( 'jetpack_sync_before_enqueue_jetpack_sync_save_term', array( $this, 'filter_blacklisted_taxonomies' ) );
		add_filter( 'jetpack_sync_before_enqueue_jetpack_sync_add_term', array( $this, 'filter_blacklisted_taxonomies' ) );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_terms', $callable, 10, 2 );
	}

	function init_before_send() {
		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_terms', array( $this, 'expand_term_taxonomy_id' ) );
	}

	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		global $wpdb;
		return $this->enqueue_all_ids_as_action( 'jetpack_full_sync_terms', $wpdb->term_taxonomy, 'term_taxonomy_id', $this->get_where_sql( $config ), $max_items_to_enqueue, $state );
	}

	private function get_where_sql( $config ) {
		$where_sql = Settings::get_blacklisted_taxonomies_sql();

		if ( is_array( $config ) ) {
			$where_sql .= ' AND term_taxonomy_id IN (' . implode( ',', array_map( 'intval', $config ) ) . ')';
		}

		return $where_sql;
	}

	public function estimate_full_sync_actions( $config ) {
		global $wpdb;

		$query = "SELECT count(*) FROM $wpdb->term_taxonomy";

		if ( $where_sql = $this->get_where_sql( $config ) ) {
			$query .= ' WHERE ' . $where_sql;
		}

		$count = $wpdb->get_var( $query );

		return (int) ceil( $count / self::ARRAY_CHUNK_SIZE );
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_terms' );
	}

	function save_term_handler( $term_id, $tt_id, $taxonomy ) {
		if ( class_exists( '\\WP_Term' ) ) {
			$term_object = \WP_Term::get_instance( $term_id, $taxonomy );
		} else {
			$term_object = get_term_by( 'id', $term_id, $taxonomy );
		}

		$current_filter = current_filter();

		if ( 'created_term' === $current_filter ) {
			/**
			 * Fires when the client needs to add a new term
			 *
			 * @since 5.0.0
			 *
			 * @param object the Term object
			 */
			do_action( 'jetpack_sync_add_term', $term_object );
			return;
		}

		/**
		 * Fires when the client needs to update a term
		 *
		 * @since 4.2.0
		 *
		 * @param object the Term object
		 */
		do_action( 'jetpack_sync_save_term', $term_object );
	}

	function filter_blacklisted_taxonomies( $args ) {
		$term = $args[0];

		if ( in_array( $term->taxonomy, Settings::get_setting( 'taxonomies_blacklist' ), true ) ) {
			return false;
		}

		return $args;
	}

	function set_taxonomy_whitelist( $taxonomies ) {
		$this->taxonomy_whitelist = $taxonomies;
	}

	function set_defaults() {
		$this->taxonomy_whitelist = Defaults::$default_taxonomy_whitelist;
	}

	public function expand_term_taxonomy_id( $args ) {
		list( $term_taxonomy_ids,  $previous_end ) = $args;

		return array(
			'terms'        => get_terms(
				array(
					'hide_empty'       => false,
					'term_taxonomy_id' => $term_taxonomy_ids,
					'orderby'          => 'term_taxonomy_id',
					'order'            => 'DESC',
				)
			),
			'previous_end' => $previous_end,
		);
	}
}
