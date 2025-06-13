<?php
/**
 * Sniff for PHPUnit's transition from annotations to attributes.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit;

use Automattic\Jetpack\Codesniffer\Utils\AddDocBlockTagsTrait;
use Automattic\Jetpack\Codesniffer\Utils\AddUseClassTrait;
use Automattic\Jetpack\Codesniffer\Utils\Attributes;
use Automattic\Jetpack\Codesniffer\Utils\DocBlocks;
use Automattic\Jetpack\Codesniffer\Utils\NamespaceInfo;
use Automattic\Jetpack\Codesniffer\Utils\RemoveDocBlockIfEmptyTrait;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\CoverageHandler;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\DataProviderHandler;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\DependsHandler;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\EnabledParamHandler;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\ExcludeThingFromBackupHandler;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\GroupHandler;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\Handler;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\ParameterlessHandler;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\PriorityHandler;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\RequiresHandler;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\TestWithHandler;
use Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff\TextParamHandler;
use DomainException;
use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\AfterClass;
use PHPUnit\Framework\Attributes\BackupGlobals;
use PHPUnit\Framework\Attributes\BackupStaticProperties;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\BeforeClass;
use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\Attributes\DoesNotPerformAssertions;
use PHPUnit\Framework\Attributes\PostCondition;
use PHPUnit\Framework\Attributes\PreCondition;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunClassInSeparateProcess;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;

/**
 * Sniff for PHPUnit's transition from annotations to attributes.
 */
class AttributesSniff implements Sniff {
	use \MediaWiki\Sniffs\PHPUnit\PHPUnitTestTrait;
	use AddDocBlockTagsTrait;
	use AddUseClassTrait;
	use RemoveDocBlockIfEmptyTrait;

	/**
	 * Handlers for processing attributes and annotations.
	 *
	 * @var Handler[]
	 */
	protected static $handlers;

	/**
	 * Map for finding the right handler.
	 *
	 * @var array
	 */
	private static $handlermap;

	/**
	 * Whether to keep annotations.
	 *
	 * @var bool
	 */
	public $keepAnnotations = true;

	/**
	 * How to name added attributes.
	 *
	 * @var string 'add-alias', 'use-alias', or 'fully-qualify'
	 */
	public $attributeNaming = 'add-alias';

