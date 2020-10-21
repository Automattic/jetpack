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

	public $salt = '';

	public $allowed_table_names = array();

	/**
	 * Table_Checksum constructor.
	 *
	 * @param string $table
	 * @param string $range_field
	 * @param array  $checksum_fields
	 * @param string $salt
	 */
	public function __construct( $table, $range_field, $key_fields, $checksum_fields, $salt ) {
		$this->table           = $table;
		$this->range_field     = $range_field;
		$this->checksum_fields = $checksum_fields;
		$this->key_fields      = $key_fields;
		$this->salt            = $salt;

		global $wpdb;

		$this->allowed_table_names = array(
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
	}

	protected function validate_table_name( $table ) {
		if ( empty( $table ) ) {
			throw new Exception( 'Invalid table name: empty' );
		}

		if ( ! in_array( $table, $this->allowed_table_names, true ) ) {
			throw new Exception( 'Invalid table name: not allowed' );
		}

		// TODO other checks if such are needed.

		return $table;
	}

	public function validate_fields( $fields ) {
		foreach ( $fields as $field ) {
			if ( ! preg_match( '/^[0-9,a-z,A-Z$_]+$/i', $field ) ) {
				throw new Exception( "Invalid field name: {$field} is not allowed" );
			}

			// TODO other verifications of the field names
		}
	}

	public function validate_fields_against_table( $table, $fields ) {
		global $wpdb;

		$table = $this->validate_table_name( $table );

		// TODO: Is this safe enough?
		$result = $wpdb->query( "SELECT * FROM {$table} LIMIT 1", ARRAY_A );

		if ( ! is_array( $result ) ) {
			throw new Exception( 'Unexpected $wpdb->query output: not array' );
		}

		// Check if the fields are actually contained in the table
		foreach ( $fields as $field_to_check ) {
			if ( ! array_key_exists( $field_to_check, $result ) ) {
				throw new Exception( "Invalid field name: field '{$field_to_check}' doesn't exist in table {$table}" );
			}
		}

		return true;
	}

	// TODO make sure the function is described as DOESN'T DO VALIDATION
	public function build_checksum_query( $table, $key_fields, $checksum_fields, $range_field, $range_from, $range_to, $filter_field, $filter_values, $salt, $granular_result ) {
		global $wpdb;

		// Make sure the range makes sense
		$range_start = min( $range_from, $range_to );
		$range_end   = max( $range_from, $range_to );

		// Escape the salt
		$salt = $wpdb->_real_escape( $salt ); // TODO escape or prepare statement

		// Prepare the compound key
		$key_fields = implode( ',', $key_fields );

		// Prepare the checksum fields
		$checksum_fields_string = implode( ',', array_merge( $checksum_fields, array( $salt ) ) );

		// Prepare filtering
		$filter_placeholders       = 'IN(' . implode( ',', array_fill( 0, count( $filter_values ), '%s' ) ) . ')';
		$filter_prepared_statement = $wpdb->prepare( $filter_placeholders, $filter_values );

		$query = "
			SELECT
			     {$range_field} as range_index,
			     {$key_fields},
			     SUM(
			         CRC32(
			                 CONCAT_WS( '#', '%s', {$checksum_fields_string} )
			             )
			     )  AS checksum
			 FROM
			    {$table}
			 WHERE
				{$range_field} > {$range_start} AND {$range_field} < {$range_end}
			   	AND {$filter_field} {$filter_prepared_statement} # Filter example
			GROUP BY {$key_fields};
		";

		return $query;

	}

	public function get_range_edges( $table, $range_col ) {
		global $wpdb;

		$this->validate_fields( array( $range_col ) );

		// TODO decide if we need the count column or only the range edges. Adding `COUNT(DISTINCT)` is kind of slow
		$result = $wpdb->get_row(
			"
			SELECT
			       MIN({$range_col}) as min_range,
			       MAX({$range_col}) as max_range,
			       COUNT(DISTINCT {$range_col}) as total_count
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

	public function calculate_checksum( $range_from, $range_to, $salt, $granular_result = false ) {
		try {
			$table = $this->validate_table_name( $this->table );

			$fields = array_merge( array( $this->range_field ), $this->key_fields, $this->checksum_fields );

			$this->validate_fields( $fields );
			$this->validate_fields_against_table( $table, $fields );
			// TODO validate ranges?
			// TODO validate salt?
			// TODO granular/non-granular result
		} catch ( Exception $ex ) {
			return new WP_error( 'invalid_input', $ex->getMessage() );
		}

		$query = $this->build_checksum_query( $table, $this->checksum_fields, $this->range_field, $range_from, $range_to, $salt, $granular_result );

		// TODO fix
		return false;
	}
}
