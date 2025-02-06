<?php
/**
 * SQL_Generator file.
 *
 * @package wpcomsh
 */

namespace Imports;

use WP_Error;

/**
 * Generate a SQL file from metadata.
 */
class SQL_Generator {
	const OUTPUT_TYPE_FILE   = 0;
	const OUTPUT_TYPE_STRING = 1;
	const OUTPUT_TYPE_STDOUT = 2;

	const DEFAULT_CHARSET   = 'utf8mb4';
	const DEFAULT_COLLATION = 'utf8mb4_unicode_520_ci';

	/**
	 * The output type.
	 *
	 * @var int
	 */
	private int $output_mode = self::OUTPUT_TYPE_STRING;

	/**
	 * The output file.
	 *
	 * @var string|resource|null
	 */
	private $output_handle = '';

	/**
	 * The current table.
	 *
	 * @var ?string
	 */
	private $current_table = null;

	/**
	 * The current insert index.
	 *
	 * @var int
	 */
	private $current_insert_index = 0;

	/**
	 * Whether the dump has started.
	 *
	 * @var bool
	 */
	private $started = false;

	/**
	 * Whether to use transactions.
	 *
	 * @var bool
	 */
	private $transaction = true;

	/**
	 * The collation.
	 *
	 * @var ?string
	 */
	private $collation = null;

	/**
	 * The collation.
	 *
	 * @var string
	 */
	private $charset = self::DEFAULT_CHARSET;

	/**
	 * SQL_Generator destructor.
	 */
	public function __destruct() {
		$this->reset();
	}

	/**
	 * MySQL `--` comment.
	 *
	 * @param string $comment The comment.
	 *
	 * @return void
	 */
	public function comment( string $comment ) {
		$this->output( "-- {$comment}" );
	}

	/**
	 * An empty line.
	 *
	 * @return void
	 */
	public function nl() {
		$this->output();
	}

	/**
	 * An SQL query.
	 *
	 * @param string $query The query.
	 * @param bool   $nl    Whether to add a new line at the end.
	 *
	 * @return void
	 */
	public function output( string $query = '', $nl = true ) {
		if ( $nl ) {
			$query .= "\n";
		}

		if ( $this->output_mode === self::OUTPUT_TYPE_STDOUT ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo $query;
		} elseif ( $this->output_mode === self::OUTPUT_TYPE_STRING ) {
			$this->output_handle .= $query;
		} elseif ( $this->output_mode === self::OUTPUT_TYPE_FILE ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
			fwrite( $this->output_handle, $query );
		}
	}

	/**
	 * A variable assignment.
	 *
	 * @param string $variable The variable name.
	 * @param string $value    The variable value.
	 * @param int    $version  The MySQL version when the variable was introduced.
	 *
	 * @return void
	 *
	 * @see https://dev.mysql.com/doc/refman/8.2/en/set-variable.html
	 */
	public function var_assignment( string $variable, string $value, int $version = 40101 ) {
		$this->output( "/*!{$version} SET {$variable}={$value} */;" );
	}

	/**
	 * A SET statement.
	 *
	 * @param string $content The SET statement content.
	 * @param int    $version The MySQL version when the statement was introduced.
	 *
	 * @see https://dev.mysql.com/doc/refman/8.2/en/set-statement.html
	 */
	public function var( string $content, int $version = 40101 ) {
		$this->output( "/*!{$version} {$content} */;" );
	}

	/**
	 * A three-line comment header.
	 *
	 * @param string $title The title.
	 *
	 * @return void
	 */
	public function header( $title ) {
		$this->comment( '' );
		$this->comment( $title );
		$this->comment( '' );
		$this->nl();
	}

