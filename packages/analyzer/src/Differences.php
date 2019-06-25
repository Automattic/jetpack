<?php

namespace Automattic\Jetpack\Analyzer;

use PhpParser\ParserFactory;
use PhpParser\NodeTraverser;
use PhpParser\NodeDumper;
use PhpParser\NodeVisitor\NameResolver;

class Differences extends PersistentList {

	public function find( $new_declarations, $prev_declarations ) {
		$total = 0;
		// for each declaration, see if it exists in the current analyzer's declarations
		// if not, add it to the list of differences - either as missing or different
		foreach ( $prev_declarations->get() as $prev_declaration ) {
			$matched = false;
			$moved = false;
			foreach ( $new_declarations->get() as $new_declaration ) {
				if ( $prev_declaration->match( $new_declaration ) ) {
					// echo "Comparing " . $prev_declaration->path . " to " . $new_declaration->path . "\n";
					if ( $prev_declaration->path !== $new_declaration->path ) {
						$moved = true;
					}
					$matched = true;
					break;
				} elseif ( $prev_declaration->partial_match( $new_declaration ) ) {
					// TODO this is to catch things like function args changed, method the same
				}
			}

			if ( $matched && $moved ) {
				switch ( $prev_declaration->type() ) {
					case 'class':
						$this->add( new Differences\Class_Moved( $prev_declaration, $new_declaration ) );
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
			}

			if ( ! $matched ) {
				switch ( $prev_declaration->type() ) {
					case 'class':
						$this->add( new Differences\Class_Missing( $prev_declaration ) );
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
			}

			$total += 1;
		}

		echo "Total: $total\n";
		echo 'Missing: ' . count( $this->get() ) . "\n";
	}
}
