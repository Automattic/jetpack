<?php
/**
 * Table Checksums Class.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Replicastore;

use Automattic\Jetpack\Sync\Settings;
use Exception;
use WP_Error;

// TODO add rest endpoints to work with this, hopefully in the same folder.
/**
 * Class to handle Table Checksums.
 */
class Table_Checksum {

	/**
	 * Table to be checksummed.
	 *
	 * @var string
	 */
	public $table = '';

	/**
	 * Table Checksum Configuration.
	 *
	 * @var array
	 */
	public $table_configuration = array();

	/**
	 * Field to be used for range queries.
	 *
	 * @var string
	 */
	public $range_field = '';

	/**
	 * ID Field(s) to be used.
	 *
	 * @var array
	 */
	public $key_fields = array();

	/**
	 * Field(s) to be used in generating the checksum value.
	 *
	 * @var array
	 */
	public $checksum_fields = array();

	/**
	 * SQL Query to be used to filter results (allow/disallow).
	 *
	 * @var string
	 */
	public $additional_filter_sql = '';

	/**
	 * Default Checksum Table Configurations.
	 *
	 * @var array
	 */
	public $default_tables = array();

	/**
	 * Salt to be used when generating checksum.
	 *
	 * @var string
	 */
	public $salt = '';

	/**
	 * Tables which are allowed to be checksummed.
	 *
	 * @var string
	 */
	public $allowed_tables = array();

	/**
	 * If the table has a "parent" table that it's related to.
	 *
	 * @var mixed|null
	 */
	private $parent_table = null;

	/**
	 * Table_Checksum constructor.
	 *
	 * @param string $table The table to calculate checksums for.
	 * @param string $salt  Optional salt to add to the checksum.
	 *
	 * @throws Exception Throws exception from inner functions.
	 */
	public function __construct( $table, $salt = null ) {
		$this->salt = $salt;

		$this->default_tables = $this->get_default_tables();

		// TODO change filters to allow the array format.
		// TODO add get_fields or similar method to get things out of the table.
		// TODO extract this configuration in a better way, still make it work with `$wpdb` names.
		// TODO take over the replicastore functions and move them over to this class.
		// TODO make the API work.

		$this->allowed_tables = apply_filters( 'jetpack_sync_checksum_allowed_tables', $this->default_tables );

		$this->table               = $this->validate_table_name( $table );
		$this->table_configuration = $this->allowed_tables[ $table ];

		$this->prepare_fields( $this->table_configuration );

	}

	/**
	 * Get Default Table configurations.
	 *
	 * @return array
	 */
	private function get_default_tables() {
		global $wpdb;

		return array(
			'posts'              => array(
				'table'           => $wpdb->posts,
				'range_field'     => 'ID',
				'key_fields'      => array( 'ID' ),
				'checksum_fields' => array( 'post_modified_gmt' ),
				'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
			),
			'postmeta'           => array(
				'table'           => $wpdb->postmeta,
				'range_field'     => 'post_id',
				'key_fields'      => array( 'post_id', 'meta_key' ),
				'checksum_fields' => array( 'meta_key', 'meta_value' ),
				'filter_sql'      => Settings::get_whitelisted_post_meta_sql(),
				'parent_table'    => 'posts',
			),
			'comments'           => array(
				'table'           => $wpdb->comments,
				'range_field'     => 'comment_ID',
				'key_fields'      => array( 'comment_ID' ),
				'checksum_fields' => array( 'comment_content' ),
				'filter_sql'      => Settings::get_comments_filter_sql(),
			),
			'commentmeta'        => array(
				'table'           => $wpdb->commentmeta,
				'range_field'     => 'comment_id',
				'key_fields'      => array( 'comment_id', 'meta_key' ),
				'checksum_fields' => array( 'meta_key', 'meta_value' ),
				'filter_sql'      => Settings::get_whitelisted_comment_meta_sql(),
				'parent_table'    => 'comments',
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
				'parent_table'    => 'terms',
			),
			'term_relationships' => array(
				'table'           => $wpdb->term_relationships,
				'range_field'     => 'object_id',
				'key_fields'      => array( 'object_id' ),
				'checksum_fields' => array( 'object_id', 'term_taxonomy_id' ),
			),
			'term_taxonomy'      => array(
				'table'           => $wpdb->term_taxonomy,
				'range_field'     => 'term_taxonomy_id',
				'key_fields'      => array( 'term_taxonomy_id' ),
				'checksum_fields' => array( 'term_taxonomy_id', 'term_id', 'taxonomy', 'description', 'parent' ),
			),
			'links'              => $wpdb->links, // TODO describe in the array format or add exceptions.
			'options'            => $wpdb->options, // TODO describe in the array format or add exceptions.
		);
	}

	/**
	 * Prepare field params based off provided configuration.
	 *
	 * @param array $table_configuration The table configuration array.
	 */
	private function prepare_fields( $table_configuration ) {
		$this->key_fields            = $table_configuration['key_fields'];
		$this->range_field           = $table_configuration['range_field'];
		$this->checksum_fields       = $table_configuration['checksum_fields'];
		$this->additional_filter_sql = ! empty( $table_configuration['filter_sql'] ) ? $table_configuration['filter_sql'] : '';
		$this->parent_table          = isset( $table_configuration['parent_table'] ) ? $table_configuration['parent_table'] : null;
	}

