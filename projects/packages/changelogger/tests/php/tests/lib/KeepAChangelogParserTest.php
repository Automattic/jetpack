<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the keepachangelog.com parser.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable WordPress.NamingConventions.ValidVariableName, Squiz.Commenting.VariableComment.Missing

namespace Automattic\Jetpack\Changelog\Tests;

use Automattic\Jetpack\Changelog\KeepAChangelogParser;

/**
 * Tests for the keepachangelog.com parser.
 *
 * @covers \Automattic\Jetpack\Changelog\KeepAChangelogParser
 */
class KeepAChangelogParserTest extends ParserTestCase {
	protected $className = KeepAChangelogParser::class;
	protected $fixtures  = __DIR__ . '/fixtures/KeepAChangelogParserTest.*.md';
}
