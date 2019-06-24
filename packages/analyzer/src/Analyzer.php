<?php

namespace Automattic\Jetpack\Analyzer;

use PhpParser\ParserFactory;
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitor\NameResolver;

class Analyzer {
	private $declarations;
	private $base_path;
	private $current_path;
	private $current_relative_path;
	private $parser;

	function __construct( $base_path ) {
		$this->parser       = ( new ParserFactory() )->create( ParserFactory::PREFER_PHP7 );
		$this->base_path    = $this->slashit( $base_path );
	}

	private function slashit( $path ) {
		$path .= ( substr( $path, -1 ) == '/' ? '' : '/' );
		return $path;
	}

	public function scan() {
		$declarations = new Declarations();

		$exclude = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );
		$filter  = function ( $file, $key, $iterator ) use ( $exclude ) {
			if ( $iterator->hasChildren() && ! in_array( $file->getFilename(), $exclude ) ) {
				return true;
			}
			return $file->isFile();
		};

		$inner_iterator = new \RecursiveDirectoryIterator( $this->base_path, \RecursiveDirectoryIterator::SKIP_DOTS );

		$iterator = new \RecursiveIteratorIterator(
			new \RecursiveCallbackFilterIterator( $inner_iterator, $filter )
		);

		$display = array( 'php' );
		foreach ( $iterator as $file ) {
			if ( in_array( strtolower( array_pop( explode( '.', $file ) ) ), $display ) ) {
				$this->file( $file, $declarations );
			}
		}

		return $declarations;
	}

	public function file( $file_path, $declarations ) {
		$this->current_path = $file_path;
		$current_relative_path = str_replace( $this->base_path, '', $file_path );

		$source = file_get_contents( $file_path );
		try {
			$ast = $this->parser->parse( $source );
		} catch ( Error $error ) {
			echo "Parse error: {$error->getMessage()}\n";
			return;
		}

		// $dumper = new NodeDumper;
		// echo $dumper->dump($ast) . "\n";

		$traverser = new NodeTraverser();
		$nameResolver = new NameResolver();
		$traverser->addVisitor( $nameResolver );

		// Resolve names
		$ast = $traverser->traverse( $ast );

		// now scan for public methods etc
		$traverser = new NodeTraverser();
		$declaration_visitor = new Declarations\Visitor( $current_relative_path, $declarations );
		$traverser->addVisitor( $declaration_visitor );
		$ast = $traverser->traverse( $ast );
	}
}

/*
class Difference_Params {
	public $declaration;

	function __construct( $declaration ) {
		$this->declaration = $declaration;
	}

	public function to_csv() {
		return 'params,' . implode( ',', $this->declaration->to_csv_array() );
	}
}
*/