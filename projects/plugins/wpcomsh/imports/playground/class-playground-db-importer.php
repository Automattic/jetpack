<?php
/**
 * Playground_DB_Importer file.
 *
 * @package wpcomsh
 */

namespace Imports;

require_once __DIR__ . '/class-sql-generator.php';

use SQLite3;
use WP_Error;

/**
 * Parses a Playground SQLite database file and generate a SQL file.
 */
class Playground_DB_Importer {
	/**
	 * Name of the table where SQLite map the internal types to the MySQL types.
	 */
	public const SQLITE_DATA_TYPES_TABLE = '_mysql_data_types_cache';

	/**
	 * Name of the table where SQLite store the autoincrement value.
	 */
	public const SQLITE_SEQUENCE_TABLE = 'sqlite_sequence';

	/**
	 * The database connection.
	 *
	 * @var ?SQLite3
	 */
	private ?SQLite3 $db;

	/**
	 * The options.
	 *
	 * @var array
	 */
	private array $options = array();

	/**
	 * Generate a .sql file from a Playground SQLite database file.
	 *
	 * @param string $database_file_path The database file path.
	 * @param array  $options {
	 *     An array of options.
	 *
	 *     @type bool   $all_tables     Generate all tables, not only core. Defaults to true.
	 *     @type string $charset        The charset to use for the generated SQL. Defaults to 'latin1'.
	 *     @type string $collation      The collation to use for the generated SQL. Defaults to null.
	 *     @type array  $exclude_tables A list of tables to exclude from the generated SQL.
	 *     @type string $output_file    The output file path. If not set, a temporary file will be used.
	 *     @type int    $output_mode    Output mode. Defaults to SQL_Generator::OUTPUT_TYPE_STRING.
	 *     @type string $output_prefix  The generated tables prefix.
	 *     @type string $prefix         The input tables prefix. (Always `wp_` for Playground databases)
	 *     @type string $tmp_prefix     The temporary tables prefix.
	 *     @type bool   $tmp_tables     Whether to generate temporary tables instead of TRANSACTION. Defaults to false.
	 * }
	 *
	 * @return string|WP_Error
	 */
	public function generate_sql( string $database_file_path, $options = array() ) {
		global $wpdb;

		$defaults = array(
			'all_tables'     => true,
			'charset'        => 'latin1',
			'collation'      => null,
			'exclude_tables' => array(),
			'output_file'    => null,
			'output_mode'    => SQL_Generator::OUTPUT_TYPE_STRING,
			'output_prefix'  => $wpdb->prefix,
			'prefix'         => 'wp_',
			'tmp_prefix'     => 'tmp_',
			'tmp_tables'     => false,
		);

		$this->options = wp_parse_args( $options, $defaults );

		// Bail if the file doesn't exist.
		if ( ! is_file( $database_file_path ) || ! is_readable( $database_file_path ) ) {
			return new WP_Error( 'database-file-not-exists', 'Database file not exists' );
		}

		// Bail if the file is empty.
		if ( filesize( $database_file_path ) <= 0 ) {
			return new WP_Error( 'database-file-empty', 'Database file is empty' );
		}

		// Set the output file.
		if ( $this->options['output_mode'] === SQL_Generator::OUTPUT_TYPE_FILE ) {
			// If the output file is not set, then use a temporary file.
			if ( empty( $this->options['output_file'] ) ) {
				$this->options['output_file'] = trailingslashit( sys_get_temp_dir() ) . $this->get_tmp_file_name();
			}
		} else {
			$this->options['output_file'] = null;
		}

		try {
			// Try to open the database file.
			$this->db = new SQLite3( $database_file_path, SQLITE3_OPEN_READONLY );
			$this->db->enableExceptions( false );

			$ret = $this->parse_database();

			$this->db->close();

			if ( is_wp_error( $ret ) ) {
				return $ret;
			}

			// Return the file path if the output mode is file.
			if ( $this->options['output_mode'] === SQL_Generator::OUTPUT_TYPE_FILE ) {
				return $this->options['output_file'];
			}

			// Return the SQL string.
			return $ret;
		} catch ( \Exception $e ) {
			$this->db = null;

			return new WP_Error( 'sqlite-open-error', $e->getMessage() );
		}
	}

