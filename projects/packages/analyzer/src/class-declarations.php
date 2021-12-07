<?php

namespace Automattic\Jetpack\Analyzer;

use PhpParser\NodeTraverser;
use PhpParser\NodeVisitor\NameResolver;
use PhpParser\ParserFactory;

class Declarations extends PersistentList {

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

		if ( is_null( $exclude ) || ! is_array( $exclude ) ) {
			throw new Exception( 'Exclude must be an array' );
		}

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

			if ( in_array( $current_extension, $valid_extensions, true ) ) {
				$this->scan_file( $root, $file );
			}
		}
	}

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

		$traverser    = new NodeTraverser();
		$nameResolver = new NameResolver();
		$traverser->addVisitor( $nameResolver );

		// Resolve names
		$ast = $traverser->traverse( $ast );

		// now scan for public methods etc
		$traverser           = new NodeTraverser();
		$declaration_visitor = new Declarations\Visitor( $file_path_relative, $this );
		$traverser->addVisitor( $declaration_visitor );
		$ast = $traverser->traverse( $ast );
	}

	/**
	 * Recreates list of declarations from a passed JSON file
	 *
	 * @param string $file_path JSON file path.
	 */
	public function load( $file_path ) {
		// phpcs:ignore
		$contents = json_decode( file_get_contents( $file_path ) );

		foreach ( $contents as $obj ) {
			switch ( $obj->decl_type ) {
				case 'class':
					$this->add( Declarations\Class_::from_map( $obj ) );
					break;

				case 'property':
					$this->add( Declarations\Class_Property::from_map( $obj ) );
					break;

				case 'class_const':
					$this->add( Declarations\Class_Const::from_map( $obj ) );
					break;

				case 'method':
					$this->add( Declarations\Class_Method::from_map( $obj ) );
					break;

				case 'function':
					$this->add( Declarations\Function_::from_map( $obj ) );
					break;
				default:
					// TODO: Implement handlers to other difference types.
					echo $obj->decl_type . " not implemented!\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					break;
			}
		}
	}
}
