<?php

namespace Automattic\Jetpack\Analyzer;

use PhpParser\ParserFactory;
use PhpParser\NodeTraverser;
use PhpParser\NodeDumper;
use PhpParser\NodeVisitor\NameResolver;

class Differences extends PersistentList {

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
	}
}
