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
use PhpParser\NodeVisitor\NameResolver;

// const STATE_NONE = 0;
// const STATE_CLASS_DECLARATION = 1;

const VIS_PUBLIC  = 0;
const VIS_PRIVATE = 1;

class Analyzer extends NodeVisitorAbstract {
	private $declarations;
	private $base_path;
	private $current_path;
	private $current_relative_path;

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
		$declaration_visitor = new Declaration_Visitor( $current_relative_path, $declarations );
		$traverser->addVisitor( $declaration_visitor );
		$ast = $traverser->traverse( $ast );
	}

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

		$traverser = new NodeTraverser();
		$invocation_finder = new Invocation_Visitor( $this );
		$traverser->addVisitor( $invocation_finder );
		$ast = $traverser->traverse( $ast );
	}
}

class Declarations {
	private $declarations;
	// private $parser;

	function __construct() {
		// $this->parser       = ( new ParserFactory() )->create( ParserFactory::PREFER_PHP7 );
		$this->declarations = array();
	}

	public function get() {
		return $this->declarations;
	}

	public function add( $declaration ) {
		$this->declarations[] = $declaration;
	}

	public function print() {
		echo $this->save( 'php://memory' );
	}

	/**
	 * Saves the declarations to a file and returns the file contents
	 */
	public function save( $file_path ) {
		$handle = fopen( $file_path, 'r+');
		foreach ( $this->declarations as $dec ) {
			fputcsv( $handle, $dec->to_csv_array() );
		}
		rewind( $handle );
		$contents = stream_get_contents( $handle );
		fclose( $handle );
		return $contents;
	}

	public function load( $file_path ) {
		$row = 1;
		if ( ( $handle = fopen( $file_path , "r" ) ) !== FALSE ) {
			while ( ( $data = fgetcsv( $handle, 1000, "," ) ) !== FALSE ) {
				$num = count( $data );
				list( $type, $file, $line, $class_name, $name, $static, $params_json ) = $data;

				switch( $type ) {
					case 'class':
						$this->add( new Class_Declaration( $file, $line, $class_name ) );
						break;

					case 'property':
						$this->add( new Class_Property_Declaration( $file, $line, $class_name, $name, $static ) );
						break;

					case 'method':
						$params = json_decode( $params_json, TRUE );
						$declaration = new Class_Method_Declaration( $file, $line, $class_name, $name, $static );
						if ( is_array( $params ) ) {
							foreach( $params as $param ) {
								$declaration->add_param( $param->name, $param->default, $param->type, $param->byRef, $param->variadic );
							}
						}

						$this->add( $declaration );

						break;

					case 'function':
						$params = json_decode( $params_json, TRUE );
						$declaration = new Function_Declaration( $file, $line, $name );
						if ( is_array( $params ) ) {
							foreach( $params as $param ) {
								$declaration->add_param( $param->name, $param->default, $param->type, $param->byRef, $param->variadic );
							}
						}

						$this->add( $declaration );

						break;
				}
				$row++;
			}
			fclose( $handle );
		}
	}

	public function find_differences( $prev_declarations ) {

		$differences = new Declaration_Differences();
		$total = 0;
		// for each declaration, see if it exists in the current analyzer's declarations
		// if not, add it to the list of differences - either as missing or different
		foreach( $prev_declarations->get() as $prev_declaration ) {
			$matched = false;
			foreach( $this->declarations as $declaration ) {
				if ( $prev_declaration->match( $declaration ) ) {
					$matched = true;
					break;
				}
			}
			if ( ! $matched ) {
				$differences->add( new Difference_Missing( $prev_declaration ) );
			}
			$total += 1;
		}

		echo "Total: $total\n";
		echo "Missing: " . count( $differences->get() ) . "\n";
		return $differences;
	}
}

class Declaration_Differences {
	private $differences;
	// private $parser;

	function __construct() {
		// $this->parser       = ( new ParserFactory() )->create( ParserFactory::PREFER_PHP7 );
		$this->differences = array();
	}

	public function get() {
		return $this->differences;
	}

	public function add( $difference ) {
		$this->differences[] = $difference;
	}
}

class Declaration_Visitor extends NodeVisitorAbstract {
	private $current_class;
	private $declarations;
	private $current_relative_path;

	public function __construct( $current_relative_path, $declarations ) {
		$this->current_relative_path = $current_relative_path;
		$this->declarations = $declarations;
	}

	public function enterNode( Node $node ) {
		if ( $node instanceof Node\Stmt\Class_ ) {
			// $this->current_class = $node->name->name;
			$this->current_class = implode( '\\', $node->namespacedName->parts );

			$this->declarations->add( new Class_Declaration( $this->current_relative_path, $node->getLine(), $node->name->name ) );
		}
		if ( $node instanceof Node\Stmt\Property && $node->isPublic() ) {
			$this->declarations->add( new Class_Property_Declaration( $this->current_relative_path, $node->getLine(), $this->current_class, $node->props[0]->name->name, $node->isStatic() ) );
		}
		if ( $node instanceof Node\Stmt\ClassMethod && $node->isPublic() ) {
			// ClassMethods are also listed inside interfaces, which means current_class is null
			// so we ignore these
			if ( ! $this->current_class ) {
				return;
			}
			$method = new Class_Method_Declaration( $this->current_relative_path, $node->getLine(), $this->current_class, $node->name->name, $node->isStatic() );
			foreach ( $node->getParams() as $param ) {
				$method->add_param( $param->var->name, $param->default, $param->type, $param->byRef, $param->variadic );
			}
			$this->declarations->add( $method );
		}
		if ( $node instanceof Node\Stmt\Function_ ) {
			$function = new Function_Declaration( $this->current_relative_path, $node->getLine(), $node->name->name );
			foreach ( $node->getParams() as $param ) {
				$function->add_param( $param->var->name, $param->default, $param->type, $param->byRef, $param->variadic );
			}
			$this->declarations->add( $function  );
		}
	}

