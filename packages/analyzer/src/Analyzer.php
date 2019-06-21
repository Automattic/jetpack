<?php

namespace Automattic\Jetpack\Analyzer;

use PhpParser\Error;
use PhpParser\NodeDumper;
use PhpParser\ParserFactory;
use PhpParser\Node;
use PhpParser\Node\Stmt\Function_;
use PhpParser\Node\Stmt\ClassMethod_;
use PhpParser\NodeTraverser;
use PhpParser\NodeVisitorAbstract;

// const STATE_NONE = 0;
// const STATE_CLASS_DECLARATION = 1;

const VIS_PUBLIC  = 0;
const VIS_PRIVATE = 1;

class Analyzer extends NodeVisitorAbstract {
	private $declarations;
	private $base_path;
	private $current_path;
	private $parser;

	function __construct( $base_path ) {
		$this->parser       = ( new ParserFactory() )->create( ParserFactory::PREFER_PHP7 );
		$this->declarations = array();
		$this->base_path    = $this->slashit( $base_path );
	}

	private function slashit( $path ) {
		$path .= ( substr( $path, -1 ) == '/' ? '' : '/' );
		return $path;
	}

	protected function add_declaration( $declaration ) {
		$this->declarations[] = $declaration;
	}

	private function print_declarations() {
		print_r( $this->declarations );
	}

	public function scan() {
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
				echo "$file\n";
			}
		}
	}

	public function file( $file_path ) {
		$this->current_path = $file_path;
		$source             = file_get_contents( $file_path );
		try {
			$ast = $this->parser->parse( $source );
		} catch ( Error $error ) {
			echo "Parse error: {$error->getMessage()}\n";
			return;
		}

		// $dumper = new NodeDumper;
		// echo $dumper->dump($ast) . "\n";

		$traverser = new NodeTraverser();
		$traverser->addVisitor( $this );
		$ast = $traverser->traverse( $ast );
		$this->print_declarations();
		return;
	}

	public function enterNode( Node $node ) {
		// print_r($node);
		if ( $node instanceof Node\Stmt\Class_ ) {
			$this->add_declaration( new Class_Declaration( $this->current_path, $node->getLine(), $node->name->name ) );
		}
		if ( $node instanceof Node\Stmt\Property && $node->isPublic() ) {
			$this->add_declaration( new Class_Property_Declaration( $this->current_path, $node->getLine(), $node->props[0]->name->name ) );
		}
		if ( $node instanceof Node\Stmt\ClassMethod && $node->isPublic() ) {
			$method = new Class_Method_Declaration( $this->current_path, $node->getLine(), $node->name->name, $node->isStatic() );
			foreach ( $node->getParams() as $param ) {
				$method->add_param( $node->var->name, $node->default, $node->type, $node->byRef, $node->variadic );
			}
			$this->add_declaration( $method );
		}
	}
}

class Declaration {
	public $path;
	public $line;
	public $name;

	function __construct( $path, $line, $name ) {
		$this->path = $path;
		$this->line = $line;
		$this->name = $name;
	}
}

class Class_Declaration extends Declaration {
}

/**
 * We only log public class methods, whether they are static, and their parameters
 */
class Class_Method_Declaration extends Declaration {
	public $static;

	function __construct( $path, $line, $name, $static ) {
		$this->static = $static;
		$this->params = array();
		parent::__construct( $path, $line, $name );
	}

	function add_param( $name, $default, $type, $byRef, $variadic ) {
		$this->params[] = (object) compact( 'name', 'default', 'type', 'byRef', 'variadic' );
	}
}

/**
 * We only log public class variables
 */
class Class_Property_Declaration extends Declaration {
}
