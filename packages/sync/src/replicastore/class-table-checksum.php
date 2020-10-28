<?php

namespace Automattic\Jetpack\Sync\Replicastore;

use Exception;
use WP_error;

// TODO add rest endpoints to work with this, hopefully in the same folder

class Table_Checksum {
	public $table           = '';
	public $range_field     = '';
	public $key_fields      = array();
	public $checksum_fields = array();
	public $default_tables  = array();

	public $salt = '';

	public $allowed_table_names = array();

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

	public function __construct( $table, $salt = null, $range_field = null, $key_fields = null, $filter_field = null, $checksum_fields = null ) {
		// TODO $table, $key_fields, $checksum_fields, $range_field, $filter_field,
		$this->range_field     = $range_field;
		$this->checksum_fields = $checksum_fields;
		$this->key_fields      = $key_fields;
		$this->salt            = $salt;

		global $wpdb;

		$this->default_tables = array(
			'posts'              => $wpdb->posts,
			'postmeta'           => $wpdb->postmeta,
			'comments'           => $wpdb->comments,
			'commentmeta'        => $wpdb->commentmeta,
			'terms'              => $wpdb->terms,
			'termmeta'           => $wpdb->termmeta,
			'term_relationships' => $wpdb->term_relationships,
			'term_taxonomy'      => $wpdb->term_taxonomy,
			'links'              => $wpdb->links,
			'options'            => $wpdb->options,
		);

		$this->allowed_table_names = apply_filters( 'jetpack_sync_checksum_allowed_tables', $this->default_tables );

		$this->table = $this->validate_table_name( $table );

	}

	private function validate_table_name( $table ) {
		if ( empty( $table ) ) {
			throw new Exception( 'Invalid table name: empty' );
		}

		if ( ! array_key_exists( $table, $this->allowed_table_names ) ) {
			throw new Exception( 'Invalid table name: not allowed' );
		}

		// TODO other checks if such are needed.

		return $this->allowed_table_names[ $table ];
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

		var_dump( $result );

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
		if ( $granular_result || count( $this->key_fields ) > 1 ) {
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

	public function calculate_checksum( $range_from, $range_to, $filter_values, $granular_result = false ) {
		try {
			$this->validate_input();
		} catch ( Exception $ex ) {
			return new WP_error( 'invalid_input', $ex->getMessage() );
		}

		$query = $this->build_checksum_query( $range_from, $range_to, $filter_values, $granular_result );

		global $wpdb;

		$result = $wpdb->get_results( $query, ARRAY_A );

		var_dump( $result );

		// TODO fix
		return false;
	}
}
