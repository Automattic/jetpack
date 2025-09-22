<?php
/**
 * Phan plugin for handling "html template" files.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\PhanPlugins;

use ast\Node;
use Phan\CodeBase;
use Phan\Language\Context;
use Phan\Language\Element\Variable;
use Phan\Language\FQSEN\FullyQualifiedFunctionName;
use Phan\Language\FQSEN\FullyQualifiedMethodName;
use Phan\Language\Scope\ClassScope;
use Phan\Language\Scope\FunctionLikeScope;
use Phan\Language\Type;
use Phan\Language\Type\StaticType;
use Phan\Language\UnionType;
use Phan\PluginV3;
use Phan\PluginV3\BeforeAnalyzeFileCapability;
use PhpToken;

/**
 * Phan plugin for handling "html template" files.
 */
class HtmlTemplatePlugin extends PluginV3 implements BeforeAnalyzeFileCapability {

	private const IDENTIFIER     = '[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*';
	private const FQSEN_PATTERN  = '\\\\?' . self::IDENTIFIER . '(?:\\\\' . self::IDENTIFIER . ')*(?:::' . self::IDENTIFIER . ')?';
	private const FQSEN_REGEX    = '/@html-template(?=[^a-zA-Z0-9_-]|$)(?:\s+(' . self::FQSEN_PATTERN . '))?/';
	private const VAR_REGEX      = '/@html-template-var(?=[^a-zA-Z0-9_-]|$)(?:\s+(?<t>' . UnionType::union_type_regex . ')\s*&?\$(?<v>' . self::IDENTIFIER . '))?/';

	/**
	 * This method is called before analyzing a file.
	 *
	 * @param CodeBase $code_base The code base in which the node exists.
	 * @param Context  $context A context with the file name and scope before analyzing.
	 * @param string   $file_contents the unmodified file contents.
	 * @param Node     $node the node parsed from $file_contents.
	 */
	public function beforeAnalyzeFile( CodeBase $code_base, Context $context, string $file_contents, Node $node ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! preg_match( self::FQSEN_REGEX, $file_contents ) && ! preg_match( self::VAR_REGEX, $file_contents ) ) {
			// No point in tokenizing if neither annotation is present.
			return;
		}

		// We only support @html-template in file-level comments.
		static $okTokens = [ \T_OPEN_TAG, \T_COMMENT, \T_DOC_COMMENT, \T_WHITESPACE ];
		$preamble        = '';
		$in_preamble     = true;

		foreach ( PhpToken::tokenize( $file_contents ) as $token ) {
			$kind = $token->id;

			if ( $in_preamble && in_array( $kind, $okTokens, true ) ) {
				$preamble .= $token->text;
				continue;
			}

			// End of preamble reached.
			$in_preamble = false;
			break;
		}

		// Find the @html-template annotation in the preamble.
		$template = $this->findHtmlTemplateAnnotation( $preamble, $code_base, $context );
		if ( $template === null ) {
			return;
		}

		// Create a scope for the function/method referenced by @html-template.
		[ $scope, $func ] = $this->buildScopeFromTemplate( $template, $code_base, $context, $preamble );
		if ( ! $scope || ! $func ) {
			return;
		}

		// Collect variables from docblocks and preamble.
		$vars = [];
		if ( $func->getDocComment() ) {
			$vars = array_merge( $vars, $this->extractHtmlTemplateVars( (string) $func->getDocComment(), $context, $code_base ) );
		}
		$vars = array_merge( $vars, $this->extractHtmlTemplateVars( $preamble, $context, $code_base ) );

		// Add variables to scope.
		foreach ( $vars as $v ) {
			$type    = UnionType::fromStringInContext( $v['t'][0], $context, Type::FROM_PHPDOC, $code_base );
			$varname = $v['v'][0];

			if ( ! $scope->hasVariableWithName( $varname ) ) {
				if ( Variable::isHardcodedVariableInScopeWithName( $varname, false ) ) {
					continue;
				}
				$var = new Variable( $context, $varname, $type, 0 );
			} else {
				$var = clone $scope->getVariableByName( $varname );
				$var->setUnionType( $type );
			}
			$scope->addVariable( $var );
		}

