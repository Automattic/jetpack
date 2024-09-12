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

	private const IDENTIFIER  = '[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*';
	private const FQSEN_REGEX = '/@html-template(?=[^a-zA-Z0-9_-]|$)(?:\s+(\\\\?' . self::IDENTIFIER . '(?:\\\\' . self::IDENTIFIER . ')*(?:::' . self::IDENTIFIER . ')?))?/';
	private const VAR_REGEX   = '/@html-template-var(?=[^a-zA-Z0-9_-]|$)(?:\s+(?<t>' . UnionType::union_type_regex . ')\s*&?\\$(?<v>' . self::IDENTIFIER . '))?/';

	/**
	 * This method is called before analyzing a file.
	 *
	 * @param CodeBase $code_base The code base in which the node exists.
	 * @param Context  $context A context with the file name for $file_contents and the scope before analyzing $node.
	 * @param string   $file_contents the unmodified file contents.
	 * @param Node     $node the node parsed from $file_contents.
	 */
	public function beforeAnalyzeFile( CodeBase $code_base, Context $context, string $file_contents, Node $node ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! preg_match( self::FQSEN_REGEX, $file_contents ) && ! preg_match( self::VAR_REGEX, $file_contents ) ) {
			// No point in tokenizing if the comment isn't there at all.
			return;
		}

		// We only support {at}html-template in file-level comments, i.e. comments before the first real token in the file.
		static $okTokens = array( \T_OPEN_TAG, \T_COMMENT, \T_DOC_COMMENT, \T_WHITESPACE );
		$preamble        = '';
		$in_preamble     = true;
		foreach ( PhpToken::tokenize( $file_contents ) as $token ) {
			$kind = $token->id;
			if ( $in_preamble && in_array( $kind, $okTokens, true ) ) {
				$preamble .= $token->text;
				continue;
			}
			$in_preamble = false;

			// {at}html-template must be before the first code in the file, so flag that.
			// {at}html-template-var could be if it's on a function doc comment, but we can still syntax check.
			if ( $kind === \T_COMMENT || $kind === \T_DOC_COMMENT ) {
				if ( preg_match_all( self::FQSEN_REGEX, $token->text, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE ) ) {
					foreach ( $matches as $m ) {
						$this->emitIssue(
							$code_base,
							$context->withLineNumberStart( substr_count( $token->text, "\n", 0, $m[0][1] ) + $token->line ),
							'HtmlTemplateTooLate',
							'Ignored @html-template as it is after the first code in the file'
						);
					}
				}
				if ( preg_match_all( self::VAR_REGEX, $token->text, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE ) ) {
					foreach ( $matches as $m ) {
						// @todo Can we easily differentiate "function doc bloc" from any other doc block here to better warn?
						if ( $kind === \T_COMMENT ) {
							$this->emitIssue(
								$code_base,
								$context->withLineNumberStart( substr_count( $token->text, "\n", 0, $m[0][1] ) + $token->line ),
								'HtmlTemplateVarTooLate',
								'Ignored @html-template-var as it is after the first code in the file (and isn\'t in a function doc block)'
							);
						} elseif ( empty( $m['t'][0] ) ) {
							$this->emitIssue(
								$code_base,
								$context->withLineNumberStart( substr_count( $token->text, "\n", 0, $m[0][1] ) + $token->line ),
								'HtmlTemplateVarUnparseable',
								'Unparseable @html-template-var'
							);
						}
					}
				}
			}
		}

		// Find the {at}html-template, and handle any with invalid syntax.
		$template = null;
		if ( preg_match_all( self::FQSEN_REGEX, $preamble, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE ) ) {
			foreach ( $matches as $m ) {
				if ( empty( $m[1][0] ) ) {
					$this->emitIssue(
						$code_base,
						$context->withLineNumberStart( substr_count( $preamble, "\n", 0, $m[0][1] ) + 1 ),
						'HtmlTemplateUnparseable',
						'Unparseable @html-template'
					);
					continue;
				}
				if ( $template ) {
					$this->emitIssue(
						$code_base,
						$context->withLineNumberStart( substr_count( $preamble, "\n", 0, $template[0][1] ) + 1 ),
						'HtmlTemplateRedefined',
						'@html-template is redefined later in the file'
					);
				}
				$template = $m;
			}
		}
		if ( $template === null ) {
			return;
		}

		// Create a scope pointing at the specified method or function, as that's where we assume we're being called from inside of.
		if ( str_contains( $template[1][0], '::' ) ) {
			$fqsen = FullyQualifiedMethodName::fromStringInContext( $template[1][0], $context );
			if ( ! $code_base->hasClassWithFQSEN( $fqsen->getFullyQualifiedClassName() ) ) {
				$this->emitIssue(
					$code_base,
					$context->withLineNumberStart( substr_count( $preamble, "\n", 0, $template[1][1] ) + 1 ),
					'HtmlTemplateUndeclaredClassReference',
					'Reference to method {METHOD} from undeclared class {CLASS}',
					array( $fqsen, $fqsen->getFullyQualifiedClassName() )
				);
				return;
			}
			if ( ! $code_base->hasMethodWithFQSEN( $fqsen ) ) {
				$this->emitIssue(
					$code_base,
					$context->withLineNumberStart( substr_count( $preamble, "\n", 0, $template[1][1] ) + 1 ),
					'HtmlTemplateUndeclaredMethodReference',
					'Reference to undeclared method {METHOD}',
					array( $fqsen )
				);
				return;
			}
			$scope = new FunctionLikeScope(
				new ClassScope( $context->getScope(), $fqsen->getFullyQualifiedClassName(), 0 ),
				$fqsen
			);
			$func  = $code_base->getMethodByFQSEN( $fqsen );
			if ( ! $func->isStatic() ) {
				$scope->addVariable( new Variable( $context, 'this', StaticType::instance( false )->asRealUnionType(), 0 ) );
			}
		} else {
			$fqsen = FullyQualifiedFunctionName::fromStringInContext( $template[1][0], $context );
			if ( ! $code_base->hasFunctionWithFQSEN( $fqsen ) ) {
				$this->emitIssue(
					$code_base,
					$context->withLineNumberStart( substr_count( $preamble, "\n", 0, $template[1][1] ) + 1 ),
					'HtmlTemplateUndeclaredFunctionReference',
					'Reference to undeclared function {FUNCTION}',
					array( $fqsen )
				);
				return;
			}
			$scope = new FunctionLikeScope( $context->getScope(), $fqsen );
			$func  = $code_base->getFunctionByFQSEN( $fqsen );
		}

		// Check the method/function's phpdoc and the file comment for {at}html-template-var annotations. Add those vars to the scope too.
		$vars = array();
		if ( $func->getDocComment() && preg_match_all( self::VAR_REGEX, (string) $func->getDocComment(), $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE ) ) {
			foreach ( $matches as $m ) {
				if ( ! empty( $m['t'][0] ) ) {
					$vars[] = $m;
				}
			}
		}
		if ( preg_match_all( self::VAR_REGEX, $preamble, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE ) ) {
			foreach ( $matches as $m ) {
				if ( empty( $m['t'][0] ) ) {
					$this->emitIssue(
						$code_base,
						$context->withLineNumberStart( substr_count( $preamble, "\n", 0, $m[0][1] ) + 1 ),
						'HtmlTemplateVarUnparseable',
						'Unparseable @html-template-var'
					);
				} else {
					$vars[] = $m;
				}
			}
		}
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

		// And finally, set the scope of the context to our new scope.
		$context->setScope( $scope );
	}
}

// Every plugin needs to return an instance of itself at the
// end of the file in which it's defined.
return new HtmlTemplatePlugin();
