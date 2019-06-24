<?php

namespace Automattic\Jetpack\Analyzer;

use PhpParser\ParserFactory;
use PhpParser\NodeTraverser;
use PhpParser\NodeDumper;
use PhpParser\NodeVisitor\NameResolver;


/**
 * TODO: share this file loading code w/ Declarations
 */
class Invocations extends PersistentList {
	private $parser;

	function __construct() {
		$this->parser    = ( new ParserFactory() )->create( ParserFactory::PREFER_PHP7 );
		parent::__construct();
	}

	private function slashit( $path ) {
		$path .= ( substr( $path, -1 ) == '/' ? '' : '/' );
		return $path;
	}

	/**
	 * Scan every PHP in the root
	 */
	public function scan( $root, $exclude = array() ) {
		if ( is_dir( $root ) ) {
			return $this->scan_dir( $this->slashit( $root ), $exclude );
		} elseif( is_file( $root ) ) {
			return $this->scan_file( $this->slashit( dirname( $root ) ), $root );
		} else {
			throw new \Exception( 'input_error', "Expected $root to be a file or directory" );
		}
	}

	public function scan_dir( $root, $exclude = array() ) {

		$filter  = function ( $file, $key, $iterator ) use ( $exclude ) {
			if ( $iterator->hasChildren() && ! in_array( $file->getFilename(), $exclude ) ) {
				return true;
			}
			return $file->isFile();
		};

		$inner_iterator = new \RecursiveDirectoryIterator( $root, \RecursiveDirectoryIterator::SKIP_DOTS );

		$iterator = new \RecursiveIteratorIterator(
			new \RecursiveCallbackFilterIterator( $inner_iterator, $filter )
		);

		$valid_extensions = array( 'php' );
		foreach ( $iterator as $file ) {
			if ( in_array( strtolower( array_pop( explode( '.', $file ) ) ), $valid_extensions ) ) {
				$this->scan_file( $root, $file );
			}
		}
	}

	// public function scan_file( $root, $file_path ) {
	// 	$file_path_relative = str_replace( $root, '', $file_path );

	// 	$source = file_get_contents( $file_path );
	// 	try {
	// 		$ast = $this->parser->parse( $source );
	// 	} catch ( Error $error ) {
	// 		echo "Parse error: {$error->getMessage()}\n";
	// 		return;
	// 	}

	// 	// $dumper = new NodeDumper;
	// 	// echo $dumper->dump($ast) . "\n";

	// 	$traverser    = new NodeTraverser();
	// 	$nameResolver = new NameResolver();
	// 	$traverser->addVisitor( $nameResolver );

	// 	// Resolve names
	// 	$ast = $traverser->traverse( $ast );

	// 	// now scan for public methods etc
	// 	$traverser           = new NodeTraverser();
	// 	$declaration_visitor = new Declarations\Visitor( $file_path_relative, $this );
	// 	$traverser->addVisitor( $declaration_visitor );
	// 	$ast = $traverser->traverse( $ast );
	// }

	/**
	 * Scans the file for any invocations that depend on missing or different classes, methods, properties and functions
	 */
	public function scan_file( $root, $file_path, $differences ) {
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
		$invocation_finder = new Invocations\Visitor( $file_path, $this );
		$traverser->addVisitor( $invocation_finder );
		$ast = $traverser->traverse( $ast );

		// print_r($this);
		// $this->print();
		// return $invocations;

		// $dumper = new NodeDumper;
		// echo $dumper->dump($ast) . "\n";

		// TODO: return a list of warnings and errors

		/**
		 * Scan every invocation to see if it depends on a Difference
		 */
		$warnings = new Warnings();
		foreach( $this->get() as $invocation ) {
			foreach( $differences->get() as $difference ) {
				// $warning = $
				$difference->find_invocation_warnings( $invocation, $warnings );
			}
		}

		return $warnings;
	}
}