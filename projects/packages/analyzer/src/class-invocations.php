<?php

namespace Automattic\Jetpack\Analyzer;

use PhpParser\NodeTraverser;
use PhpParser\NodeVisitor\NameResolver;
use PhpParser\ParserFactory;

/**
 * TODO: share this file loading code w/ Declarations
 */
class Invocations extends PersistentList {
	private $parser;

	function __construct() {
		$this->parser = ( new ParserFactory() )->create( ParserFactory::PREFER_PHP7 );
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
		} elseif ( is_file( $root ) ) {
			return $this->scan_file( $this->slashit( dirname( $root ) ), $root );
		} else {
			throw new \Exception( "Expected $root to be a file or directory" );
		}
	}

	public function scan_dir( $root, $exclude = array() ) {
		$filter = function ( $file, $key, $iterator ) use ( $exclude ) {
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
			$parts             = explode( '.', $file );
			$current_extension = strtolower( array_pop( $parts ) );

			if ( in_array( $current_extension, $valid_extensions ) ) {
				$this->scan_file( $root, $file );
			}
		}
	}

	/**
	 * Scans the file for any invocations that depend on missing or different classes, methods, properties and functions
	 */
	public function scan_file( $root, $file_path ) {
		$file_path_relative = str_replace( $root, '', $file_path );

		$source = file_get_contents( $file_path );
		try {
			$ast = $this->parser->parse( $source );
		} catch ( \Error $error ) {
			echo "Parse error: {$error->getMessage()}\n";
			return;
		} catch ( \RuntimeException $error ) {
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
		$invocation_finder = new Invocations\Visitor( $file_path_relative, $this );
		$traverser->addVisitor( $invocation_finder );
		$ast = $traverser->traverse( $ast );
	}
}
