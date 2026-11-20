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
	public const SQLITE_DATA_TYPES_TABLE = '_wp_sqlite_mysql_information_schema_columns';

	/**
	 * Name of the table where SQLite store the autoincrement value.
	 */
	public const SQLITE_SEQUENCE_TABLE = 'sqlite_sequence';

	/**
	 * Name of the table where SQLite stores the MySQL index definitions.
	 */
	public const SQLITE_INDEXES_TABLE = '_wp_sqlite_mysql_information_schema_statistics';

	/**
	 * The most bytes MySQL allows in a row, not counting TEXT and BLOB columns.
	 */
	private const MAX_ROW_SIZE = 65535;

	/**
	 * MySQL's spatial column types.
	 */
	private const GEOMETRY_TYPES = array( 'geometry', 'point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon', 'geometrycollection', 'geomcollection' );

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
	 *     @type string $prefix         The input tables prefix, usually the backup's `$table_prefix`. Used when the
	 *                                  database has that prefix's options table; otherwise it's detected. Defaults to `wp_`.
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

			$this->options['prefix'] = $this->get_input_prefix( (string) $this->options['prefix'] );

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

			// SQLite internal tables. Skip.
			if ( ! $this->is_valid_table( $table_name ) ) {
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
			} elseif ( empty( $types_map['map'] ) ) {
				continue;
			}

			// Force a temporary table name if needed.
			$output_table = $this->get_output_table_name( $table_name );

			$generator->start_table( $output_table, $types_map['map'], $types_map['auto_increment'] );
			$this->generate_inserts( $generator, $table['name'], $types_map );
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
	 * @param SQL_Generator $generator  The SQL generator.
	 * @param string        $table_name The table name.
	 * @param array         $types_map  The table types map.
	 *
	 * @return void|WP_Error
	 */
	private function generate_inserts( SQL_Generator $generator, string $table_name, array $types_map ) {
		$select = '*';

		// Read spatial values as BLOBs. As text, SQLite stops at the first NUL byte, and MySQL's binary geometry starts with one.
		if ( ! empty( $types_map['geometry'] ) ) {
			$fields = array();

			foreach ( $types_map['columns'] as $i => $name ) {
				$quoted   = '"' . str_replace( '"', '""', $name ) . '"';
				$fields[] = isset( $types_map['geometry'][ $i ] ) ? "CAST({$quoted} AS BLOB) AS {$quoted}" : $quoted;
			}

			$select = implode( ', ', $fields );
		}

		$entries = $this->db->query( "SELECT {$select} FROM {$table_name}" );

		if ( ! $entries ) {
			return new WP_Error( 'missing-table', 'Query error: can\'t read source entry.' );
		}

		while ( $entry = $entries->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			$generator->table_insert( $types_map['field_names'], $this->prepare_row( $types_map['formats'], array_values( $entry ), $types_map['geometry'] ) );
		}
	}

	/**
	 * Format a row's values for an INSERT, keeping NULL as NULL.
	 *
	 * `wpdb::prepare()` writes NULL as `''`, which MySQL stores as `0` in a number column or as `''`. Two
	 * of those in a UNIQUE index, like Borlabs Cookie's or MailPoet's nullable unique columns, collide
	 * and fail the restore with a duplicate entry error.
	 *
	 * @param string[] $formats  The format of each column.
	 * @param array    $values   The row's values, in column order.
	 * @param array    $geometry The spatial columns' types and nullability, by column position.
	 *
	 * @return string
	 */
	private function prepare_row( array $formats, array $values, array $geometry = array() ): string {
		$placeholders = array();
		$args         = array();

		foreach ( $values as $i => $value ) {
			if ( isset( $geometry[ $i ] ) ) {
				$placeholders[] = $this->get_geometry_value( $value, $geometry[ $i ]['type'], $geometry[ $i ]['not_null'] );
				continue;
			}

			if ( null === $value ) {
				$placeholders[] = 'NULL';
				continue;
			}

			$placeholders[] = $formats[ $i ] ?? '%s';
			$args[]         = $value;
		}

		$row = '(' . implode( ',', $placeholders ) . ')';

		return empty( $args ) ? $row : (string) $this->prepare( $row, $args );
	}

	/**
	 * Write a spatial value as MySQL geometry.
	 *
	 * SQLite has no spatial types, so a `POINT` or `GEOMETRY` column holds whatever text the site wrote: WKT like
	 * `POINT(1 2)`, MySQL's own binary geometry (an SRID, then WKB) from a site pulled from MySQL, plain WKB, or
	 * an empty string. MySQL only takes its binary form, and fails the restore on anything else with ERROR 1416.
	 * WKT and WKB are converted, and a value that isn't geometry becomes NULL, or an empty-as-possible geometry
	 * of the column's type if the column is NOT NULL.
	 *
	 * @param mixed  $value    The SQLite value.
	 * @param string $type     The column's MySQL type, like `point`.
	 * @param bool   $not_null Whether the column is NOT NULL.
	 *
	 * @return string The SQL expression.
	 */
	private function get_geometry_value( $value, string $type, bool $not_null ): string {
		if ( null !== $value && '' !== $value ) {
			$value = (string) $value;

			if ( preg_match( '/^\s*(SRID=(\d+);)?\s*((MULTI)?(POINT|LINESTRING|POLYGON)|GEOM(ETRY)?COLLECTION)\s*(\(|EMPTY)/i', $value, $matches ) ) {
				$wkt = $matches[1] ? substr( ltrim( $value ), strlen( $matches[1] ) ) : $value;

				return (string) $this->prepare( 'ST_GeomFromText(%s, %d)', trim( $wkt ), (int) ( $matches[2] ?? 0 ) );
			}

			// MySQL's binary geometry: a 4-byte SRID, then WKB.
			if ( self::is_wkb( substr( $value, 4 ) ) ) {
				return '0x' . bin2hex( $value );
			}

			if ( self::is_wkb( $value ) ) {
				return 'ST_GeomFromWKB(0x' . bin2hex( $value ) . ')';
			}
		}

		if ( ! $not_null ) {
			return 'NULL';
		}

		$empty = array(
			'linestring'      => 'LINESTRING(0 0,0 0)',
			'polygon'         => 'POLYGON((0 0,0 0,0 0,0 0))',
			'multipoint'      => 'MULTIPOINT(0 0)',
			'multilinestring' => 'MULTILINESTRING((0 0,0 0))',
			'multipolygon'    => 'MULTIPOLYGON(((0 0,0 0,0 0,0 0)))',
		);

		return "ST_GeomFromText('" . ( $empty[ $type ] ?? 'POINT(0 0)' ) . "')";
	}

	/**
	 * Whether a value starts like WKB: a byte order of 0 or 1, then a geometry type from 1 to 7.
	 *
	 * @param string $value The value.
	 *
	 * @return bool
	 */
	private static function is_wkb( string $value ): bool {
		if ( strlen( $value ) < 9 || ! in_array( $value[0], array( "\x00", "\x01" ), true ) ) {
			return false;
		}

		$type = unpack( "\x01" === $value[0] ? 'V' : 'N', substr( $value, 1, 4 ) )[1];

		return $type >= 1 && $type <= 7;
	}

	/**
	 * Get the prefix of the database's WordPress tables.
	 *
	 * Studio sites pulled from a site that uses another table prefix, like `wpx_`, keep it. The
	 * requested prefix is used when its options table holds a site URL. Otherwise, the prefix of the
	 * options table that does is used, preferring `wp_`.
	 *
	 * @param string $requested_prefix The prefix to use when its options table exists.
	 *
	 * @return string
	 */
	private function get_input_prefix( string $requested_prefix ): string {
		$prefixes = array();
		$results  = $this->db->query( "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%options'" );

		while ( $results && $table = $results->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			$table_name = $table['name'];
			$prefix     = substr( $table_name, 0, -strlen( 'options' ) );

			// Only a WordPress options table holds a site URL. Other tables return false here.
			$query = $this->prepare( 'SELECT COUNT(*) FROM "' . str_replace( '"', '""', $table_name ) . '" WHERE option_name = %s', 'siteurl' );

			if ( @$this->db->querySingle( $query ) > 0 ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				$prefixes[] = $prefix;
			}
		}

		foreach ( array( $requested_prefix, 'wp_' ) as $prefix ) {
			if ( in_array( $prefix, $prefixes, true ) ) {
				return $prefix;
			}
		}

		return count( $prefixes ) === 1 ? $prefixes[0] : $requested_prefix;
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
		$query   = $this->prepare( 'SELECT COLUMN_NAME, COLUMN_TYPE, EXTRA from ' . self::SQLITE_DATA_TYPES_TABLE . ' where `TABLE_NAME`=%s;', $table_name );
		$results = $this->db->query( $query );

		if ( ! $results ) {
			return new WP_Error( 'missing-types-cache', 'Query error: missing data types cache' );
		}

		$mysql_map      = array();
		$auto_increment = array();

		// Schema: COLUMN_NAME|COLUMN_TYPE|EXTRA
		while ( $column = $results->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			// Map by column name and MySQL type.
			$mysql_map[ $column['COLUMN_NAME'] ] = $column['COLUMN_TYPE'];

			// Keep AUTO_INCREMENT only where the site's schema has it. A primary key like `id varchar(64)` has none,
			// and MySQL rejects AUTO_INCREMENT on a non-integer column.
			$auto_increment[ $column['COLUMN_NAME'] ] = false !== stripos( (string) $column['EXTRA'], 'auto_increment' );
		}

		// Tables like `'_wp_sqlite_*` do not have entries in the `_wp_sqlite_mysql_information_schema_columns` table.
		// In this case, we return an empty map.
		if ( empty( $mysql_map ) ) {
			return array(
				'map'            => array(),
				'auto_increment' => 0,
				'field_names'    => null,
				'format'         => null,
			);
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
				return new WP_Error(
					'missing-column',
					sprintf( 'Query error: not a valid SQLite table "%s", missing column "%s"', $table_name, $column['name'] )
				);
			}

			// Add map info.
			$map[] = array(
				'name'           => $column['name'],
				'type'           => $mysql_map[ $column['name'] ],
				'sqlite_type'    => $column['type'],
				'not_null'       => (bool) $column['notnull'],
				'default'        => $column['dflt_value'],
				'primary'        => $is_primary,
				'auto_increment' => $is_primary && $auto_increment[ $column['name'] ],
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

		// Load the table's indices as MySQL defined them, with their real names and prefix lengths.
		$schema_indexes = $this->get_schema_indexes( $table_name );
		if ( $schema_indexes !== null ) {
			$map = array_merge( $map, $schema_indexes );

			return $this->finish_table_types_map( $table_name, $map, $has_autoinc, $field_names, $formats );
		}

		// Fall back to the SQLite indices, for databases without the MySQL index definitions.
		$query   = $this->prepare( 'SELECT name, sql FROM sqlite_master WHERE type=\'index\' AND tbl_name=%s', $table_name );
		$results = $this->db->query( $query );

		if ( ! $results ) {
			return new WP_Error( 'missing-table-indices', 'Query error: not a valid SQLite database' );
		}

		// Loop all indices.
		// Schema: name|sql
		while ( $column = $results->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			// Some SQLite columns are not indexed. See https://sqlite.org/forum/info/f16f8ed8666c5e97
			if ( $column['sql'] === null ) {
				continue;
			}

			// Strip out the index definition.
			// wp_comments__comment_approved_date_gmt|CREATE INDEX "wp_comments__comment_approved_date_gmt" ON "wp_comments" ("comment_approved", "comment_date_gmt")
			$split_query = explode( '` ON `' . $table_name . '` ', $column['sql'] );
			$real_name   = SQL_Generator::get_index_name( $column['name'] );
			$new_index   = array(
				'name'    => $real_name,
				'type'    => ( strpos( $column['sql'], 'CREATE UNIQUE INDEX' ) === 0 ) ? 'UNIQUE' : 'KEY',
				'columns' => $split_query[1],
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

		return $this->finish_table_types_map( $table_name, $map, $has_autoinc, $field_names, $formats );
	}

	/**
	 * The table's indices from the MySQL index definitions the SQLite driver keeps.
	 *
	 * SQLite's own indices lose MySQL's prefix lengths, like TranslatePress's `original`(100) on a text column,
	 * and their names are rebuilt from `<table>__<index>`, which breaks on index names containing `__`.
	 *
	 * @param string $table_name The table name.
	 *
	 * @return array|null The index map entries, or null if the definitions aren't available.
	 */
	private function get_schema_indexes( string $table_name ): ?array {
		$query = $this->prepare( 'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=%s', self::SQLITE_INDEXES_TABLE );
		if ( ! $this->db->querySingle( $query ) ) {
			return null;
		}

		$query   = $this->prepare( 'SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, SUB_PART, INDEX_TYPE FROM ' . self::SQLITE_INDEXES_TABLE . ' WHERE TABLE_NAME=%s ORDER BY rowid', $table_name );
		$results = $this->db->query( $query );
		if ( ! $results ) {
			return null;
		}

		$indexes = array();
		while ( $row = $results->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			// The primary key is output from the columns.
			if ( $row['INDEX_NAME'] === 'PRIMARY' ) {
				continue;
			}

			$name = $row['INDEX_NAME'];
			if ( ! isset( $indexes[ $name ] ) ) {
				if ( in_array( strtoupper( (string) $row['INDEX_TYPE'] ), array( 'FULLTEXT', 'SPATIAL' ), true ) ) {
					$type = strtoupper( (string) $row['INDEX_TYPE'] );
				} else {
					$type = ( (int) $row['NON_UNIQUE'] === 0 ) ? 'UNIQUE' : 'KEY';
				}

				$indexes[ $name ] = array(
					'name'    => $name,
					'type'    => $type,
					'columns' => array(),
				);
			}

			// A spatial index has no prefix length. The SQLite driver reports one of 32.
			$sub_part = 'SPATIAL' === $indexes[ $name ]['type'] ? null : $row['SUB_PART'];

			$indexes[ $name ]['columns'][ (int) $row['SEQ_IN_INDEX'] ] = '`' . $row['COLUMN_NAME'] . '`' . ( $sub_part ? '(' . (int) $sub_part . ')' : '' );
		}

		// Keep the indices in creation order, and their columns in index order.
		foreach ( $indexes as $name => $index ) {
			ksort( $index['columns'] );
			$indexes[ $name ]['columns'] = '(' . implode( ', ', $index['columns'] ) . ')';
		}

		return array_values( $indexes );
	}

	/**
	 * Apply the index hot fixes and build the table types map.
	 *
	 * @param string $table_name  The table name.
	 * @param array  $map         The columns and indices map.
	 * @param bool   $has_autoinc Whether the table has an AUTO_INCREMENT column.
	 * @param array  $field_names The field names.
	 * @param array  $formats     The field formats.
	 *
	 * @return array
	 */
	private function finish_table_types_map( string $table_name, array $map, bool $has_autoinc, array $field_names, array $formats ): array {
		// Hot fix: add the missing index sizes. The fixes are listed under the `wp_` prefix.
		$map = $this->hot_fix_missing_indexes( 'wp_' . $this->get_input_table_name( $table_name ), $map );
		$map = $this->fit_row_size( $map );

		$auto_increment = 0;

		if ( $has_autoinc ) {
			$auto_increment = $this->get_table_autoincrement( $table_name );
		}

		return array(
			'map'            => $map,
			'auto_increment' => $auto_increment,
			'field_names'    => '(`' . implode( '`,`', $field_names ) . '`)',
			'format'         => '(' . implode( ',', $formats ) . ')',
			'formats'        => $formats,
			'columns'        => $field_names,
			'geometry'       => $this->get_geometry_columns( $map ),
		);
	}

	/**
	 * The table's spatial columns, by column position.
	 *
	 * @param array $map The columns and indices map.
	 *
	 * @return array
	 */
	private function get_geometry_columns( array $map ): array {
		$geometry = array();
		$position = 0;

		foreach ( $map as $column ) {
			if ( ! array_key_exists( 'sqlite_type', $column ) ) {
				continue;
			}

			$type = strtolower( (string) strtok( $column['type'], ' (' ) );

			if ( in_array( $type, self::GEOMETRY_TYPES, true ) ) {
				$geometry[ $position ] = array(
					'type'     => $type,
					'not_null' => ! empty( $column['not_null'] ),
				);
			}

			++$position;
		}

		return $geometry;
	}

	/**
	 * Turn the widest VARCHAR and VARBINARY columns into TEXT and BLOB until the row fits in MySQL.
	 *
	 * MySQL limits a row's columns, not counting TEXT and BLOB, to 65,535 bytes, and fails the restore with
	 * ERROR 1118 past that. SQLite has no such limit, so a table with many wide VARCHAR columns works there.
	 * Indexed columns are kept, since a TEXT column needs a prefix length to be indexed.
	 *
	 * @param array $map The columns and indices map.
	 *
	 * @return array
	 */
	private function fit_row_size( array $map ): array {
		$bytes_per_char = array(
			'latin1'  => 1,
			'utf8'    => 3,
			'utf8mb3' => 3,
		);
		$charset        = strtolower( (string) ( $this->options['charset'] ?? 'latin1' ) );
		$mb             = $bytes_per_char[ $charset ] ?? 4;
		$indexed        = array();
		$sizes          = array();
		$nullable       = 0;

		foreach ( $map as $column ) {
			if ( ! array_key_exists( 'sqlite_type', $column ) ) {
				preg_match_all( '/`([^`]+)`/', (string) ( $column['columns'] ?? '' ), $matches );
				$indexed = array_merge( $indexed, $matches[1] );
			}
		}

		foreach ( $map as $i => $column ) {
			if ( ! array_key_exists( 'sqlite_type', $column ) ) {
				continue;
			}

			$sizes[ $i ] = self::get_column_size( (string) $column['type'], $mb );
			$nullable   += empty( $column['not_null'] ) ? 1 : 0;
		}

		$total = array_sum( array_column( $sizes, 'bytes' ) ) + (int) ceil( $nullable / 8 );

		if ( $total <= self::MAX_ROW_SIZE ) {
			return $map;
		}

		// Widest first.
		uasort(
			$sizes,
			function ( $a, $b ) {
				return $b['bytes'] <=> $a['bytes'];
			}
		);

		foreach ( $sizes as $i => $size ) {
			if ( $total <= self::MAX_ROW_SIZE ) {
				break;
			}

			if ( null === $size['long_type'] || ! empty( $map[ $i ]['primary'] ) || in_array( $map[ $i ]['name'], $indexed, true ) ) {
				continue;
			}

			$map[ $i ]['type'] = $size['long_type'];

			// MySQL takes a TEXT or BLOB default only as an expression.
			if ( isset( $map[ $i ]['default'] ) && 'NULL' !== strtoupper( (string) $map[ $i ]['default'] ) ) {
				$map[ $i ]['default'] = '(' . $map[ $i ]['default'] . ')';
			}

			// A TEXT or BLOB column counts as 12 bytes, at most.
			$total -= $size['bytes'] - 12;
		}

		return $map;
	}

	/**
	 * A column's size in a MySQL row, and the TEXT or BLOB type it can become.
	 *
	 * @param string $type The MySQL column type, like `varchar(255)`.
	 * @param int    $mb   The bytes per character.
	 *
	 * @return array {
	 *     @type int         $bytes     The column's size, in bytes.
	 *     @type string|null $long_type The TEXT or BLOB type it can become, or null.
	 * }
	 */
	private static function get_column_size( string $type, int $mb ): array {
		$type   = strtolower( $type );
		$length = preg_match( '/\((\d+)/', $type, $matches ) ? (int) $matches[1] : 1;
		$name   = (string) strtok( $type, ' (' );
		$fixed  = array(
			'tinyint'   => 1,
			'smallint'  => 2,
			'mediumint' => 3,
			'int'       => 4,
			'integer'   => 4,
			'bigint'    => 8,
			'float'     => 4,
			'double'    => 8,
			'real'      => 8,
			'date'      => 3,
			'time'      => 6,
			'year'      => 1,
			'datetime'  => 8,
			'timestamp' => 7,
			'enum'      => 2,
			'set'       => 8,
			'bit'       => 8,
			'decimal'   => 30,
			'numeric'   => 30,
		);

		switch ( $name ) {
			case 'varchar':
				$bytes = $length * $mb;
				return array(
					'bytes'     => $bytes + ( $bytes > 255 ? 2 : 1 ),
					'long_type' => $bytes > 65535 ? 'mediumtext' : 'text',
				);
			case 'varbinary':
				return array(
					'bytes'     => $length + ( $length > 255 ? 2 : 1 ),
					'long_type' => 'blob',
				);
			case 'char':
				return array(
					'bytes'     => $length * $mb,
					'long_type' => null,
				);
			case 'binary':
				return array(
					'bytes'     => $length,
					'long_type' => null,
				);
		}

		return array(
			'bytes'     => $fixed[ $name ] ?? 12,
			'long_type' => null,
		);
	}

	/**
	 * Get the SQLite type to MySQL format.
	 *
	 * @param string $type The SQLite type.
	 *
	 * @return string
	 */
	public function sqlite_type_to_format( string $type ): string {
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
	public function needs_191_limit( array $key_map ): bool {
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
	public function get_tmp_file_name(): string {
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

	/**
	 * Hot fix: add the missing index sizes. The default SQLite driver do not
	 * generate index sizes and sometimes the indexes are not valid when made of
	 * multiple text and integer columns and are more than 191 characters.
	 *
	 * Known columns are from WooCommerce.
	 *
	 * Example:
	 * KEY `order_id_meta_key_meta_value` (`order_id`, `meta_key`, `meta_value`)
	 *
	 * should be:
	 * KEY `order_id_meta_key_meta_value` (`order_id`,`meta_key`(100),`meta_value`(82))
	 *
	 * Once we have a better SQLite driver, we can remove this function.
	 *
	 * @param string $table_name The table name.
	 * @param array  $map The columns map.
	 *
	 * @return array
	 */
	public function hot_fix_missing_indexes( string $table_name, array $map ) {
		// Fix: the default SQLite driver do not generate save index sizes.
		$fix_map = array(
			'wp_wc_orders'                           => array(
				'customer_id_billing_email' => '(`customer_id`,`billing_email`(171))',
			),
			'wp_wc_orders_meta'                      => array(
				'meta_key_value'               => '(`meta_key`(100),`meta_value`(82))',
				'order_id_meta_key_meta_value' => '(`order_id`,`meta_key`(100),`meta_value`(82))',
			),
			'wp_woocommerce_downloadable_product_permissions' => array(
				'download_order_key_product' => '(`product_id`,`order_id`,`order_key`(16),`download_id`)',
			),
			'wp_woocommerce_shipping_zone_locations' => array(
				'location_type_code' => '(`location_type`(10),`location_code`(20))',
			),
			'wp_woocommerce_tax_rate_locations'      => array(
				'location_type_code' => '(`location_type`(10),`location_code`(20))',
			),
		);

		if ( ! array_key_exists( $table_name, $fix_map ) ) {
			// No fix for this table.
			return $map;
		}

		foreach ( $map as $i => $column ) {
			if ( array_key_exists( $column['name'], $fix_map[ $table_name ] ) ) {
				// Hot fix: add the missing index sizes.
				$map[ $i ]['columns'] = $fix_map[ $table_name ][ $column['name'] ];
			}
		}

		return $map;
	}

	/**
	 * Check if the table is valid.
	 *
	 * @param string $table_name The table name.
	 *
	 * @return bool
	 */
	public function is_valid_table( string $table_name ): bool {
		// Skip SQLite internal tables.
		if ( $table_name === self::SQLITE_DATA_TYPES_TABLE || $table_name === self::SQLITE_SEQUENCE_TABLE ) {
			return false;
		}

		// Skip WordPress internal tables.
		if ( strpos( $table_name, '_wp_sqlite' ) === 0 ) {
			return false;
		}

		return true;
	}
}