	/**
	 * Parse the database and load data.
	 *
	 * @return string|WP_Error
	 */
	private function parse_database() {
		global $wpdb;

		if ( ! $this->db ) {
			return new WP_Error( 'no-database-connection', 'No database connection.' );
		}

		// Check if the bind table and the sequence table exist.
		$valid_db = $this->check_database_integrity();

		if ( is_wp_error( $valid_db ) ) {
			return $valid_db;
		}

		$core_tables = array_flip( $wpdb->tables );
		$results     = $this->db->query( 'SELECT name FROM sqlite_master WHERE type=\'table\'' );

		if ( ! $results ) {
			return new WP_Error( 'no-database-master-schema', 'Query error: can\'t read database schema.' );
		}

		$generator = new SQL_Generator();
		$excluded  = is_array( $this->options['exclude_tables'] ) ? $this->options['exclude_tables'] : array();

		if ( $this->options['tmp_tables'] ) {
			$this->options['transaction'] = false;
		}

		$started = $generator->start( $this->options );

		if ( is_wp_error( $started ) ) {
			return $started;
		}

		// Check if the table exists in the core tables list.
		while ( $table = $results->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			$table_name = $this->get_input_table_name( $table['name'] );

			// This is not a core table. Skip if all tables needed.
			if ( ! $this->options['all_tables'] && ! array_key_exists( $table_name, $core_tables ) ) {
				continue;
			}

			// A SQLite internal table. Skip.
			if ( $table_name === self::SQLITE_DATA_TYPES_TABLE || $table_name === self::SQLITE_SEQUENCE_TABLE ) {
				continue;
			}

			// An excluded table. Skip.
			if ( in_array( $table_name, $excluded, true ) ) {
				// Remove the table from the excluded list.
				unset( $excluded[ $table_name ] );

				continue;
			}

			// Get the type map.
			$types_map = $this->get_table_types_map( $table['name'] );

			if ( is_wp_error( $types_map ) ) {
				return $types_map;
			}

			// Force a temporary table name if needed.
			$output_table = $this->get_output_table_name( $table_name );

			$generator->start_table( $output_table, $types_map['map'], $types_map['auto_increment'] );
			$this->generate_inserts( $generator, $table['name'], $types_map['format'], $types_map['field_names'] );
			$generator->end_table_inserts();

			if ( ! $this->options['all_tables'] ) {
				// Remove the table from the core tables list.
				unset( $core_tables[ $table_name ] );
			}
		}

		if ( ! $this->options['all_tables'] ) {
			// If the core tables list is not empty, then there are missing tables.
			if ( ! empty( $core_tables ) ) {
				return new WP_Error( 'missing-tables', 'Query error: missing tables.' );
			}
		}

		$generator->end();

		// Found all the tables, return the SQL.
		return $generator->get_dump();
	}

	/**
	 * Check the database integrity.
	 *
	 * The `_mysql_data_types_cache` and `sqlite_sequence` tables must exist.
	 *
	 * @return bool|WP_Error
	 */
	private function check_database_integrity() {
		// Check if the bind table and the sequence table exist.
		$query = $this->prepare(
			'SELECT COUNT(*) FROM sqlite_master WHERE type=%s AND (name=%s OR name=%s)',
			'table',
			self::SQLITE_DATA_TYPES_TABLE,
			self::SQLITE_SEQUENCE_TABLE
		);
		$count = $this->db->querySingle( $query );

		if ( $count !== 2 ) {
			// Not a real WordPress SQLite database.
			return new WP_Error( 'not-valid-sqlite-file', 'Query error: not a valid SQLite database' );
		}

		return true;
	}

	/**
	 * Generate the table inserts.
	 *
	 * @param SQL_Generator $generator   The SQL generator.
	 * @param string        $table_name  The table name.
	 * @param string        $format      The format string.
	 * @param string        $field_names The field names.
	 *
	 * @return void|WP_Error
	 */
	private function generate_inserts( SQL_Generator $generator, string $table_name, string $format, string $field_names ) {
		$entries = $this->db->query( "SELECT * FROM {$table_name}" );

		if ( ! $entries ) {
			return new WP_Error( 'missing-table', 'Query error: can\'t read source entry.' );
		}

		while ( $entry = $entries->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Prepared outside.
			$generator->table_insert( $field_names, $this->prepare( $format, $entry ) );
		}
	}