		// Finally, set the scope of the context.
		$context->setScope( $scope );
	}

	/**
	 * Find and validate @html-template annotation in file preamble.
	 */
	private function findHtmlTemplateAnnotation( string $preamble, CodeBase $code_base, Context $context ): ?array {
		if ( preg_match_all( self::FQSEN_REGEX, $preamble, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE ) ) {
			$template = null;
			foreach ( $matches as $m ) {
				if ( empty( $m[1][0] ) ) {
					$this->emitIssue(
						$code_base,
						$context->withLineNumberStart( substr_count( $preamble, "\n", 0, $m[0][1] ) + 1 ),
						'HtmlTemplateUnparseable',
						'HtmlTemplate: Unparseable @html-template'
					);
					continue;
				}
				if ( $template ) {
					$this->emitIssue(
						$code_base,
						$context->withLineNumberStart( substr_count( $preamble, "\n", 0, $template[0][1] ) + 1 ),
						'HtmlTemplateRedefined',
						'HtmlTemplate: @html-template is redefined later in the file'
					);
				}
				$template = $m;
			}
			return $template;
		}
		return null;
	}

	/**
	 * Build a scope for the given @html-template target.
	 *
	 * @return array{0:?FunctionLikeScope,1:mixed} [scope, function/method element]
	 */
	private function buildScopeFromTemplate( array $template, CodeBase $code_base, Context $context, string $preamble ): array {
		if ( str_contains( $template[1][0], '::' ) ) {
			$fqsen = FullyQualifiedMethodName::fromStringInContext( $template[1][0], $context );
			if ( ! $code_base->hasClassWithFQSEN( $fqsen->getFullyQualifiedClassName() ) ) {
				$this->emitIssue(
					$code_base,
					$context->withLineNumberStart( substr_count( $preamble, "\n", 0, $template[1][1] ) + 1 ),
					'HtmlTemplateUndeclaredClassReference',
					'HtmlTemplate: Reference to method {METHOD} from undeclared class {CLASS}',
					[ $fqsen, $fqsen->getFullyQualifiedClassName() ]
				);
				return [ null, null ];
			}
			if ( ! $code_base->hasMethodWithFQSEN( $fqsen ) ) {
				$this->emitIssue(
					$code_base,
					$context->withLineNumberStart( substr_count( $preamble, "\n", 0, $template[1][1] ) + 1 ),
					'HtmlTemplateUndeclaredMethodReference',
					'HtmlTemplate: Reference to undeclared method {METHOD}',
					[ $fqsen ]
				);
				return [ null, null ];
			}
			$scope = new FunctionLikeScope(
				new ClassScope( $context->getScope(), $fqsen->getFullyQualifiedClassName(), 0 ),
				$fqsen
			);
			$func = $code_base->getMethodByFQSEN( $fqsen );
			if ( ! $func->isStatic() ) {
				$scope->addVariable(
					new Variable( $context, 'this', StaticType::instance( false )->asRealUnionType(), 0 )
				);
			}
		} else {
			$fqsen = FullyQualifiedFunctionName::fromStringInContext( $template[1][0], $context );
			if ( ! $code_base->hasFunctionWithFQSEN( $fqsen ) ) {
				$this->emitIssue(
					$code_base,
					$context->withLineNumberStart( substr_count( $preamble, "\n", 0, $template[1][1] ) + 1 ),
					'HtmlTemplateUndeclaredFunctionReference',
					'HtmlTemplate: Reference to undeclared function {FUNCTION}',
					[ $fqsen ]
				);
				return [ null, null ];
			}
			$scope = new FunctionLikeScope( $context->getScope(), $fqsen );
			$func  = $code_base->getFunctionByFQSEN( $fqsen );
		}

		return [ $scope, $func ];
	}

	/**
	 * Extract @html-template-var annotations from a string (docblock or preamble).
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function extractHtmlTemplateVars( string $comment, Context $context, CodeBase $code_base ): array {
		$vars = [];
		if ( preg_match_all( self::VAR_REGEX, $comment, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE ) ) {
			foreach ( $matches as $m ) {
				if ( empty( $m['t'][0] ) ) {
					$this->emitIssue(
						$code_base,
						$context->withLineNumberStart( substr_count( $comment, "\n", 0, $m[0][1] ) + 1 ),
						'HtmlTemplateVarUnparseable',
						'HtmlTemplate: Unparseable @html-template-var'
					);
				} else {
					$vars[] = $m;
				}
			}
		}
		return $vars;
	}
}

// Every plugin needs to return an instance of itself at the end.
return new HtmlTemplatePlugin();