	/** Constructor */
	public function __construct() {
		if ( static::$handlers === null ) {
			static::$handlers = array();
			foreach ( array(
				// phpcs:disable Squiz.PHP.CommentedOutCode.Found -- Doesn't like some of the comments in here.

				// Method only
				new PriorityHandler( Handler::APPLIES_METHOD, array( '@after' ), array( After::class ) ),
				new PriorityHandler( Handler::APPLIES_METHOD, array( '@afterClass' ), array( AfterClass::class ) ),
				new PriorityHandler( Handler::APPLIES_METHOD, array( '@before' ), array( Before::class ) ),
				new PriorityHandler( Handler::APPLIES_METHOD, array( '@beforeClass' ), array( BeforeClass::class ) ),
				new PriorityHandler( Handler::APPLIES_METHOD, array( '@postCondition' ), array( PostCondition::class ) ),
				new PriorityHandler( Handler::APPLIES_METHOD, array( '@preCondition' ), array( PreCondition::class ) ),
				new ParameterlessHandler( Handler::APPLIES_METHOD, array( '@runInSeparateProcess' ), array( RunInSeparateProcess::class ) ),
				new ParameterlessHandler( Handler::APPLIES_METHOD, array( '@test' ), array( Test::class ) ),
				new DataProviderHandler(), // `@dataProvider`
				new DependsHandler(), // `@depends`
				new TestWithHandler(), // `@testWith

				// Class only
				new CoverageHandler(), // `@covers`, `@coversDefaultClass`, `@uses`, `@usesDefaultClass`
				new ParameterlessHandler( Handler::APPLIES_CLASS, array( '@runClassInSeparateProcess' ), array( RunClassInSeparateProcess::class ) ),
				new ParameterlessHandler( Handler::APPLIES_CLASS, array( '@runTestsInSeparateProcesses' ), array( RunTestsInSeparateProcesses::class ) ),

				// Both
				new EnabledParamHandler( Handler::APPLIES_BOTH, array( '@backupGlobals' ), array( BackupGlobals::class ) ),
				new EnabledParamHandler( Handler::APPLIES_BOTH, array( '@backupStaticAttributes', '@backupStaticProperties' ), array( BackupStaticProperties::class ) ),
				new ParameterlessHandler( Handler::APPLIES_BOTH, array( '@coversNothing' ), array( CoversNothing::class ) ),
				new ParameterlessHandler( Handler::APPLIES_BOTH, array( '@doesNotPerformAssertions' ), array( DoesNotPerformAssertions::class ) ),
				new GroupHandler(), // `@group`, `@ticket`, `@large`, `@medium`, `@small`
				new EnabledParamHandler( Handler::APPLIES_BOTH, array( '@preserveGlobalState' ), array( PreserveGlobalState::class ), true ),
				new TextParamHandler( Handler::APPLIES_BOTH, array( '@testdox' ), array( TestDox::class ) ),
				new RequiresHandler(), // `@requires`

				// Weird
				new ExcludeThingFromBackupHandler(), // `@excludeGlobalVariableFromBackup`, `@excludeStaticPropertyFromBackup`; Annotation is method-only, attribute is both.

				// phpcs:enable Squiz.PHP.CommentedOutCode.Found -- Doesn't like some of the comments in here.
			) as $d ) {
				static::$handlers[ spl_object_id( $d ) ] = $d;
			}

			// Build handlermap.
			static::$handlermap = array(
				Handler::APPLIES_CLASS  => array(),
				Handler::APPLIES_METHOD => array(),
			);
			foreach ( static::$handlers as $d ) {
				$applies = array();
				foreach ( array_keys( static::$handlermap ) as $k ) {
					if ( $d->applies() & $k ) {
						$applies[] = $k;
					}
				}

				foreach ( $d->attributes() as $att ) {
					foreach ( $applies as $k ) {
						static::$handlermap[ $k ]['att'][ $att ] = $d;
					}
				}
				foreach ( $d->annotations() as $ann ) {
					foreach ( $applies as $k ) {
						static::$handlermap[ $k ]['ann'][ $ann ] = $d;
					}
				}
			}
		}
	}

	/**
	 * Returns the token types that this sniff is interested in.
	 *
	 * @return int[]
	 */
	public function register() {
		return array( T_CLASS );
	}