	/**
	 * Verify provided table name is valid for checksum processing.
	 *
	 * @param string $table Table name to validate.
	 *
	 * @return mixed|string
	 * @throws Exception Throw an exception on validation failure.
	 */
	private function validate_table_name( $table ) {
		if ( empty( $table ) ) {
			throw new Exception( 'Invalid table name: empty' );
		}

		if ( ! array_key_exists( $table, $this->allowed_tables ) ) {
			throw new Exception( "Invalid table name: $table not allowed" );
		}

		// TODO other checks if such are needed.

		return $this->allowed_tables[ $table ]['table'];
	}

	/**
	 * Verify provided fields are proper names.
	 *
	 * @param array $fields Array of field names to validate.
	 *
	 * @throws Exception Throw an exception on failure to validate.
	 */
	private function validate_fields( $fields ) {
		foreach ( $fields as $field ) {
			if ( ! preg_match( '/^[0-9,a-z,A-Z$_]+$/i', $field ) ) {
				throw new Exception( "Invalid field name: $field is not allowed" );
			}

			// TODO other verifications of the field names.
		}
	}

	/**
	 * Verify the fields exist in the table.
	 *
	 * @param array $fields Array of fields to validate.
	 *
	 * @return bool
	 * @throws Exception Throw an exception on failure to validate.
	 */
	private function validate_fields_against_table( $fields ) {
		global $wpdb;

		// TODO: Is this safe enough?
		$result = $wpdb->get_row( "SELECT * FROM {$this->table} LIMIT 1", ARRAY_A );
		if ( ! is_array( $result ) ) {
			throw new Exception( 'Unexpected $wpdb->query output: not array' );
		}

		// Check if the fields are actually contained in the table.
		foreach ( $fields as $field_to_check ) {
			if ( ! array_key_exists( $field_to_check, $result ) ) {
				throw new Exception( "Invalid field name: field '{$field_to_check}' doesn't exist in table {$this->table}" );
			}
		}

		return true;
	}

	/**
	 * Verify the configured fields.
	 *
	 * @throws Exception Throw an exception on failure to validate in the internal functions.
	 */
	private function validate_input() {
		$fields = array_merge( array( $this->range_field ), $this->key_fields, $this->checksum_fields );

		$this->validate_fields( $fields );
		$this->validate_fields_against_table( $fields );
	}

	/**
	 * Build the filter query baased off range fields and values and the additional sql.
	 *
	 * @param int|null   $range_from Start of the range.
	 * @param int|null   $range_to End of the range.
	 * @param array|null $filter_values Additional filter values. Not used at the moment.
	 *
	 * @return string
	 */
	public function build_filter_statement( $range_from = null, $range_to = null, $filter_values = null ) {
		global $wpdb;

		/**
		 * Prepare the ranges.
		 */

		$filter_array = array();
		if ( null !== $range_from ) {
			$filter_array[] = $wpdb->prepare( "{$this->range_field} >= %d", array( intval( $range_from ) ) );
		}
		if ( null != $range_to ) {
			$filter_array[] = $wpdb->prepare( "{$this->range_field} <= %d", array( intval( $range_to ) ) );
		}

		/**
		 * End prepare the ranges.
		 */

		/**
		 * Prepare data filters.
		 */
		// TODO add support for multiple filter fields from array syntax (i.e. filter => values, filter => values, ...).
		// TODO this doesn't work right now, until we properly migrate all the filtering functions to array syntax.
		$filter_prepared_statement = '';
		if ( 0 & ! empty( $filter_values ) ) {
			// Prepare filtering.
			$filter_placeholders = "AND {$this->filter_field} IN(" . implode( ',', array_fill( 0, count( $filter_values ), '%s' ) ) . ')';
			$filter_array[]      = $wpdb->prepare( $filter_placeholders, $filter_values );
		}

		// Add any additional filters via direct SQL statement.
		// Currently used only because the above isn't done ( `$filter_values` ).
		$additional_filter_sql = '';
		if ( $this->additional_filter_sql ) {
			$filter_array[] = $this->additional_filter_sql;
		}

		/**
		 * End prepare data filters.
		 */
		return implode( ' AND ', $filter_array );
	}