	/**
	 * Start the dump. This should be called before any other methods.
	 *
	 * @param array $options The options.
	 *
	 * @return bool|WP_Error
	 */
	public function start( $options = array() ) {
		$defaults = array(
			'charset'     => self::DEFAULT_CHARSET,
			'collation'   => null,
			'output_file' => null,
			'output_mode' => self::OUTPUT_TYPE_STRING,
			'transaction' => true,
		);

		$options = wp_parse_args( $options, $defaults );

		// Reset the output.
		$this->reset();

		$this->output_mode = $options['output_mode'];

		if ( $this->output_mode === self::OUTPUT_TYPE_STDOUT ) {
			$this->output_handle = null;
		} elseif ( $this->output_mode === self::OUTPUT_TYPE_STRING ) {
			$this->output_handle = '';
		} elseif ( $this->output_mode === self::OUTPUT_TYPE_FILE ) {
			if ( is_dir( $options['output_file'] ) ) {
				return new WP_Error( 'output-open-error', 'Output file is a directory.' );
			}

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
			$file_handle = fopen( $options['output_file'], 'a' );

			if ( $file_handle === false ) {
				return new WP_Error( 'output-open-error', 'Error opening output file.' );
			}

			$this->output_handle = $file_handle;
		}

		$this->started     = true;
		$this->transaction = $options['transaction'];
		$this->collation   = $options['collation'];
		$this->charset     = $options['charset'];

		// Start the dump header.
		$this->header( 'Playground SQLite MySQL dump' );

		$this->output( 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";' );

		if ( $this->transaction ) {
			$this->output( 'START TRANSACTION;' );
		}

		$this->output( 'SET time_zone = "+00:00";' );
		$this->nl();

		// Various MySQL settings.
		$this->var_assignment( '@OLD_CHARACTER_SET_CLIENT', '@@CHARACTER_SET_CLIENT' );
		$this->var_assignment( '@OLD_CHARACTER_SET_RESULTS', '@@CHARACTER_SET_RESULTS' );
		$this->var_assignment( '@OLD_COLLATION_CONNECTION', '@@COLLATION_CONNECTION ' );
		$this->var( 'SET NAMES ' . $this->charset );
		$this->var_assignment( '@OLD_TIME_ZONE', '@@TIME_ZONE', 40103 );
		$this->var_assignment( 'TIME_ZONE', '\'+00:00\'', 40103 );
		$this->var_assignment( '@OLD_UNIQUE_CHECKS', '@@UNIQUE_CHECKS, UNIQUE_CHECKS=0', 40014 );
		$this->var_assignment( '@OLD_FOREIGN_KEY_CHECKS', '@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0', 40014 );
		$this->var_assignment( '@OLD_SQL_MODE', '@@SQL_MODE, SQL_MODE=\'NO_AUTO_VALUE_ON_ZERO\'' );
		$this->var_assignment( '@OLD_SQL_NOTES', '@@SQL_NOTES, SQL_NOTES=0', 40111 );
		$this->nl();

		return true;
	}

	/**
	 * End the dump. This should be called after all other methods.
	 */
	public function end() {
		// Not started, return.
		if ( ! $this->started ) {
			return;
		}

		if ( $this->transaction ) {
			// End transaction.
			$this->output( 'COMMIT;' );
		}

		// Various MySQL settings.
		$this->var_assignment( 'TIME_ZONE', '@OLD_TIME_ZONE', 40103 );
		$this->var_assignment( 'SQL_MODE', '@OLD_SQL_MODE' );
		$this->var_assignment( 'FOREIGN_KEY_CHECKS', '@OLD_FOREIGN_KEY_CHECKS', 40014 );
		$this->var_assignment( 'UNIQUE_CHECKS', '@OLD_UNIQUE_CHECKS', 40014 );
		$this->var_assignment( 'CHARACTER_SET_CLIENT', '@OLD_CHARACTER_SET_CLIENT' );
		$this->var_assignment( 'CHARACTER_SET_RESULTS', '@OLD_CHARACTER_SET_RESULTS' );
		$this->var_assignment( 'COLLATION_CONNECTION', '@OLD_COLLATION_CONNECTION' );
		$this->var_assignment( 'SQL_NOTES', '@OLD_SQL_NOTES', 40111 );
		$this->nl();
		$this->comment( 'Dump completed on ' . gmdate( 'Y-m-d H:i:s' ) );
	}

	/**
	 * Create a table.
	 *
	 * @param string $table_name     The table name.
	 * @param array  $types_map      The types map.
	 * @param int    $auto_increment The auto increment value.
	 * @param bool   $add_drop       Whether to add a DROP TABLE statement.
	 *
	 * @return void
	 */
	public function start_table( string $table_name, array $types_map, int $auto_increment, bool $add_drop = true ) {
		$this->start_table_creation( $table_name, $add_drop );

		$indexes      = array();
		$columns      = array();
		$primary_keys = array();

		// Output the columns.
		foreach ( $types_map as $column ) {
			if ( $column['type'] === 'UNIQUE' || $column['type'] === 'KEY' ) {
				$indexes[] = $column;

				continue;
			}

			$columns[] = $this->get_column( $column['name'], $column );

			// Save up the PRIMARY column for later.
			if ( $column['primary'] ) {
				$primary_keys[] = '`' . $column['name'] . '`';
				continue;
			}
		}

		if ( count( $primary_keys ) ) {
			// Add the PRIMARY KEY
			$columns[] = 'PRIMARY KEY (' . implode( ',', $primary_keys ) . ')';
		}

		foreach ( $indexes as $index ) {
			$index_list = $index['columns'];
			$key_type   = $index['type'] === 'UNIQUE' ? 'UNIQUE KEY' : 'KEY';

			// Output the keys.
			$columns[] = "{$key_type} `{$index['name']}` {$index_list}";
		}

		if ( count( $columns ) > 0 ) {
			$columns[0] = '  ' . $columns[0];
			$this->output( implode( ",\n  ", $columns ) );
		}

		$this->end_table_creation( $table_name, $auto_increment );
	}

	/**
	 * Start table inserts. Disable keys.
	 *
	 * @return void
	 */
	public function start_table_inserts() {
		if ( ! $this->current_table ) {
			return;
		}

		$this->header( "Dumping data for table `{$this->current_table}`" );
		$this->output( "LOCK TABLES `{$this->current_table}` WRITE;" );
		$this->var( "ALTER TABLE `{$this->current_table}` DISABLE KEYS", 40000 );

		$this->current_insert_index = 0;
	}

	/**
	 * Generate an INSERT statement.
	 *
	 * @param string $field_names The field names.
	 * @param string $data        The data.
	 *
	 * @return void
	 */
	public function table_insert( string $field_names, string $data ) {
		if ( ! $this->current_table ) {
			return;
		}

		if ( $this->current_insert_index === 0 ) {
			$this->output( "INSERT INTO `{$this->current_table}` {$field_names} VALUES" );
		} else {
			$this->output( ',' );
		}

		$this->output( $data, false );

		++$this->current_insert_index;
	}

	/**
	 * End table inserts. Enable keys.
	 *
	 * @return void
	 */
	public function end_table_inserts() {
		if ( ! $this->current_table ) {
			return;
		}

		if ( $this->current_insert_index > 0 ) {
			$this->output( ';' );
		}

		$this->var( "ALTER TABLE `{$this->current_table}` ENABLE KEYS", 40000 );
		$this->output( 'UNLOCK TABLES;' );
		$this->nl();

		$this->current_insert_index = 0;
	}

	/**
	 * Get the real index name, from the SQLite index name.
	 *
	 * @param string $index_name The index name.
	 *
	 * @return string
	 */
	public static function get_index_name( string $index_name ): string {
		if ( strlen( $index_name ) < 4 ) {
			return '';
		}

		$real_names = explode( '__', $index_name );

		if ( count( $real_names ) === 2 ) {
			return $real_names[1];
		}

		return '';
	}

	/**
	 * Get a column definition for the CREATE statement.
	 *
	 * @param string $name   The column name.
	 * @param array  $column The column definition.
	 *
	 * @return string
	 */
	public function get_column( string $name, array $column ): string {
		if ( $name === '' || ! array_key_exists( 'type', $column ) || ! array_key_exists( 'sqlite_type', $column ) ) {
			return '';
		}

		$ret = "`{$name}` {$column['type']}";

		if ( null !== $this->collation && $column['sqlite_type'] === 'text' && $column['type'] !== 'datetime' ) {
			$ret .= ' COLLATE ' . $this->collation;
		}

		if ( array_key_exists( 'not_null', $column ) && $column['not_null'] ) {
			$ret .= ' NOT NULL';
		}

		if ( array_key_exists( 'auto_increment', $column ) && $column['auto_increment'] ) {
			$ret .= ' AUTO_INCREMENT';
		}

		if ( array_key_exists( 'default', $column ) && $column['default'] !== null ) {
			$default = $column['default'];

			if ( $column['sqlite_type'] === 'integer' ) {
				// Force an integer. The default value is a string.
				$default = (int) $default;
			}

			$ret .= ' DEFAULT ' . $default;
		}

		return $ret;
	}

	/**
	 * Get the dump.
	 *
	 * @return string
	 */
	public function get_dump(): string {
		if ( $this->output_mode === self::OUTPUT_TYPE_STRING ) {
			return $this->output_handle;
		}

		return '';
	}

	/**
	 * Get current table.
	 *
	 * @return string|null
	 */
	public function get_current_table(): ?string {
		return $this->current_table;
	}

	/**
	 * Start a table.
	 *
	 * @param string $table_name The table name.
	 * @param bool   $add_drop   Whether to add a DROP TABLE statement.
	 *
	 * @return void
	 */
	private function start_table_creation( string $table_name, bool $add_drop = true ) {
		$this->current_table = $table_name;
		$this->header( "Table structure for table `{$table_name}`" );

		if ( $add_drop ) {
			$this->output( "DROP TABLE IF EXISTS `{$table_name}`;" );
		}

		$this->var_assignment( '@saved_cs_client', '@@character_set_client' );
		$this->var_assignment( 'character_set_client', 'utf8' );
		$this->output( "CREATE TABLE `{$table_name}` (" );
	}

	/**
	 * End table creation.
	 *
	 * @param string $table_name     The table name.
	 * @param int    $auto_increment The auto increment value.
	 *
	 * @return void
	 */
	private function end_table_creation( string $table_name, int $auto_increment ) {
		$end = ') ENGINE=InnoDB';

		if ( $auto_increment ) {
			$end .= ' AUTO_INCREMENT=' . ( $auto_increment + 1 );
		}

		$end .= ' CHARSET=' . $this->charset;

		if ( null !== $this->collation ) {
			$end .= ' COLLATE=' . $this->collation;
		}

		$this->output( $end . ';' );

		$this->var_assignment( 'character_set_client', '@saved_cs_client' );
		$this->nl();

		$this->start_table_inserts();
	}

	/**
	 * Reset the generator.
	 */
	private function reset() {
		if ( $this->output_mode === self::OUTPUT_TYPE_FILE && $this->output_handle ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
			fclose( $this->output_handle );
		}

		$this->charset              = self::DEFAULT_CHARSET;
		$this->collation            = null;
		$this->current_insert_index = 0;
		$this->current_table        = null;
		$this->output_handle        = '';
		$this->output_mode          = self::OUTPUT_TYPE_STRING;
		$this->started              = false;
		$this->transaction          = true;
	}
}
