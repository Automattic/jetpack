<?php
/**
 * Sniff for PHPUnit's deprecation of test-method-level coverage.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit;

use Automattic\Jetpack\Codesniffer\Utils\AddDocBlockTagsTrait;
use Automattic\Jetpack\Codesniffer\Utils\DocBlocks;
use Automattic\Jetpack\Codesniffer\Utils\Navigation;
use Automattic\Jetpack\Codesniffer\Utils\RemoveDocBlockIfEmptyTrait;
use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

/**
 * Sniff for PHPUnit's deprecation of test-method-level coverage.
 */
class TestMethodCoversSniff implements Sniff {
	use \MediaWiki\Sniffs\PHPUnit\PHPUnitTestTrait;
	use AddDocBlockTagsTrait;
	use RemoveDocBlockIfEmptyTrait;

	/**
	 * How to fix `@covers`.
	 *
	 * @var string 'remove', 'preserve', or 'preserve-class'.
	 */
	public $fixCovers = 'preserve-class';

	/**
	 * How to fix `@uses`.
	 *
	 * @var string 'remove', 'preserve', or 'preserve-class'.
	 */
	public $fixUses = 'preserve';

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
	 * @throws RuntimeException If `$this->fixCovers` or `$this->fixUses` is invalid.
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		static $fixes = array( 'remove', 'preserve', 'preserve-class' );
		if ( ! in_array( $this->fixCovers, $fixes, true ) ) {
			throw new RuntimeException( "Invalid value '$this->fixCovers' for fixCovers. Valid values are: " . implode( ' ', $fixes ) );
		}
		if ( ! in_array( $this->fixUses, $fixes, true ) ) {
			throw new RuntimeException( "Invalid value '$this->fixUses' for fixUses. Valid values are: " . implode( ' ', $fixes ) );
		}

		$preserveAny = $this->fixCovers !== 'remove' || $this->fixUses !== 'remove';
		$tokens      = $phpcsFile->getTokens();

		if ( ! $this->isTestClass( $phpcsFile, $stackPtr ) ) {
			return $tokens[ $stackPtr ]['scope_closer'];
		}

		// Collect info from the class's existing doc comment, if any.
		$data = array(
			'covers' => array(
				'info'         => array(),
				'defaultClass' => null,
				'insert'       => null,
				'fix'          => $this->fixCovers,
			),
			'uses'   => array(
				'info'         => array(),
				'defaultClass' => null,
				'insert'       => null,
				'fix'          => $this->fixUses,
			),
		);

		// If we're going to potentially move anything to the class level, we need to collect some data from the class comment.
		$classDocPtr = false; // Make Phan happy.
		if ( $preserveAny ) {
			$classDocPtr = DocBlocks::findDocBlockForDeclaration( $phpcsFile, $stackPtr );
			if ( $classDocPtr !== false ) {
				$idx  = Navigation::findPreviousInRun( $phpcsFile, T_DOC_COMMENT_WHITESPACE, array( T_DOC_COMMENT_WHITESPACE, T_DOC_COMMENT_STAR ), $tokens[ $classDocPtr ]['comment_closer'] - 1, null, "\n" );
				$tags = DocBlocks::getCommentTags( $phpcsFile, $classDocPtr );
				foreach ( $tags as $tag ) {
					if ( $tag['name'] !== '@coversDefaultClass' && $tag['name'] !== '@usesDefaultClass' ) {
						continue;
					}
					$which = substr( $tag['name'], 1, -12 );
					$class = '\\' . ltrim( explode( ' ', $tag['content'], 2 )[0], '\\' );
					if ( $class !== '\\' ) {
						$data[ $which ]['defaultClass'] = $class;
					}
				}
				foreach ( $tags as $i => $tag ) {
					if ( $tag['name'] !== '@covers' && $tag['name'] !== '@uses' ) {
						continue;
					}
					$which                              = substr( $tag['name'], 1 );
					list( $class, $content )            = $this->parseCovers( $tag['content'], $data[ $which ]['defaultClass'] );
					$data[ $which ]['info'][ $content ] = true;
					$data[ $which ]['insert']           = $tags[ $i + 1 ]['ptr'] ?? null;
				}
			}
		}

