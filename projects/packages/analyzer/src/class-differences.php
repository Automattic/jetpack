<?php

namespace Automattic\Jetpack\Analyzer;

class Differences extends PersistentList {

	private function slashit( $path ) {
		$path .= ( substr( $path, -1 ) == '/' ? '' : '/' );
		return $path;
	}

	/**
	 * Find differences between two sets of declarations.
	 *
	 * @param Declarations $new_declarations  List of new declarations.
	 * @param Declarations $prev_declarations List of previous declarations.
	 * @param string       $new_root          Path where new delcaration were scanned.
	 * @param boolean      $find_deprecated   Include deprecated functions.
	 * @return void
	 */
	public function find( $new_declarations, $prev_declarations, $new_root = null, $find_deprecated = false ) {
		if ( $new_root ) {
			$new_root = $this->slashit( $new_root );
		} else {
			echo "Warning: calling find() without \$new_root means we can't detect if files are stubbed in the new release\n";
		}
		$total                       = 0;
		$missing_total               = 0;
		$moved_total                 = 0;
		$moved_with_empty_file_total = 0;
		$deprecated_total            = 0;
		// for each declaration, see if it exists in the current analyzer's declarations
		// if not, add it to the list of differences - either as missing or different
		foreach ( $prev_declarations->get() as $prev_declaration ) {
			$matched               = false;
			$moved                 = false;
			$moved_with_empty_file = false;
			$deprecated            = false;
			foreach ( $new_declarations->get() as $new_declaration ) {

				if ( $prev_declaration->match( $new_declaration ) ) {
					if ( $find_deprecated && isset( $new_declaration->deprecated ) && $new_declaration->deprecated ) {
						$deprecated = true;
					}

					// echo "Comparing " . $prev_declaration->path . " to " . $new_declaration->path . "\n";
					if ( $prev_declaration->path !== $new_declaration->path ) {

						// if a file exists at the old location, and the new method is (we assume) autoloaded,
						// do not warn.
						// TODO: since functions are not autoloaded, we should probably still warn for them?
						if ( $new_root && file_exists( $new_root . $prev_declaration->path ) ) {
							$moved_with_empty_file        = true;
							$moved_with_empty_file_total += 1;
						} else {
							$moved = true;
						}
					}
					$matched = true;
					break;
				} elseif ( $prev_declaration->partial_match( $new_declaration ) ) {
					// TODO this is to catch things like function args changed, method the same
				}
			}

			// do not add warnings for $moved_with_empty_file
			if ( $matched && $moved_with_empty_file ) {
				// echo "Declaration " . $prev_declaration->display_name() . " moved from " . $prev_declaration->path . " to " . $new_declaration->path . " with matching empty file at original location\n";
			}

			// Add differences for any detected deprecations.
			if ( $deprecated ) {
				switch ( $new_declaration->type() ) {
					case 'method':
						$this->add( new Differences\Class_Method_Deprecated( $prev_declaration, $new_declaration ) );
						break;
					case 'function':
						$this->add( new Differences\Function_Deprecated( $prev_declaration, $new_declaration ) );
						break;
					default:
						echo 'Unknown deprecated type ' . $new_declaration->type() . "\n";
				}
				$deprecated_total++;

			} elseif ( $matched && $moved ) {
				switch ( $prev_declaration->type() ) {
					case 'class':
						$this->add( new Differences\Class_Moved( $prev_declaration, $new_declaration ) );
						break;
					case 'class_const':
						$this->add( new Differences\Class_Const_Moved( $prev_declaration, $new_declaration ) );
						break;
					case 'method':
						$this->add( new Differences\Class_Method_Moved( $prev_declaration, $new_declaration ) );
						break;
					case 'property':
						$this->add( new Differences\Class_Property_Moved( $prev_declaration, $new_declaration ) );
						break;
					case 'function':
						$this->add( new Differences\Function_Moved( $prev_declaration, $new_declaration ) );
						break;
					default:
						echo 'Unknown moved type ' . $prev_declaration->type() . "\n";
				}
				$moved_total += 1;
			}

			if ( ! $matched ) {
				switch ( $prev_declaration->type() ) {
					case 'class':
						$this->add( new Differences\Class_Missing( $prev_declaration ) );
						break;
					case 'class_const':
						$this->add( new Differences\Class_Const_Missing( $prev_declaration ) );
						break;
					case 'method':
						$this->add( new Differences\Class_Method_Missing( $prev_declaration ) );
						break;
					case 'property':
						$this->add( new Differences\Class_Property_Missing( $prev_declaration ) );
						break;
					case 'function':
						$this->add( new Differences\Function_Missing( $prev_declaration ) );
						break;
					default:
						echo 'Unknown unmatched type ' . $prev_declaration->type() . "\n";
				}
				$missing_total += 1;
			}

			$total += 1;
		}

		echo "Total Declarations: $total\n";
		echo 'Total Differences: ' . count( $this->get() ) . "\n";
		echo 'Moved: ' . $moved_total . "\n";
		echo 'Moved with stubbed file: ' . $moved_with_empty_file_total . "\n";
		echo 'Missing: ' . $missing_total . "\n";
		if ( $find_deprecated ) {
			echo 'Deprecated: ' . $deprecated_total . "\n";
		}
	}
}
