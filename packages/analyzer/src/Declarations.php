<?php

namespace Automattic\Jetpack\Analyzer;

class Declarations extends PersistentList {

	public function load( $file_path ) {
		$row = 1;
		if ( ( $handle = fopen( $file_path , "r" ) ) !== FALSE ) {
			while ( ( $data = fgetcsv( $handle, 1000, "," ) ) !== FALSE ) {
				$num = count( $data );
				list( $type, $file, $line, $class_name, $name, $static, $params_json ) = $data;

				switch( $type ) {
					case 'class':
						$this->add( new Declarations\Class_( $file, $line, $class_name ) );
						break;

					case 'property':
						$this->add( new Declarations\Class_Property( $file, $line, $class_name, $name, $static ) );
						break;

					case 'method':
						$params = json_decode( $params_json, TRUE );
						$declaration = new Declarations\Class_Method( $file, $line, $class_name, $name, $static );
						if ( is_array( $params ) ) {
							foreach( $params as $param ) {
								$declaration->add_param( $param->name, $param->default, $param->type, $param->byRef, $param->variadic );
							}
						}

						$this->add( $declaration );

						break;

					case 'function':
						$params = json_decode( $params_json, TRUE );
						$declaration = new Declarations\Function_( $file, $line, $name );
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
		$differences = new Differences();
		$total = 0;
		// for each declaration, see if it exists in the current analyzer's declarations
		// if not, add it to the list of differences - either as missing or different
		foreach( $prev_declarations->get() as $prev_declaration ) {
			$matched = false;
			foreach( $this->get() as $declaration ) {
				if ( $prev_declaration->match( $declaration ) ) {
					$matched = true;
					break;
				}
			}
			if ( ! $matched ) {
				if ( 'class' === $prev_declaration->type() ) {
					$differences->add( new Differences\Class_Missing( $prev_declaration ) );
				} else {
					echo "Unknown unmatched type " . $prev_declaration->type() . "\n";
				}

			}
			$total += 1;
		}

		echo "Total: $total\n";
		echo "Missing: " . count( $differences->get() ) . "\n";
		return $differences;
	}
}