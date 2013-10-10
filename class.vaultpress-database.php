<?php

class VaultPress_Database {

	var $table = null;
	var $pks = null;

	function __construct() {
	}

	function attach( $table, $parse_create_table = false ) {
		$this->table=$table;
		if ( $parse_create_table ) {
			$this->structure = $this->parse_create_table( $this->show_create() );
		}
	}

	function get_tables( $filter=null ) {
		global $wpdb;
		$rval = $wpdb->get_col( 'SHOW TABLES' );
		if ( $filter )
			$rval = preg_grep( $filter, $rval );
		return $rval;
	}

	function show_create() {
		global $wpdb;
		if ( !$this->table )
			return false;
		$table = $wpdb->escape( $this->table );
		$results = $wpdb->get_row( "SHOW CREATE TABLE `$table`" );
		$want = 'Create Table';
		if ( $results )
			$results = $results->$want;
		return $results;
	}

	function explain() {
		global $wpdb;
		if ( !$this->table )
			return false;
		$table = $wpdb->escape( $this->table );
		return $wpdb->get_results( "EXPLAIN `$table`" );
	}

	function diff( $signatures ) {
		global $wpdb;
		if ( !is_array( $signatures ) || !count( $signatures ) )
			return false;
		if ( !$this->table )
			return false;
		$table = $wpdb->escape( $this->table );
		$diff = array();
		foreach ( $signatures as $where => $signature ) {
			$pksig = md5( $where );
			unset( $wpdb->queries );
			$row = $wpdb->get_row( "SELECT * FROM `$table` WHERE $where" );
			if ( !$row ) {
				$diff[$pksig] = array ( 'change' => 'deleted', 'where' => $where );
				continue;
			}
			$row = serialize( $row );
			$hash = md5( $row );
			if ( $hash != $signature )
				$diff[$pksig] = array( 'change' => 'modified', 'where' => $where, 'signature' => $hash, 'row' => $row );
		}
		return $diff;
	}

	function count( $columns ) {
		global $wpdb;
		if ( !is_array( $columns ) || !count( $columns ) )
			return false;
		if ( !$this->table )
			return false;
		$table = $wpdb->escape( $this->table );
		$column = $wpdb->escape( array_shift( $columns ) );
		return $wpdb->get_var( "SELECT COUNT( $column ) FROM `$table`" );
	}

	function wpdb( $query, $function='get_results' ) {
		global $wpdb;

		if ( !is_callable( array( $wpdb, $function ) ) )
			return false;

		$res = $wpdb->$function( $query );
		if ( !$res )
			return $res;
		switch ( $function ) {
			case 'get_results':
				foreach ( $res as $idx => $row ) {
					if ( isset( $row->option_name ) && $row->option_name == 'cron' )
						$res[$idx]->option_value = serialize( array() );
				}
				break;
			case 'get_row':
				if ( isset( $res->option_name ) && $res->option_name == 'cron' )
					$res->option_value = serialize( array() );
				break;
		}
		return $res;
	}

	function get_cols( $columns, $limit=false, $offset=false, $where=false ) {
		global $wpdb;
		if ( !is_array( $columns ) || !count( $columns ) )
			return false;
		if ( !$this->table )
			return false;
		$table = $wpdb->escape( $this->table );
		$limitsql = '';
		$offsetsql = '';
		$wheresql = '';
		if ( $limit )
			$limitsql = ' LIMIT ' . intval( $limit );
		if ( $offset )
			$offsetsql = ' OFFSET ' . intval( $offset );
		if ( $where )
			$wheresql = ' WHERE ' . base64_decode($where);
		$rval = array();
		foreach ( $wpdb->get_results( "SELECT * FROM `$this->table` $wheresql $limitsql $offsetsql" ) as $row ) {
			// We don't need to actually record a real cron option value, just an empty array
			if ( isset( $row->option_name ) && $row->option_name == 'cron' )
				$row->option_value = serialize( array() );
			if ( !empty( $this->structure ) ) {
				$hash = md5( $this->convert_to_sql_string( $row, $this->structure->columns ) );
				foreach ( get_object_vars( $row ) as $i => $v ) {
					if ( !in_array( $i, $columns ) )
						unset( $row->$i );
				}

				$row->hash = $hash;
			} else {
				$keys = array();
				$vals = array();
				foreach ( get_object_vars( $row ) as $i => $v ) {
					$keys[] = sprintf( "`%s`", $wpdb->escape( $i ) );
					$vals[] = sprintf( "'%s'", $wpdb->escape( $v ) );
					if ( !in_array( $i, $columns ) )
						unset( $row->$i );
				}
				$row->hash = md5( sprintf( "(%s) VALUES(%s)", implode( ',',$keys ), implode( ',',$vals ) ) );
			}
			$rval[]=$row;
		}
		return $rval;
	}