	/**
	 * Get the input table name without the prefix.
	 *
	 * @param string $table_name The table name.
	 *
	 * @return string
	 */
	private function get_input_table_name( string $table_name ): string {
		return substr( $table_name, 0, strlen( $this->options['prefix'] ) ) === $this->options['prefix'] ?
			substr( $table_name, strlen( $this->options['prefix'] ) ) :
			$table_name;
	}

	/**
	 * Get the output table name.
	 *
	 * @param string $table_name The table name.
	 *
	 * @return string
	 */
	private function get_output_table_name( string $table_name ): string {
		// Add the temporary prefix, if needed.
		$prefix = $this->options['tmp_tables'] ? $this->options['tmp_prefix'] : '';

		// Add the output prefix, if needed.
		$prefix .= $this->options['output_prefix'] ? $this->options['output_prefix'] : '';

		return $prefix . $table_name;
	}

	/**
	 * Get the table types map.
	 *
	 * @param string $table_name The table name.
	 *
	 * @return array|WP_Error
	 */
	private function get_table_types_map( string $table_name ) {
		if ( ! $this->db ) {
			return new WP_Error( 'no-database-connection', 'No database connection.' );
		}

		// Get the "type map" of the table.
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- SQLITE_DATA_TYPES_TABLE is a constant string.
		$query   = $this->prepare( 'SELECT column_or_index, mysql_type from ' . self::SQLITE_DATA_TYPES_TABLE . ' where `table`=%s;', $table_name );
		$results = $this->db->query( $query );

		if ( ! $results ) {
			return new WP_Error( 'missing-types-cache', 'Query error: missing data types cache' );
		}

		$mysql_map = array();

		// Schema: column_or_index|mysql_type
		while ( $column = $results->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			// May by column name and MySQL type.
			$mysql_map[ $column['column_or_index'] ] = $column['mysql_type'];
		}

		// Get the "table info" of the table.
		$query         = $this->prepare( 'PRAGMA TABLE_INFO(%s)', $table_name );
		$results       = $this->db->query( $query );
		$primary_count = 0;

		if ( ! $results ) {
			return new WP_Error( 'missing-table-info', 'Query error: missing table info' );
		}

		// Our map.
		$map         = array();
		$map_by_name = array();
		$index       = 0;
		$has_autoinc = true;
		$formats     = array();
		$field_names = array();

		// Schema: cid|name|type|notnull|dflt_value|pk
		while ( $column = $results->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			$is_primary    = $column['pk'] >= 1;
			$field_names[] = $column['name'];

			if ( ! array_key_exists( $column['name'], $mysql_map ) ) {
				return new WP_Error( 'missing-column', 'Query error: not a valid SQLite database, missing column' );
			}

			// Add map info.
			$map[] = array(
				'name'           => $column['name'],
				'type'           => $mysql_map[ $column['name'] ],
				'sqlite_type'    => $column['type'],
				'not_null'       => (bool) $column['notnull'],
				'default'        => $column['dflt_value'],
				'primary'        => $is_primary,
				'auto_increment' => $is_primary,
			);

			$map_by_name[ $column['name'] ] = $index;

			if ( $is_primary ) {
				++$primary_count;
			}

			$formats[] = $this->sqlite_type_to_format( $column['type'] );
			++$index;
		}

		// If the primary key is not a single column, then there is not autoincrement.
		if ( $primary_count !== 1 ) {
			$has_autoinc = false;

			foreach ( $map as $index => $column ) {
				$map[ $index ]['auto_increment'] = false;
			}
		}

		// Load table indices.
		$query   = $this->prepare( 'SELECT name, sql FROM sqlite_master WHERE type=\'index\' AND tbl_name=%s', $table_name );
		$results = $this->db->query( $query );

		if ( ! $results ) {
			return new WP_Error( 'missing-table-indices', 'Query error: not a valid SQLite database' );
		}

		// Loop all indices.
		// Schema: name|sql
		while ( $column = $results->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			// Some SQLite columns are not indexed. See https://sqlite.org/forum/info/f16f8ed8666c5e97
			if ( ! array_key_exists( $column['name'], $mysql_map ) ) {
				continue;
			}

			if ( ! in_array( $mysql_map[ $column['name'] ], array( 'KEY', 'UNIQUE' ), true ) ) {
				return new WP_Error( 'missing-index', 'Query error: not a valid SQLite database, missing index' );
			}

			// Strip out the index definition.
			// wp_comments__comment_approved_date_gmt|CREATE INDEX "wp_comments__comment_approved_date_gmt" ON "wp_comments" ("comment_approved", "comment_date_gmt")
			$split_query = explode( '" ON "' . $table_name . '" ', $column['sql'] );
			$real_name   = SQL_Generator::get_index_name( $column['name'] );
			$new_index   = array(
				'name'    => $real_name,
				'type'    => $mysql_map[ $column['name'] ],
				'columns' => str_replace( '"', '`', $split_query[1] ),
			);

			if ( array_key_exists( $real_name, $map_by_name ) ) {
				$index = $map_by_name[ $real_name ];

				if ( $this->needs_191_limit( $map[ $index ] ) ) {
					// See wp_get_db_schema $max_index_length for more info about why '191' must be added.
					$new_index['columns'] = str_replace( '`)', '`(191))', $new_index['columns'] );
				}
			}

			$map[] = $new_index;
		}

		$auto_increment = 0;

		if ( $has_autoinc ) {
			$auto_increment = $this->get_table_autoincrement( $table_name );
		}

		return array(
			'map'            => $map,
			'auto_increment' => $auto_increment,
			'field_names'    => '(`' . implode( '`,`', $field_names ) . '`)',
			'format'         => '(' . implode( ',', $formats ) . ')',
		);
	}