	/**
	 * Processes the tokens that this sniff is interested in.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr The position in the stack where the token was found.
	 * @return void|int Next token or null.
	 * @throws RuntimeException If `$this->attributeNaming` is invalid.
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		if ( ! in_array( $this->attributeNaming, array( 'add-alias', 'use-alias', 'fully-qualify' ), true ) ) {
			throw new RuntimeException( "Invalid value '$this->attributeNaming' for attributeNaming. Valid values are: add-alias, use-alias, fully-qualify" );
		}

		if ( ! $this->isTestClass( $phpcsFile, $stackPtr ) ) {
			return;
		}

		if ( $phpcsFile->fixer->enabled ) {
			$phpcsFile->fixer->beginChangeset();
		}

		$nsinfo  = NamespaceInfo::getNamespaceInfo( $phpcsFile, $stackPtr );
		$aliases = NamespaceInfo::getClassAliases( $phpcsFile, $nsinfo );

		$this->checkAttributes( $phpcsFile, $stackPtr, Handler::APPLIES_CLASS, $nsinfo, $aliases );

		$tokens = $phpcsFile->getTokens();
		$start  = $tokens[ $stackPtr ]['scope_opener'];
		$end    = $tokens[ $stackPtr ]['scope_closer'];
		// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition -- Intentional.
		while ( ( $idx = $phpcsFile->findNext( T_FUNCTION, $start, $end ) ) !== false ) {
			$this->checkAttributes( $phpcsFile, $idx, Handler::APPLIES_METHOD, $nsinfo, $aliases );
			$start = $tokens[ $idx ]['scope_closer'] ?? ( $idx + 1 );
		}

		if ( $phpcsFile->fixer->enabled ) {
			$phpcsFile->fixer->endChangeset();
		}

		return $end;
	}

	/**
	 * Check attributes on a class or method.
	 *
	 * @param File  $phpcsFile The file where the token was found.
	 * @param int   $stackPtr The position in the stack where the token was found.
	 * @param int   $which `APPLIES_CLASS` or `APPLIES_METHOD`.
	 * @param array $nsinfo Namespace info.
	 * @param array &$aliases Class aliases.
	 * @throws DomainException If some handler returns an invalid 'op'.
	 */
	protected function checkAttributes( File $phpcsFile, $stackPtr, $which, array $nsinfo, array &$aliases ) {
		$usedhandlers = array();
		$annotations  = array();
		$attributes   = array();
		$tokens       = $phpcsFile->getTokens();

		$newAnns        = array();
		$newAttrs       = array();
		$removedAnyAnns = false;

		// Extract annotations.
		$docBlock = DocBlocks::findDocBlockForDeclaration( $phpcsFile, $stackPtr );
		if ( $docBlock !== false ) {
			foreach ( DocBlocks::getCommentTags( $phpcsFile, $docBlock ) as $ann ) {
				if ( isset( static::$handlermap[ $which ]['ann'][ $ann['name'] ] ) ) {
					$d    = static::$handlermap[ $which ]['ann'][ $ann['name'] ];
					$data = $d->parseAnnotation( $phpcsFile, $ann, $which );
					if ( $data !== null ) {
						$usedhandlers[ spl_object_id( $d ) ]         = $d;
						$annotations[ spl_object_id( $d ) ][ $data ] = $ann;
					}
				}
			}
		}

		// Extract attributes.
		foreach ( Attributes::getAttributesForDeclaration( $phpcsFile, $stackPtr ) as $att ) {
			$att['name'] = ltrim( NamespaceInfo::qualifyClassName( $att['name'], $nsinfo['name'], $aliases ), '\\' );
			if ( isset( static::$handlermap[ $which ]['att'][ $att['name'] ] ) ) {
				$d    = static::$handlermap[ $which ]['att'][ $att['name'] ];
				$data = $d->parseAttribute( $phpcsFile, $att, $which );
				if ( $data !== null ) {
					$usedhandlers[ spl_object_id( $d ) ]        = $d;
					$attributes[ spl_object_id( $d ) ][ $data ] = $att;
				}
			}
		}

		// Process.
		foreach ( $usedhandlers as $id => $d ) {
			$ops = $d->process( $phpcsFile, $stackPtr, $attributes[ $id ] ?? array(), $annotations[ $id ] ?? array(), $which, $this->keepAnnotations );
			$fix = false;
			foreach ( $ops as $op ) {
				switch ( $op['op'] ) {
					case Handler::OP_MESSAGE:
						$func = empty( $op['isError'] ) ? 'addWarning' : 'addError';
						$ok   = $phpcsFile->$func(
							$op['msg'],
							$op['ptr'],
							$op['code'],
							$op['data'] ?? array(),
							$op['severity'] ?? 0,
							$op['isFixable'] ?? true
						);
						if ( $phpcsFile->fixer->enabled && ( $op['isFixable'] ?? true ) ) {
							$fix = $ok;
						}
						break;

					case Handler::OP_ANN_ADD:
						if ( $fix ) {
							// Just collect new annotations for now, to add all at once below.
							$newAnns[] = $op['tag'] . $op['content'];
						}
						break;

					case Handler::OP_ANN_REPLACE:
						if ( $fix ) {
							// Remove the existing annotation, then inject the new one in place of one of its tokens.
							$indent = DocBlocks::getIndent( $phpcsFile, $docBlock );
							for ( $i = $op['ann']['startptr']; $i <= $op['ann']['endptr']; $i++ ) {
								$phpcsFile->fixer->replaceToken( $i, '' );
							}
							$phpcsFile->fixer->replaceToken(
								$op['ann']['ptr'],
								"$indent* {$op['tag']}" . str_replace( "\n", "\n$indent* ", $op['content'] ) . "\n"
							);
						}
						break;

					case Handler::OP_ANN_REMOVE:
						if ( $fix ) {
							$removedAnyAnns = true;
							for ( $i = $op['ann']['startptr']; $i <= $op['ann']['endptr']; $i++ ) {
								$phpcsFile->fixer->replaceToken( $i, '' );
							}
						}
						break;

					case Handler::OP_ATT_ADD:
						if ( $fix ) {
							// Just collect new attributes for now, to add all at once below.
							$newAttrs[] = '#[' . $this->unqualifyClassNameIfAppropriate( $phpcsFile, $op['class'], $nsinfo, $aliases ) . $op['params'] . ']';
						}
						break;

					default:
						// Should never get here.
						throw new DomainException( "Unknown op {$op['op']}" ); // @codeCoverageIgnore
				}
			}
		}

		// Insert any needed attributes.
		if ( $newAttrs ) {
			$idx    = Attributes::findAttributeInsertionPointForDeclaration( $phpcsFile, $stackPtr );
			$indent = '';
			// phpcs:ignore Generic.CodeAnalysis.ForLoopWithTestFunctionCall.NotAllowed -- No better way to do it.
			for ( $i = $idx; $tokens[ $i ]['code'] === T_WHITESPACE || $phpcsFile->fixer->getTokenContent( $i ) === ''; $i++ ) {
				$indent .= $phpcsFile->fixer->getTokenContent( $i );
			}
			$phpcsFile->fixer->addContentBefore( $idx, $indent . implode( "\n$indent", $newAttrs ) . "\n" );
			if ( ! str_ends_with( $phpcsFile->fixer->getTokenContent( $idx - 1 ), "\n" ) ) {
				$phpcsFile->fixer->addContentBefore( $idx, "\n" );
			}
		}

		// Insert any needed annotations.
		if ( $newAnns ) {
			$this->addDocBlockTags( $phpcsFile, $docBlock !== false ? $docBlock : $stackPtr, $newAnns );
		}

		// If we removed any annotations, check if the doc comment is now empty.
		if ( $removedAnyAnns ) {
			$this->removeDocBlockIfEmpty( $phpcsFile, $docBlock );
		}
	}

