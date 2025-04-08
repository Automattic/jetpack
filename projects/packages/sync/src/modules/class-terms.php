<?php
/**
 * Terms sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Sync\Settings;

/**
 * Class to handle sync for terms.
 */
class Terms extends Module {

	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'terms';
	}

	/**
	 * The id field in the database.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function id_field() {
		return 'term_taxonomy_id';
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
		_deprecated_function( __METHOD__, '3.11.0', 'Automattic\\Jetpack\\Sync\\Terms->table' );
		return 'term_taxonomy';
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
		return $wpdb->term_taxonomy;
	}

	/**
	 * Allows WordPress.com servers to retrieve term-related objects via the sync API.
	 *
	 * @param string $object_type The type of object. Accepts: 'term', 'term_taxonomy', 'term_relationships'.
	 * @param int    $id          The id of the object.
	 *
	 * @return false|object A term or term_taxonomy object, depending on object type.
	 */
	public function get_object_by_id( $object_type, $id ) {
		$id = (int) $id;

		if ( empty( $id ) ) {
			return false;
		}

		$objects = $this->get_objects_by_id( $object_type, array( $id ) );

		return $objects[ $id ] ?? false;
	}

	/**
	 * Retrieve a set of objects by their IDs.
	 *
	 * @access public
	 *
	 * @param string $object_type Object type. Accepts: 'term', 'term_taxonomy', 'term_relationships'.
	 * @param array  $ids         Object IDs.
	 *
	 * @return array Array of objects.
	 */
	public function get_objects_by_id( $object_type, $ids ) {
		global $wpdb;

		$objects = array();

		if ( ! is_array( $ids ) || empty( $ids ) || empty( $object_type ) ) {
			return $objects;
		}

		// Sanitize.
		$ids     = array_map( 'intval', $ids );
		$ids_str = implode( ',', $ids );

		$where_sql = Settings::get_whitelisted_taxonomies_sql();

		switch ( $object_type ) {
			case 'term':
				$query    = "SELECT * FROM $wpdb->terms t INNER JOIN $wpdb->term_taxonomy tt ON t.term_id=tt.term_id WHERE t.term_id IN ( $ids_str ) AND ";
				$callback = 'expand_raw_terms';
				break;
			case 'term_taxonomy':
				$query    = "SELECT * FROM $wpdb->term_taxonomy WHERE term_taxonomy_id IN ( $ids_str ) AND ";
				$callback = 'expand_raw_term_taxonomies';
				break;
			case 'term_relationships':
				$query    = "SELECT * FROM $wpdb->term_relationships tr INNER JOIN $wpdb->term_taxonomy tt ON tr.term_taxonomy_id=tt.term_taxonomy_id WHERE object_id IN ( $ids_str ) AND ";
				$callback = 'expand_raw_term_relationships';
				break;
			default:
				return array();
		}

		$query .= $where_sql;

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Already sanitized above.
		$results = $wpdb->get_results( $query );

		if ( ! is_array( $results ) ) {
			return array();
		}

		$objects = $this->$callback( $results );

		return $objects ?? array();
	}

	/**
	 * Initialize terms action listeners.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_listeners( $callable ) {
		add_action( 'created_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'edited_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'jetpack_sync_save_term', $callable );
		add_action( 'jetpack_sync_add_term', $callable );
		add_action( 'delete_term', $callable, 10, 4 );
		add_action( 'set_object_terms', $callable, 10, 6 );
		add_action( 'deleted_term_relationships', $callable, 10, 2 );
		add_filter( 'jetpack_sync_before_enqueue_set_object_terms', array( $this, 'filter_set_object_terms_no_update' ) );
		add_filter( 'jetpack_sync_before_enqueue_jetpack_sync_save_term', array( $this, 'filter_blacklisted_taxonomies' ) );
		add_filter( 'jetpack_sync_before_enqueue_jetpack_sync_add_term', array( $this, 'filter_blacklisted_taxonomies' ) );
	}

	/**
	 * Initialize terms action listeners for full sync.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_terms', $callable, 10, 2 );
	}

	/**
	 * Initialize the module in the sender.
	 *
	 * @access public
	 */
	public function init_before_send() {
		// Full sync.
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_terms', array( $this, 'expand_term_taxonomy_id' ) );
	}

	/**
	 * Enqueue the terms actions for full sync.
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
		return $this->enqueue_all_ids_as_action( 'jetpack_full_sync_terms', $wpdb->term_taxonomy, 'term_taxonomy_id', $this->get_where_sql( $config ), $max_items_to_enqueue, $state );
	}

	/**
	 * Retrieve the WHERE SQL clause based on the module config.
	 *
	 * @access public
	 *
	 * @param array $config Full sync configuration for this sync module.
	 * @return string WHERE SQL clause, or `null` if no comments are specified in the module config.
	 */
	public function get_where_sql( $config ) {
		$where_sql = Settings::get_blacklisted_taxonomies_sql();

		if ( is_array( $config ) && ! empty( $config ) ) {
			$where_sql .= ' AND term_taxonomy_id IN (' . implode( ',', array_map( 'intval', $config ) ) . ')';
		}

		return $where_sql;
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

		$query = "SELECT count(*) FROM $wpdb->term_taxonomy";

		$where_sql = $this->get_where_sql( $config );
		if ( $where_sql ) {
			$query .= ' WHERE ' . $where_sql;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$count = (int) $wpdb->get_var( $query );

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
		return array( 'jetpack_full_sync_terms' );
	}

	/**
	 * Handler for creating and updating terms.
	 *
	 * @access public
	 *
	 * @param int    $term_id  Term ID.
	 * @param int    $tt_id    Term taxonomy ID.
	 * @param string $taxonomy Taxonomy slug.
	 */
	public function save_term_handler( $term_id, $tt_id, $taxonomy ) {
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
			 * @since 1.6.3
			 * @since-jetpack 5.0.0
			 *
			 * @param object the Term object
			 */
			do_action( 'jetpack_sync_add_term', $term_object );
			return;
		}

		/**
		 * Fires when the client needs to update a term
		 *
		 * @since 1.6.3
		 * @since-jetpack 4.2.0
		 *
		 * @param object the Term object
		 */
		do_action( 'jetpack_sync_save_term', $term_object );
	}

	/**
	 * Filter blacklisted taxonomies.
	 *
	 * @access public
	 *
	 * @param array $args Hook args.
	 * @return array|boolean False if not whitelisted, the original hook args otherwise.
	 */
	public function filter_blacklisted_taxonomies( $args ) {
		$term = $args[0];

		if ( in_array( $term->taxonomy, Settings::get_setting( 'taxonomies_blacklist' ), true ) ) {
			return false;
		}

		return $args;
	}

	/**
	 * Filter out set_object_terms actions with blacklisted taxonomies or where the terms have not changed.
	 *
	 * @param array $args Hook args.
	 * @return array|boolean False if blacklisted taxonomy or no change in terms, the original hook args otherwise.
	 */
	public function filter_set_object_terms_no_update( $args ) {
		// Check if the taxonomy is blacklisted. $args[3] is the taxonomy.
		if ( isset( $args[3] ) && in_array( $args[3], Settings::get_setting( 'taxonomies_blacklist' ), true ) ) {
			return false;
		}
		// There is potential for other plugins to modify args, therefore lets validate # of and types.
		// $args[2] is $tt_ids, $args[5] is $old_tt_ids see wp-includes/taxonomy.php L2740.
		if ( 6 === count( $args ) && is_array( $args[2] ) && is_array( $args[5] ) ) {
			if ( empty( array_diff( $args[2], $args[5] ) ) && empty( array_diff( $args[5], $args[2] ) ) ) {
				return false;
			}
		}
		return $args;
	}

	/**
	 * Expand the term taxonomy IDs to terms within a hook before they are serialized and sent to the server.
	 *
	 * @access public
	 *
	 * @param array $args The hook parameters.
	 * @return array $args The expanded hook parameters.
	 */
	public function expand_term_taxonomy_id( $args ) {
		list( $term_taxonomy_ids, $previous_end ) = $args;

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

	/**
	 * Gets a term object based on a given row from the term_relationships database table.
	 *
	 * @access public
	 *
	 * @deprecated since 4.8.1
	 *
	 * @param object $relationship A row object from the term_relationships table.
	 * @return object|bool A term object, or false if term taxonomy doesn't exist.
	 */
	public function expand_terms_for_relationship( $relationship ) {
		_deprecated_function( __METHOD__, '4.8.1' );

		return get_term_by( 'term_taxonomy_id', $relationship->term_taxonomy_id );
	}

	/**
	 * Prepare raw terms and return them in a standard format.
	 *
	 * @param  array $terms An array of raw term objects.
	 * @return array        An array of term objects.
	 */
	private function expand_raw_terms( array $terms ) {
		$objects = array();
		$columns = array(
			'term_id'          => 'int',
			'name'             => 'string',
			'slug'             => 'string',
			'taxonomy'         => 'string',
			'description'      => 'string',
			'term_group'       => 'int',
			'term_taxonomy_id' => 'int',
			'parent'           => 'int',
			'count'            => 'int',
		);

		foreach ( $terms as $term ) {
			if ( ! array_key_exists( $term->term_id, $objects ) ) {
				$t_array = array();

				foreach ( $columns as $field => $type ) {
					$value             = $term->$field ?? '';
					$t_array[ $field ] = 'int' === $type ? (int) $value : $value;
				}
				// This will allow us to know on WPCOM that the term name is the raw one, coming from the DB. Useful with backwards compatibility in mind.
				$t_array['raw_name'] = $t_array['name'];

				$objects[ $term->term_id ] = (object) $t_array;
			}
		}

		return $objects;
	}

	/**
	 * Prepare raw term taxonomies and return them in a standard format.
	 *
	 * @param  array $term_taxonomies An array of raw term_taxonomy objects.
	 * @return array                  An array of term_taxonomy objects.
	 */
	private function expand_raw_term_taxonomies( array $term_taxonomies ) {
		$objects = array();
		$columns = array(
			'term_id'          => 'int',
			'taxonomy'         => 'string',
			'description'      => 'string',
			'term_taxonomy_id' => 'int',
			'parent'           => 'int',
			'count'            => 'int',
		);

		foreach ( $term_taxonomies as $tt ) {
			if ( ! array_key_exists( $tt->term_taxonomy_id, $objects ) ) {
				$t_array = array();

				foreach ( $columns as $field => $type ) {
					$value             = $tt->$field ?? '';
					$t_array[ $field ] = 'int' === $type ? (int) $value : $value;
				}

				$objects[ $tt->term_taxonomy_id ] = (object) $t_array;
			}
		}

		return $objects;
	}

	/**
	 * Prepare raw term taxonomies and return them in a standard format.
	 *
	 * @param  array $term_relationships An array of raw term_taxonomy objects.
	 * @return array                     An array of term_taxonomy objects or false.
	 */
	private function expand_raw_term_relationships( array $term_relationships ) {
		$objects = array();
		$columns = array(
			'object_id'        => 'int',
			'term_id'          => 'int',
			'taxonomy'         => 'string',
			'term_taxonomy_id' => 'int',
			'term_order'       => 'int',
			'parent'           => 'int',
			'count'            => 'int',
		);

		foreach ( $term_relationships as $tt ) {
			$object_id = (int) $tt->object_id;

			$relationship = array();
			foreach ( $columns as $field => $type ) {
				$value                  = $tt->$field ?? '';
				$relationship[ $field ] = 'int' === $type ? (int) $value : $value;
			}

			$relationship = (object) $relationship;

			if ( ! array_key_exists( $object_id, $objects ) ) {
				$objects[ $object_id ] = (object) array(
					'object_id'     => $object_id,
					'relationships' => array( $relationship ),
				);
			} else {
				$objects[ $object_id ]->relationships[] = $relationship;
			}
		}

		return $objects;
	}
}