	/**
	 * Returns the checksum query. All validation of fields and configurations are expected to occur prior to usage.
	 *
	 * @param int|null   $range_from      The start of the range.
	 * @param int|null   $range_to        The end of the range.
	 * @param array|null $filter_values   Additional filter values. Not used at the moment.
	 * @param bool       $granular_result If the function should return a granular result.
	 *
	 * @return string
	 *
	 * @throws Exception Throws and exception if validation fails in the internal function calls.
	 */
	private function build_checksum_query( $range_from = null, $range_to = null, $filter_values = null, $granular_result = false ) {
		global $wpdb;

		// Escape the salt.
		$salt = $wpdb->prepare( '%s', $this->salt ); // TODO escape or prepare statement.

		// Prepare the compound key.
		$key_fields = implode( ',', $this->key_fields );

		// Prepare the checksum fields.
		$checksum_fields_string = implode( ',', array_merge( $this->checksum_fields, array( $salt ) ) );

		$additional_fields = '';
		if ( $granular_result ) {
			// TODO uniq the fields as sometimes(most) range_index is the key and there's no need to select the same field twice.
			$additional_fields = "
				{$this->range_field} as range_index,
			    {$key_fields},
			";
		}

		$filter_stamenet = $this->build_filter_statement( $range_from, $range_to, $filter_values );

		$join_statement = '';
		if ( $this->parent_table ) {
			$parent_table_obj    = new Table_Checksum( $this->parent_table );
			$parent_filter_query = $parent_table_obj->build_filter_statement( $range_from, $range_to );

			$join_statement = "
				INNER JOIN {$parent_table_obj->table} ON ({$this->table}.{$this->range_field} = {$parent_table_obj->table}.{$parent_table_obj->range_field} AND {$parent_filter_query})
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
				{$join_statement}
			 WHERE
				{$filter_stamenet}
		";

		/**
		 * We need the GROUP BY only for compound keys.
		 */
		if ( $granular_result ) {
			$query .= "
				GROUP BY {$key_fields}
			";
		}

		return $query;

	}

	/**
	 * Obtain the min-max values (edges) of the range.
	 *
	 * @param int|null $range_from The start of the range.
	 * @param int|null $range_to   The end of the range.
	 * @param int|null $limit      How many values to return.
	 *
	 * @return array|object|void
	 * @throws Exception Throws an exception if validation fails on the internal function calls.
	 */
	public function get_range_edges( $range_from = null, $range_to = null, $limit = null ) {
		global $wpdb;

		$this->validate_fields( array( $this->range_field ) );

		// `trim()` to make sure we don't add the statement if it's empty.
		$filters = trim( $this->build_filter_statement( $range_from, $range_to ) );

		$filter_statement = '';
		if ( ! empty( $filters ) ) {
			$filter_statement = "
				WHERE
					{$filters}
			";
		}

		// Only make the distinct count when we know there can be multiple entries for the range column.
		$distinct_count = count( $this->key_fields ) > 1 ? 'DISTINCT' : '';

		$query = "
			SELECT
			       MIN({$this->range_field}) as min_range,
			       MAX({$this->range_field}) as max_range,
			       COUNT( {$distinct_count} {$this->range_field}) as item_count
			FROM
		";

		/**
		 * If `$limit` is not specified, we can directly use the table.
		 */
		if ( ! $limit ) {
			$query .= "
				{$this->table}
	            {$filter_statement}
			";
		} else {
			/**
			 * If there is `$limit` specified, we can't directly use `MIN/MAX()` as they don't work with `LIMIT`.
			 * That's why we will alter the query for this case.
			 */
			$limit = intval( $limit );

			$query .= "
				(
					SELECT
						{$distinct_count} {$this->range_field}
					FROM
						{$this->table}
						{$filter_statement}
					ORDER BY
						{$this->range_field} ASC
					LIMIT {$limit}
				) as ids_query
			";
		}

		$result = $wpdb->get_row( $query, ARRAY_A );

		if ( ! $result || ! is_array( $result ) ) {
			throw new Exception( 'Unable to get range edges' );
		}

		return $result;
	}

	/**
	 * Update the results to have key/checksum format.
	 *
	 * @param array $results Prepare the results for output of granular results.
	 */
	public function prepare_results_for_output( &$results ) {
		// get the compound key.
		// only return range and compound key for granular results.

		foreach ( $results as &$result ) {
			// Working on reference to save memory here.

			$key = array();
			foreach ( $this->key_fields as $field ) {
				$key[] = $result[ $field ];
			}

			$result = array(
				'key'      => implode( '-', $key ),
				'checksum' => $result['checksum'],
			);

		}
	}

	/**
	 * Calculate the checksum based on provided range and filters.
	 *
	 * @param int|null   $range_from          The start of the range.
	 * @param int|null   $range_to            The end of the range.
	 * @param array|null $filter_values       Additional filter values. Not used at the moment.
	 * @param bool       $granular_result     If the returned result should be granular or only the checksum.
	 * @param bool       $simple_return_value If we want to use a simple return value for non-granular results (return only the checksum, without wrappers).
	 *
	 * @return array|mixed|object|WP_Error|null
	 */
	public function calculate_checksum( $range_from = null, $range_to = null, $filter_values = null, $granular_result = false, $simple_return_value = true ) {
		try {
			$this->validate_input();
		} catch ( Exception $ex ) {
			return new WP_Error( 'invalid_input', $ex->getMessage() );
		}

		$query = $this->build_checksum_query( $range_from, $range_to, $filter_values, $granular_result );

		global $wpdb;

		if ( ! $granular_result ) {
			$result = $wpdb->get_row( $query, ARRAY_A );

			if ( ! is_array( $result ) ) {
				return new WP_Error( 'invalid_query', "Result wasn't an array" );
			}

			if ( $simple_return_value ) {
				return $result['checksum'];
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
