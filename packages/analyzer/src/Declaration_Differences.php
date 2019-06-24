<?php

namespace Automattic\Jetpack\Analyzer;

use PhpParser\ParserFactory;
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitor\NameResolver;

class Declaration_Differences {
	private $differences;
	private $parser;

	function __construct() {
		$this->parser       = ( new ParserFactory() )->create( ParserFactory::PREFER_PHP7 );
		$this->differences = array();
	}

	public function get() {
		return $this->differences;
	}

	public function add( $difference ) {
		$this->differences[] = $difference;
	}

	/**
	 * Scans the file for any invocations that depend on missing or different classes, methods, properties and functions
	 */
	public function check_file_compatibility( $file_path ) {
		$source = file_get_contents( $file_path );
		try {
			$ast = $this->parser->parse( $source );
		} catch ( Error $error ) {
			echo "Parse error: {$error->getMessage()}\n";
			return;
		}

		// $dumper = new NodeDumper;
		// echo $dumper->dump($ast) . "\n";

		// before parsing, make sure we try to resolve class names
		$traverser = new NodeTraverser();
		$nameResolver = new NameResolver();
		$traverser->addVisitor( $nameResolver );

		// Resolve names
		$ast = $traverser->traverse( $ast );

		$traverser = new NodeTraverser();
		$invocation_finder = new Invocations\Visitor( $this );
		$traverser->addVisitor( $invocation_finder );
		$ast = $traverser->traverse( $ast );
	}
}