		// Process each method in the class to remove any `@covers` and `@uses`, and record what needs to be added to the class comment.
		$anyFixes = false;
		$start    = $tokens[ $stackPtr ]['scope_opener'];
		$end      = $tokens[ $stackPtr ]['scope_closer'];
		// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition -- Intentional here.
		while ( ( $idx = $phpcsFile->findNext( T_FUNCTION, $start, $end ) ) !== false ) {
			$start = $tokens[ $idx ]['scope_closer'] ?? ( $idx + 1 );

			$methodDocPtr = DocBlocks::findDocBlockForDeclaration( $phpcsFile, $idx );
			if ( $methodDocPtr === false ) {
				continue;
			}

			$anyFixesForMethod = false;
			foreach ( DocBlocks::getCommentTags( $phpcsFile, $methodDocPtr ) as $tag ) {
				if ( $tag['name'] !== '@covers' && $tag['name'] !== '@uses' ) {
					continue;
				}
				$which = substr( $tag['name'], 1 );
				$fix   = $phpcsFile->addFixableWarning(
					"Use of `{$tag['name']}` on test methods is deprecated in PHPUnit 11 and removed in PHPUnit 12.",
					$tag['ptr'],
					ucfirst( "{$which}Found" )
				);
				if ( $fix ) {
					$anyFixesForMethod = true;
					if ( ! $anyFixes ) {
						$phpcsFile->fixer->beginChangeset();
						$anyFixes = true;
					}
					for ( $i = $tag['startptr']; $i <= $tag['endptr']; $i++ ) {
						$phpcsFile->fixer->replaceToken( $i, '' );
					}

					if ( $data[ $which ]['fix'] !== 'remove' ) {
						list( $class, $content ) = $this->parseCovers( $tag['content'], $data[ $which ]['defaultClass'] );
						if ( $data[ $which ]['fix'] === 'preserve-class' && $class !== '' ) {
							$content = $class;
						}
						if ( ! isset( $data[ $which ]['info'][ $content ] ) ) {
							$data[ $which ]['info'][ $content ] = $class;
						}
					}
				}
			}

			// If we removed stuff from this doc comment, check if the doc comment is now empty.
			if ( $anyFixesForMethod ) {
				$this->removeDocBlockIfEmpty( $phpcsFile, $methodDocPtr );
			}
		}

		// Now update the class comment with any removed `@covers` or `@uses`, with deduplication.
		if ( ! $anyFixes ) {
			return $end;
		}

		if ( ! $preserveAny ) { // Short circuit.
			$phpcsFile->fixer->endChangeset();
			return $end;
		}

		foreach ( array( 'covers', 'uses' ) as $which ) {
			ksort( $data[ $which ]['info'] );
			$toAdd = array();
			foreach ( $data[ $which ]['info'] as $content => $class ) {
				if ( $class !== true && ( $class === '' || $class === $content || ! isset( $data[ $which ]['info'][ $class ] ) ) ) {
					$toAdd[] = "@$which $content";
				}
			}
			$this->addDocBlockTags( $phpcsFile, $classDocPtr ? $data[ $which ]['insert'] ?? $classDocPtr : $stackPtr, $toAdd );
		}

		$phpcsFile->fixer->endChangeset();

		return $end;
	}

	/**
	 * Process a `@covers` or `@uses` annotation.
	 *
	 * @param string  $content Annotation content.
	 * @param ?string $defaultClass Value from `@coversDefaultClass` or `@usesDefaultClass`, if any.
	 * @return array{string,string} Class (if any) and full entry.
	 */
	private function parseCovers( $content, $defaultClass ) {
		$value = preg_replace( '/[\s()]+$/', '', $content );
		$value = explode( ' ', $value, 2 )[0];

		if ( ! str_contains( $content, '::' ) ) {
			$content = '\\' . ltrim( $content, '\\' );
			return array( $content, $content );
		}
		list( $class, $method ) = explode( '::', $content, 2 );
		if ( $class === '' && $defaultClass === null ) {
			return array( '', $content );
		}

		$class = '\\' . ltrim( $class !== '' ? $class : $defaultClass, '\\' );
		return array( $class, "$class::$method" );
	}
}
