<?php

namespace Automattic\Jetpack\Codesniffer\Tests\Utils;

use PHP_CodeSniffer\Config;
use PHP_CodeSniffer\Files\DummyFile;
use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Ruleset;
use PHPUnit\Framework\TestCase as BaseTestCase;

/**
 * Base class with some useful function for testing PHPCS utility methods.
 *
 * Loosely inspired by PHPCSUtils\TestUtils\UtilityMethodTestCase.
 */
abstract class TestCase extends BaseTestCase {

	public function setUp(): void {
		parent::setUp();

		// Clear the cache, we tend to reuse filenames.
		// @phan-suppress-next-line PhanAccessMethodInternal
		\PHPCSUtils\Internal\Cache::clear();
	}

	/**
	 * Create a PHP_CodeSniffer\Files\File object for the passed content.
	 *
	 * @param string $content Content of the file.
	 * @param array  $options Additional options.
	 *   - filename: (string) Filename to use for the content.
	 *   - sniffs: (string[]) Sniffs to run.
	 * @return File File object.
	 */
	protected function createPhpcsFile( $content, $options = array() ) {
		$options += array(
			'filename' => 'dummy.php',
			'sniffs'   => array( 'Dummy.Dummy.Dummy' ),
		);

		$config = new Config();

		// Needs some standard set in order to parse the file.
		$config->standards = array( 'PSR1' );

		$config->files       = array( $options['filename'] );
		$config->encoding    = 'utf-8';
		$config->reports     = array( 'full' => null );
		$config->colors      = false;
		$config->reportWidth = PHP_INT_MAX;
		$config->showSources = true;
		$config->tabWidth    = 4;
		$config->sniffs      = $options['sniffs'];

		$ruleset     = new Ruleset( $config );
		$dummy       = new DummyFile( $content, $ruleset, $config );
		$dummy->path = $options['filename'];

		$dummy->parse();

		return $dummy;
	}

	/**
	 * Find the target token by looking for a preceeding comment.
	 *
	 * The first token of the specified type after the specified comment is
	 * returned, regardless of intervening content.
	 *
	 * @param File                         $phpcsFile File to look in.
	 * @param string                       $commentString Comment to look for. Include the opener and closer.
	 * @param int|string|array<int|string> $tokenType     The type of token(s) to look for.
	 * @param ?string                      $tokenContent  Optional. The token content for the target token.
	 * @return ?int Index of the target token.
	 */
	public function findTargetToken( File $phpcsFile, $commentString, $tokenType, $tokenContent = null ) {
		$start   = $phpcsFile->numTokens - 1;
		$comment = $phpcsFile->findPrevious( T_COMMENT, $start, null, false, $commentString );
		if ( $comment === false ) {
			return null;
		}

		$idx = $phpcsFile->findNext( $tokenType, $comment + 1, null, false, $tokenContent );
		return $idx === false ? null : $idx;
	}
}