	/**
	 * Convert a PHP object to a mysqldump compatible string, using the provided data type information.
	 **/
	function convert_to_sql_string( $data, $datatypes ) {
		global $wpdb;
		if ( !is_object( $data ) || !is_object( $datatypes ) )
			return false;

		foreach ( array_keys( (array)$data ) as $key )
			$keys[] = sprintf( "`%s`", $wpdb->escape( $key ) );
		foreach ( (array)$data as $key => $val ) {
			if ( null === $val ) {
				$vals[] = 'NULL';
				continue;
			}
			$type = 'text';
			if ( isset( $datatypes->$key->type ) )
				$type= strtolower( $datatypes->$key->type );
			if ( preg_match( '/int|double|float|decimal|bool/i', $type ) )
				$type = 'number';

			if ( 'number' === $type ) {
				// do not add quotes to numeric types.
				$vals[] = $val;
			} else {
				$val = $wpdb->escape( $val );
				// Escape characters that aren't escaped by $wpdb->escape(): \n, \r, etc.
				$val = str_replace( array( "\x0a", "\x0d", "\x1a" ), array( '\n', '\r', '\Z' ), $val );
				$vals[] = sprintf( "'%s'", $val );
			}
		}
		if ( !count($keys) )
			return false;
		// format the row as a mysqldump line: (`column1`, `column2`) VALUES (numeric_value1,'text value 2')
		return sprintf( "(%s) VALUES (%s)", implode( ', ',$keys ), implode( ',',$vals ) );
	}



