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
		foreach( $prev_declarations->get() as $prev_declaration ) {
			$matched = false;
			foreach( $new_declarations->get() as $new_declaration ) {
				if ( $prev_declaration->match( $new_declaration ) ) {
					$matched = true;
					break;
				}
			}
			if ( ! $matched ) {
				switch( $prev_declaration->type() ) {
					case 'class':
						$this->add( new Differences\Class_Missing( $prev_declaration ) );
						break;
					case 'method':
						$this->add( new Differences\Class_Method_Missing( $prev_declaration ) );
						break;
					default:
						echo "Unknown unmatched type " . $prev_declaration->type() . "\n";
				}
			}
			$total += 1;
		}

		echo "Total: $total\n";
		echo "Missing: " . count( $this->get() ) . "\n";
	}

	/**
	 * Scans the file for any invocations that depend on missing or different classes, methods, properties and functions
	 */
	public function check_file_compatibility( $file_path ) {
		$source = file_get_contents( $file_path );
		$parser = ( new ParserFactory() )->create( ParserFactory::PREFER_PHP7 );
		try {
			$ast    = $parser->parse( $source );
		} catch ( Error $error ) {
			echo "Parse error: {$error->getMessage()}\n";
			return;
		}

		// $dumper = new NodeDumper;
		// echo $dumper->dump($ast) . "\n";

		// before parsing, make sure we try to resolve class names
		$traverser    = new NodeTraverser();
		$nameResolver = new NameResolver();
		$traverser->addVisitor( $nameResolver );

		// Resolve names
		$ast = $traverser->traverse( $ast );

		$traverser         = new NodeTraverser();
		$invocations       = new Invocations();
		$invocation_finder = new Invocations\Visitor( $file_path, $invocations );
		$traverser->addVisitor( $invocation_finder );
		$ast = $traverser->traverse( $ast );

		print_r($invocations);
		$invocations->print();
		// return $invocations;

		// $dumper = new NodeDumper;
		// echo $dumper->dump($ast) . "\n";

		// TODO: return a list of warnings and errors

		/**
		 * Scan every invocation to see if it depends on a Difference
		 */
		$warnings = new Warnings();
		foreach( $invocations->get() as $invocation ) {
			foreach( $this->get() as $difference ) {
				// $warning = $
				$difference->find_invocation_warnings( $invocation, $warnings );
			}
		}

		return $warnings;
	}
}
