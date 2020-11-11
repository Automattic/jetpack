<?php

namespace Automattic\Jetpack\Sync\Replicastore;

use Exception;
use WP_error;

// TODO add rest endpoints to work with this, hopefully in the same folder

class Table_Checksum {
	public $table           = '';
	public $table_configuration = array();
	public $range_field     = '';
	public $key_fields      = array();
	public $checksum_fields = array();
	public $default_tables  = array();

	public $salt = '';

	public $allowed_tables = array();

	/**
	 * Table_Checksum constructor.
	 *
	 * @param string $table
	 * @param string $salt
	 * @param string $range_field
	 * @param null   $key_fields
	 * @param null   $filter_field
	 * @param array  $checksum_fields
	 */

	public function __construct( $table, $salt = null ) {
		$this->salt            = $salt;

		global $wpdb;

		$this->default_tables = array(
			'posts'              => array(
				'table'           => $wpdb->posts,
				'range_field'     => 'ID',
				'key_fields'      => array( 'ID' ),
				'checksum_fields' => array( 'post_modified' ),
			),
			'postmeta'           => array(
				'table'           => $wpdb->postmeta,
				'range_field'     => 'post_id',
				'key_fields'      => array( 'post_id', 'meta_key' ),
				'checksum_fields' => array( 'meta_key', 'meta_value' ),
			),
			'comments'           => array(
				'table'           => $wpdb->comments,
				'range_field'     => 'comment_ID',
				'key_fields'      => array( 'comment_ID' ),
				'checksum_fields' => array( 'comment_content' ),
			),
			'commentmeta'        => array(
				'table'           => $wpdb->commentmeta,
				'range_field'     => 'comment_id',
				'key_fields'      => array( 'comment_id', 'meta_key' ),
				'checksum_fields' => array( 'meta_key', 'meta_value' ),
			),
			'terms'              => array(
				'table'           => $wpdb->terms,
				'range_field'     => 'term_id',
				'key_fields'      => array( 'term_id' ),
				'checksum_fields' => array( 'term_id', 'name', 'slug' ),
			),
			'termmeta'           => array(
				'table'           => $wpdb->termmeta,
				'range_field'     => 'term_id',
				'key_fields'      => array( 'term_id', 'meta_key' ),
				'checksum_fields' => array( 'meta_key', 'meta_value' ),
			),
			'term_relationships' => $wpdb->term_relationships, // TODO describe in the array format or add exceptions
			'term_taxonomy'      => $wpdb->term_taxonomy, // TODO describe in the array format or add exceptions
			'links'              => $wpdb->links, // TODO describe in the array format or add exceptions
			'options'            => $wpdb->options, // TODO describe in the array format or add exceptions
		);

		// TODO change filters to allow the array format
		// TODO add get_fields or similar method to get things out of the table
		// TODO extract this configuration in a better way, still make it work with `$wpdb` names.
		// TODO take over the replicastore functions and move them over to this class
		// TODO make the API work

		$this->allowed_tables = apply_filters( 'jetpack_sync_checksum_allowed_tables', $this->default_tables );

		$this->table               = $this->validate_table_name( $table );
		$this->table_configuration = $this->allowed_tables[ $table ];

		$this->prepare_fields( $this->table_configuration );

	}

	private function prepare_fields( $table_configuration ) {
		$this->key_fields = $table_configuration['key_fields'];
		$this->range_field = $table_configuration['range_field'];
		$this->checksum_fields = $table_configuration['checksum_fields'];
	}

	private function validate_table_name( $table ) {
		if ( empty( $table ) ) {
			throw new Exception( 'Invalid table name: empty' );
		}

		if ( ! array_key_exists( $table, $this->allowed_tables ) ) {
			throw new Exception( 'Invalid table name: not allowed' );
		}

		// TODO other checks if such are needed.

		return $this->allowed_tables[$table]['table'];
	}

	private function validate_fields( $fields ) {
		foreach ( $fields as $field ) {
			if ( ! preg_match( '/^[0-9,a-z,A-Z$_]+$/i', $field ) ) {
				throw new Exception( "Invalid field name: {$field} is not allowed" );
			}

			// TODO other verifications of the field names
		}
	}