	/**
	 * Get the SQLite type to MySQL format.
	 *
	 * @param string $type The SQLite type.
	 *
	 * @return string
	 */
	private function sqlite_type_to_format( string $type ): string {
		switch ( $type ) {
			case 'integer':
				return '%d';
			case 'real':
				return '%f';
			case 'text':
				return '%s';
			case 'blob':
				return '%s';
			case 'null':
				return '%s';
			default:
				return '%s';
		}
	}

	/**
	 * Check if the maximum index length of 191 must be added.
	 *
	 * @see wp_get_db_schema $max_index_length for more info.
	 *
	 * @param array $key_map The key map.
	 *
	 * @return bool
	 */
	private function needs_191_limit( array $key_map ): bool {
		if ( $key_map['sqlite_type'] !== 'text' ) {
			return false;
		}

		// Check if the column type is a text type.
		$ret = in_array( $key_map['type'], array( 'text', 'tinytext', 'mediumtext', 'longtext' ), true );

		if ( $ret ) {
			return $ret;
		}

		// Check if the string is of type varchar(255).
		$matches = null;
		preg_match( '/varchar\((\d+)\)/', $key_map['type'], $matches );

		if ( isset( $matches[1] ) ) {
			// The limit must be added only if the column length is greater than 191.
			return (int) $matches[1] > 191;
		}

		return false;
	}

	/**
	 * Get the table autoincrement value.
	 *
	 * @param string $table_name The table name.
	 *
	 * @return int
	 */
	private function get_table_autoincrement( $table_name ): int {
		$query = $this->prepare( 'SELECT seq from ' . self::SQLITE_SEQUENCE_TABLE . ' WHERE name=%s', $table_name );

		return $this->db->querySingle( $query ) ?? 0;
	}

	/**
	 * Get an export random file name.
	 *
	 * @return string
	 */
	private function get_tmp_file_name(): string {
		// A random string to avoid collisions.
		return 'sqlite-export-' . uniqid() . '.sql';
	}

	/**
	 * Prepare a query.
	 *
	 * @param string $query The query.
	 * @param mixed  ...$args The arguments.
	 *
	 * @return string|void
	 */
	private function prepare( $query, ...$args ) {
		global $wpdb;

		$query = call_user_func_array( array( $wpdb, 'prepare' ), array_merge( array( $query ), $args ) );

		if ( is_string( $query ) ) {
			return $wpdb->remove_placeholder_escape( $query );
		}
	}
}