	function parse_create_table( $sql ) {
		$table = new stdClass();

		$table->raw = $sql;
		$table->columns = new stdClass();
		$table->primary = null;
		$table->uniques = new stdClass();
		$table->keys = new stdClass();
		$sql = explode( "\n", trim( $sql ) );
		$table->engine = preg_replace( '/^.+ ENGINE=(\S+) .+$/i', "$1", $sql[(count($sql)-1)] );
		$table->charset = preg_replace( '/^.+ DEFAULT CHARSET=(\S+)( .+)?$/i', "$1", $sql[(count($sql)-1)] );
		$table->single_int_paging_column = null;

		foreach ( $sql as $idx => $val )
			$sql[$idx] = trim($val);
		$columns = preg_grep( '/^\s*`[^`]+`\s*\S*/', $sql );
		if ( !$columns )
			return false;

		$table->name = preg_replace( '/(^[^`]+`|`[^`]+$)/', '', array_shift( preg_grep( '/^CREATE\s+TABLE\s+/', $sql ) ) );

		foreach ( $columns as $line ) {
			preg_match( '/^`([^`]+)`\s+([a-z]+)(\(\d+\))?\s*/', $line, $m );
			$name = $m[1];
			$table->columns->$name = new stdClass();
			$table->columns->$name->null = (bool)stripos( $line, ' NOT NULL ' );
			$table->columns->$name->type = $m[2];
			if ( isset($m[3]) ) {
				if ( substr( $m[3], 0, 1 ) == '(' )
					$table->columns->$name->length = substr( $m[3], 1, -1 );
				else
					$table->columns->$name->length = $m[3];
			} else {
				$table->columns->$name->length = null;
			}
			if ( preg_match( '/ character set (\S+)/i', $line, $m ) ) {
				$table->columns->$name->charset = $m[1];
			} else {
				$table->columns->$name->charset = '';
			}
			if ( preg_match( '/ collate (\S+)/i', $line, $m ) ) {
				$table->columns->$name->collate = $m[1];
			} else {
				$table->columns->$name->collate = '';
			}
			if ( preg_match( '/ DEFAULT (.+),$/i', $line, $m ) ) {
				if ( substr( $m[1], 0, 1 ) == "'" )
					$table->columns->$name->default = substr( $m[1], 1, -1 );
				else
					$table->columns->$name->default = $m[1];
			} else {
				$table->columns->$name->default = null;
			}
			$table->columns->$name->line = $line;
		}
		$pk = preg_grep( '/^PRIMARY\s+KEY\s+/i', $sql );
		if ( count( $pk ) ) {
			$pk = array_pop( $pk );
			$pk = preg_replace( '/(^[^\(]+\(`|`\),?$)/', '', $pk );
			$pk = preg_replace( '/\([0-9]+\)/', '', $pk );
			$pk = explode( '`,`', $pk );
			$table->primary = $pk;
		}
		if ( is_array( $table->primary ) && count( $table->primary ) == 1 ) {
			$pk_column_name = $table->primary[0];
			switch( strtolower( $table->columns->$pk_column_name->type ) ) {
				// Integers, exact value
				case 'tinyint':
				case 'smallint':
				case 'int':
				case 'integer':
				case 'bigint':
					// Fixed point, exact value
				case 'decimal':
				case 'numeric':
					// Floating point, approximate value
				case 'float':
				case 'double':
				case 'real':
					// Date and Time
				case 'date':
				case 'datetime':
				case 'timestamp':
					$table->single_int_paging_column = $pk_column_name;
					break;
			}
		}
		$keys = preg_grep( '/^((?:UNIQUE )?INDEX|(?:UNIQUE )?KEY)\s+/i', $sql );
		if ( !count( $keys ) )
			return $table;
		foreach ( $keys as $idx => $key ) {
			if ( 0 === strpos( $key, 'UNIQUE' ) )
				$is_unique = false;
			else
				$is_unique = true;

			// for KEY `refresh` (`ip`,`time_last`) USING BTREE,
			$key = preg_replace( '/ USING \S+ ?(,?)$/', '$1', $key );

			// for KEY `id` USING BTREE (`id`),
			$key = preg_replace( '/` USING \S+ \(/i', '` (', $key );

					$key = preg_replace( '/^((?:UNIQUE )?INDEX|(?:UNIQUE )?KEY)\s+/i', '', $key );
					$key = preg_replace( '/\([0-9]+\)/', '', $key );
					preg_match( '/^`([^`]+)`\s+\(`(.+)`\),?$/', $key, $m );
					$key = $m[1]; //preg_replace( '/\([^)]+\)/', '', $m[1]);
					if ( !$key )
						continue;
					if ( $is_unique )
						$table->keys->$key = explode( '`,`', $m[2] );
					else
						$table->uniques->$key = explode( '`,`', $m[2] );
		}

		$uniques = get_object_vars( $table->uniques );
		foreach( $uniques as $idx => $val ) {
			if ( is_array( $val ) && count( $val ) == 1 ) {
				$pk_column_name = $val[0];
				switch( strtolower( $table->columns->$pk_column_name->type ) ) {
					// Integers, exact value
					case 'tinyint':
					case 'smallint':
					case 'int':
					case 'integer':
					case 'bigint':
						// Fixed point, exact value
					case 'decimal':
					case 'numeric':
						// Floating point, approximate value
					case 'float':
					case 'double':
					case 'real':
						// Date and Time
					case 'date':
					case 'datetime':
					case 'timestamp':
						$table->single_int_paging_column = $pk_column_name;
						break;
				}
			}
		}

		if ( empty( $table->primary ) ) {
			if ( !empty( $uniques ) )
				$table->primary = array_shift( $uniques );
		}

		return $table;
	}
}
