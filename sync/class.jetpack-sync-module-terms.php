<?php

class Jetpack_Sync_Module_Terms extends Jetpack_Sync_Module {
	private $taxonomy_whitelist;

	private $callable;

	function name() {
		return 'terms';
	}

	function init_listeners( $callable ) {
		$this->callable = $callable;
		add_action( 'created_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'edited_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'jetpack_sync_save_term', $callable );
		add_action( 'jetpack_sync_add_term', $callable );
		add_action( 'delete_term', $callable, 10, 4 );
		add_action( 'set_object_terms', array( $this, 'set_object_terms' ), 10, 6 );
		add_action( 'deleted_term_relationships', $callable, 10, 2 );
	}

	public function set_object_terms( $object_id, $term_ids, $tt_ids, $taxonomy, $append ) {
		$posts_sync_module = Jetpack_Sync_Modules::get_module( 'posts' );
		if ( $posts_sync_module && $posts_sync_module->is_saving_post( $object_id ) ) {
			return;
		}
		$args = func_get_args();
		call_user_func_array( $this->callable, $args );
	}

	private function is_save_post() {
		return Jetpack::is_function_in_backtrace( 'wp_insert_post' );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_terms', $callable, 10, 2 );
	}

	function init_before_send() {
		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_terms', array( $this, 'expand_term_ids' ) );
	}

	function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		global $wpdb;

		// TODO: process state

		$taxonomies           = get_taxonomies();
		$total_chunks_counter = 0;
		foreach ( $taxonomies as $taxonomy ) {
			// I hope this is never bigger than RAM...
			$term_ids = $wpdb->get_col( $wpdb->prepare( "SELECT term_id FROM $wpdb->term_taxonomy WHERE taxonomy = %s", $taxonomy ) ); // Should we set a limit here?
			// Request posts in groups of N for efficiency
			$chunked_term_ids = array_chunk( $term_ids, self::ARRAY_CHUNK_SIZE );

			// Send each chunk as an array of objects
			foreach ( $chunked_term_ids as $chunk ) {
				do_action( 'jetpack_full_sync_terms', $chunk, $taxonomy );
				$total_chunks_counter ++;
			}
		}

		return array( $total_chunks_counter, true );
	}

	function estimate_full_sync_actions( $config ) {
		// TODO - make this (and method above) more efficient for large numbers of terms or taxonomies
		global $wpdb;

		$taxonomies           = get_taxonomies();
		$total_chunks_counter = 0;
		foreach ( $taxonomies as $taxonomy ) {
			$total_ids = $wpdb->get_var( $wpdb->prepare( "SELECT count(term_id) FROM $wpdb->term_taxonomy WHERE taxonomy = %s", $taxonomy ) );
			$total_chunks_counter += (int) ceil( $total_ids / self::ARRAY_CHUNK_SIZE );
		}

		return $total_chunks_counter;
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_terms' );
	}

	function save_term_handler( $term_id, $tt_id, $taxonomy ) {
		if ( class_exists( 'WP_Term' ) ) {
			$term_object = WP_Term::get_instance( $term_id, $taxonomy );
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

	function set_taxonomy_whitelist( $taxonomies ) {
		$this->taxonomy_whitelist = $taxonomies;
	}

	function set_defaults() {
		$this->taxonomy_whitelist = Jetpack_Sync_Defaults::$default_taxonomy_whitelist;
	}

	public function expand_term_ids( $args ) {
		global $wp_version;
		$term_ids = $args[0];
		$taxonomy = $args[1];
		// version 4.5 or higher
		if ( version_compare( $wp_version, 4.5, '>=' ) ) {
			$terms = get_terms( array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
				'include'    => $term_ids,
			) );
		} else {
			$terms = get_terms( $taxonomy, array(
				'hide_empty' => false,
				'include'    => $term_ids,
			) );
		}

		return $terms;
	}
}
