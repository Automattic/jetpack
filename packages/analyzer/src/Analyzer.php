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
	private $current_relative_path;
	private $current_class;
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

	public function print_declarations() {
		// print_r( $this->declarations );
		foreach ( $this->declarations as $dec ) {
			echo $dec->to_string() . "\n";
		}
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
				$this->file( $file );
			}
		}
	}

	public function file( $file_path ) {
		$this->current_path = $file_path;
		$this->current_relative_path = str_replace( $this->base_path, '', $file_path );

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
	}

	public function enterNode( Node $node ) {
		// print_r($node);
		if ( $node instanceof Node\Stmt\Class_ ) {
			$this->current_class = $node->name->name;
			$this->add_declaration( new Class_Declaration( $this->current_relative_path, $node->getLine(), $node->name->name ) );
		}
		if ( $node instanceof Node\Stmt\Property && $node->isPublic() ) {
			$this->add_declaration( new Class_Property_Declaration( $this->current_relative_path, $node->getLine(), $node->props[0]->name->name, $this->current_class ) );
		}
		if ( $node instanceof Node\Stmt\ClassMethod && $node->isPublic() ) {
			$method = new Class_Method_Declaration( $this->current_relative_path, $node->getLine(), $node->name->name, $node->isStatic(), $this->current_class );
			foreach ( $node->getParams() as $param ) {
				$method->add_param( $node->var->name, $node->default, $node->type, $node->byRef, $node->variadic );
			}
			$this->add_declaration( $method );
		}
	}

	public function leaveNode( Node $node ) {
		if ( $node instanceof Node\Stmt\Class_ ) {
			$this->current_class = null;
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

	function to_string() {
		return $this->path . ':' . $this->line . ' ' . $this->name;
	}
}

class Class_Declaration extends Declaration {
}

/**
 * We only log public class methods, whether they are static, and their parameters
 */
class Class_Method_Declaration extends Declaration {
	public $static;
	public $class_name;

	function __construct( $path, $line, $name, $static, $class_name ) {
		$this->static = $static;
		$this->class_name = $class_name;
		$this->params = array();
		parent::__construct( $path, $line, $name );
	}

	function add_param( $name, $default, $type, $byRef, $variadic ) {
		$this->params[] = (object) compact( 'name', 'default', 'type', 'byRef', 'variadic' );
	}

	function to_string() {
		$sep = $this->static ? '::' : '->';
		return $this->path . ':' . $this->line . ' ' . $this->class_name . $sep . $this->name;
	}
}

/**
 * We only log public class variables
 */
class Class_Property_Declaration extends Declaration {
	public $class_name;

	function __construct( $path, $line, $name, $class_name ) {
		$this->class_name = $class_name;
		parent::__construct( $path, $line, $name );
	}

	function to_string() {
		$sep = $this->static ? '::$' : '->';
		return $this->path . ':' . $this->line . ' ' . $this->class_name . $sep . $this->name;
	}
}
