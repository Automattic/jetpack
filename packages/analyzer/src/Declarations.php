<?php

namespace Automattic\Jetpack\Analyzer;

class Declarations {
	private $declarations;
	// private $parser;

	function __construct() {
		// $this->parser       = ( new ParserFactory() )->create( ParserFactory::PREFER_PHP7 );
		$this->declarations = array();
	}

	public function get() {
		return $this->declarations;
	}

	public function add( $declaration ) {
		$this->declarations[] = $declaration;
	}

	public function print() {
		echo $this->save( 'php://memory' );
	}

	/**
	 * Saves the declarations to a file and returns the file contents
	 */
	public function save( $file_path ) {
		$handle = fopen( $file_path, 'r+');
		foreach ( $this->declarations as $dec ) {
			fputcsv( $handle, $dec->to_csv_array() );
		}
		rewind( $handle );
		$contents = stream_get_contents( $handle );
		fclose( $handle );
		return $contents;
	}

	public function load( $file_path ) {
		$row = 1;
		if ( ( $handle = fopen( $file_path , "r" ) ) !== FALSE ) {
			while ( ( $data = fgetcsv( $handle, 1000, "," ) ) !== FALSE ) {
				$num = count( $data );
				list( $type, $file, $line, $class_name, $name, $static, $params_json ) = $data;

				switch( $type ) {
					case 'class':
						$this->add( new Class_Declaration( $file, $line, $class_name ) );
						break;

					case 'property':
						$this->add( new Class_Property_Declaration( $file, $line, $class_name, $name, $static ) );
						break;

					case 'method':
						$params = json_decode( $params_json, TRUE );
						$declaration = new Class_Method_Declaration( $file, $line, $class_name, $name, $static );
						if ( is_array( $params ) ) {
							foreach( $params as $param ) {
								$declaration->add_param( $param->name, $param->default, $param->type, $param->byRef, $param->variadic );
							}
						}

						$this->add( $declaration );

						break;

					case 'function':
						$params = json_decode( $params_json, TRUE );
						$declaration = new Function_Declaration( $file, $line, $name );
						if ( is_array( $params ) ) {
							foreach( $params as $param ) {
								$declaration->add_param( $param->name, $param->default, $param->type, $param->byRef, $param->variadic );
							}
						}

						$this->add( $declaration );

						break;
				}
				$row++;
			}
			fclose( $handle );
		}
	}

	public function find_differences( $prev_declarations ) {

		$differences = new Declaration_Differences();
		$total = 0;
		// for each declaration, see if it exists in the current analyzer's declarations
		// if not, add it to the list of differences - either as missing or different
		foreach( $prev_declarations->get() as $prev_declaration ) {
			$matched = false;
			foreach( $this->declarations as $declaration ) {
				if ( $prev_declaration->match( $declaration ) ) {
					$matched = true;
					break;
				}
			}
			if ( ! $matched ) {
				$differences->add( new Difference_Missing( $prev_declaration ) );
			}
			$total += 1;
		}

		echo "Total: $total\n";
		echo "Missing: " . count( $differences->get() ) . "\n";
		return $differences;
	}
}