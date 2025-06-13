<?php
/**
 * Tests for the keepachangelog.com parser.
 *
 * @package automattic/jetpack-changelogger
 */

// phpcs:disable Squiz.Commenting.VariableComment.Missing

namespace Automattic\Jetpack\Changelog\Tests;

use Automattic\Jetpack\Changelog\KeepAChangelogParser;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests for the keepachangelog.com parser.
 *
 * @covers \Automattic\Jetpack\Changelog\KeepAChangelogParser
 */
#[CoversClass( KeepAChangelogParser::class )]
class KeepAChangelogParserTest extends ParserTestCase {
	protected $className       = KeepAChangelogParser::class;
	protected static $fixtures = __DIR__ . '/fixtures/KeepAChangelogParserTest.*.md';
}