	public function leaveNode( Node $node ) {
		if ( $node instanceof Node\Stmt\Class_ ) {
			$this->current_class = null;
		}
	}
}

class Invocation_Visitor extends NodeVisitorAbstract {
	public $analyzer;

	public function __construct( $analyzer ) {
		$this->analyzer = $analyzer;
	}

	public function enterNode( Node $node ) {

		// if ( $node instanceof Node\Stmt\Class_ ) {
		// 	$this->current_class = $node->name->name;
		// 	$this->add( new Class_Declaration( $this->current_relative_path, $node->getLine(), $node->name->name ) );
		// }
		// if ( $node instanceof Node\Stmt\Property && $node->isPublic() ) {
		// 	$this->add( new Class_Property_Declaration( $this->current_relative_path, $node->getLine(), $this->current_class, $node->props[0]->name->name, $node->isStatic() ) );
		// }
		// if ( $node instanceof Node\Stmt\ClassMethod && $node->isPublic() ) {
		// 	// ClassMethods are also listed inside interfaces, which means current_class is null
		// 	// so we ignore these
		// 	if ( ! $this->current_class ) {
		// 		return;
		// 	}
		// 	$method = new Class_Method_Declaration( $this->current_relative_path, $node->getLine(), $this->current_class, $node->name->name, $node->isStatic() );
		// 	foreach ( $node->getParams() as $param ) {
		// 		$method->add_param( $param->var->name, $param->default, $param->type, $param->byRef, $param->variadic );
		// 	}
		// 	$this->add( $method );
		// }
	}

	public function leaveNode( Node $node ) {
		// if ( $node instanceof Node\Stmt\Class_ ) {
		// 	$this->current_class = null;
		// }
	}
}

class Difference_Missing {
	public $declaration;

	function __construct( $declaration ) {
		$this->declaration = $declaration;
	}

	public function to_csv() {
		return 'missing,' . $this->declaration->path . ',' . $this->declaration->type() . ',' . $this->declaration->display_name();
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

abstract class Declaration {
	public $path;
	public $line;

	function __construct( $path, $line ) {
		$this->path = $path;
		$this->line = $line;
	}

	function match( $other ) {
		return get_class( $other ) === get_class( $this )
			&& $other->name === $this->name
			&& $other->path === $this->path;
	}

	// a simple name, like 'method'
	abstract function type();

	// e.g. Jetpack::get_file_url_for_environment()
	abstract function display_name();
}

class Class_Declaration extends Declaration {
	public $class_name;

	function __construct( $path, $line, $class_name ) {
		$this->class_name = $class_name;
		parent::__construct( $path, $line );
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name
		);
	}

	function type() {
		return 'class';
	}

	function display_name() {
		return $this->class_name;
	}
}

/**
 * We only log public class methods, whether they are static, and their parameters
 */
class Class_Method_Declaration extends Declaration {
	public $class_name;
	public $name;
	public $params;
	public $static;

	function __construct( $path, $line, $class_name, $name, $static ) {
		$this->class_name = $class_name;
		$this->name = $name;
		$this->params = array();
		$this->static = $static;
		parent::__construct( $path, $line );
	}

	// TODO: parse "default" into comparable string form?
	function add_param( $name, $default, $type, $byRef, $variadic ) {
		$this->params[] = (object) compact( 'name', 'default', 'type', 'byRef', 'variadic' );
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name,
			$this->name,
			$this->static,
			json_encode( $this->params )
		);
	}

	function type() {
		return 'method';
	}

	function display_name() {
		$sep = $this->static ? '::' : '->';
		return $this->class_name . $sep . $this->name . '(' . implode( ', ', array_map( function( $param ) { return '$' . $param->name; }, $this->params ) ) . ')';
	}
}

/**
 * We only log public class variables
 */
class Class_Property_Declaration extends Declaration {
	public $class_name;
	public $name;
	public $static;

	function __construct( $path, $line, $class_name, $name, $static ) {
		$this->class_name = $class_name;
		$this->name = $name;
		$this->static = $static;
		parent::__construct( $path, $line );
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			$this->class_name,
			$this->name,
			$this->static,
			''
		);
	}

	function type() {
		return 'property';
	}

	function display_name() {
		$sep = $this->static ? '::$' : '->';
		return $this->class_name . $sep . $this->name;
	}
}

/**
 * We only log public class methods, whether they are static, and their parameters
 */
class Function_Declaration extends Declaration {
	public $name;
	public $params;

	function __construct( $path, $line, $name ) {
		$this->name = $name;
		$this->params = array();
		parent::__construct( $path, $line );
	}

	// TODO: parse "default" into comparable string form?
	function add_param( $name, $default, $type, $byRef, $variadic ) {
		$this->params[] = (object) compact( 'name', 'default', 'type', 'byRef', 'variadic' );
	}

	function to_csv_array() {
		return array(
			$this->type(),
			$this->path,
			$this->line,
			'',
			$this->name,
			'',
			json_encode( $this->params )
		);
	}

	function type() {
		return 'function';
	}

	function display_name() {
		return $this->name . '(' . implode( ', ', array_map( function( $param ) { return '$' . $param->name; }, $this->params ) ) . ')';
	}
}