	/**
	 * Unqualify an attribute class name, if so configured and possible.
	 *
	 * @param File   $phpcsFile PHPCS File.
	 * @param string $class Attribute class name.
	 * @param array  $nsinfo Namespace info.
	 * @param array  &$aliases Existing class aliases.
	 * @return string Class name to use.
	 */
	protected function unqualifyClassNameIfAppropriate( File $phpcsFile, $class, array $nsinfo, array &$aliases ) {
		if ( $this->attributeNaming === 'fully-qualify' ) {
			return '\\' . $class;
		}

		$alias = NamespaceInfo::unqualifyClassName( $class, $nsinfo['name'], $aliases );
		if ( $this->attributeNaming === 'use-alias' || ! str_contains( $alias, '\\' ) ) {
			return $alias;
		}

		$alias = substr( $class, strrpos( $class, '\\' ) + 1 );
		if ( isset( $aliases[ $alias ] ) ) {
			// Some other class is already using our name. Can't add, so fully qualify it.
			return '\\' . $class;
		}
		if ( $this->addUseClass( $phpcsFile, $nsinfo, $class ) ) {
			$aliases[ $alias ] = '\\' . $class;
			return $alias;
		} else {
			// Something went wrong. Should never happen.
			return '\\' . $class; // @codeCoverageIgnore
		}
	}
}