	private function validate_fields_against_table( $fields ) {
		global $wpdb;

		// TODO: Is this safe enough?
		$result = $wpdb->get_row( "SELECT * FROM {$this->table} LIMIT 1", ARRAY_A );

		if ( ! is_array( $result ) ) {
			throw new Exception( 'Unexpected $wpdb->query output: not array' );
		}

		// Check if the fields are actually contained in the table
		foreach ( $fields as $field_to_check ) {
			if ( ! array_key_exists( $field_to_check, $result ) ) {
				throw new Exception( "Invalid field name: field '{$field_to_check}' doesn't exist in table {$this->table}" );
			}
		}

		return true;
	}

	private function validate_input() {
		$fields = array_merge( array( $this->range_field ), $this->key_fields, $this->checksum_fields );

		$this->validate_fields( $fields );
		$this->validate_fields_against_table( $fields );
	}

	// TODO make sure the function is described as DOESN'T DO VALIDATION
	private function build_checksum_query( $range_from, $range_to, $filter_values, $granular_result ) {
		global $wpdb;

		// Make sure the range makes sense
		$range_start = min( $range_from, $range_to );
		$range_end   = max( $range_from, $range_to );

		// Escape the salt
		$salt = $wpdb->prepare( '%s', $this->salt ); // TODO escape or prepare statement

		// Prepare the compound key
		$key_fields = implode( ',', $this->key_fields );

		// Prepare the checksum fields
		$checksum_fields_string = implode( ',', array_merge( $this->checksum_fields, array( $salt ) ) );

		$filter_prepared_statement = '';
		if ( ! empty( $filter_values ) ) {
			// Prepare filtering
			$filter_placeholders       = "AND {$this->filter_field} IN(" . implode( ',', array_fill( 0, count( $filter_values ), '%s' ) ) . ')';
			$filter_prepared_statement = $wpdb->prepare( $filter_placeholders, $filter_values );
		}

		$additional_fields = '';
		if ( $granular_result ) {
			// TODO uniq the fields as sometimes(most) range_index is the key and there's no need to select the same field twice
			$additional_fields = "
				{$this->range_field} as range_index,
			    {$key_fields},
			";
		}

		$query = "
			SELECT
				{$additional_fields}
				SUM(
					CRC32(
						CONCAT_WS( '#', {$salt}, {$checksum_fields_string} )
					)
				)  AS checksum
			 FROM
			    {$this->table}
			 WHERE
				{$this->range_field} > {$range_start} AND {$this->range_field} < {$range_end}
		        {$filter_prepared_statement}
		";

		/**
		 * We need the GROUP BY only for compound keys
		 */
		if ( $granular_result ) {
			$query .= "
				GROUP BY {$key_fields}
			";
		}

		return $query;

	}

	public function get_range_edges( $table, $range_col ) {
		global $wpdb;

		$this->validate_fields( array( $range_col ) );

		$result = $wpdb->get_row(
			"
			SELECT
			       MIN({$range_col}) as min_range,
			       MAX({$range_col}) as max_range,
			FROM
			     {$table}
	     ",
			ARRAY_A
		);

		if ( ! $result || ! is_array( $result ) ) {
			throw new Exception( 'Unable to get range edges' );
		}

		return $result;
	}

	public function prepare_results_for_output(&$results) {
		// get the compound key
		// only return range and compound key for granular results

		foreach ($results as &$result) {
			// Working on reference to save memory here.

			$key = array();
			foreach($this->key_fields as $field) {
				$key[] = $result[$field];
			}

			$result = array(
				'key' => implode('-', $key),
				'checksum' => $result['checksum'],
			);

		}
	}

	public function calculate_checksum( $range_from, $range_to, $filter_values, $granular_result = false ) {
		try {
			$this->validate_input();
		}
		catch ( Exception $ex ) {
			return new WP_error( 'invalid_input', $ex->getMessage() );
		}

		$query = $this->build_checksum_query( $range_from, $range_to, $filter_values, $granular_result );

		global $wpdb;

		if ( ! $granular_result ) {
			$result = $wpdb->get_row( $query, ARRAY_A );

			if ( ! is_array( $result ) ) {
				return new WP_Error( 'invalid_query', "Result wasn't an array" );
			}

			return array(
				'range'    => $range_from . '-' . $range_to,
				'checksum' => $result['checksum'],
			);
		} else {
			$result = $wpdb->get_results( $query, ARRAY_A );
			$this->prepare_results_for_output( $result );

			return $result;
		}
	}
}
