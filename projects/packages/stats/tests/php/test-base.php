<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Base class for Stats package testing.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Constants;
use Jetpack_Options;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * Base class for Stats package testing..
 */
abstract class StatsBaseTestCase extends BaseTestCase {
	/**
	 * The default value for setting the 'STATS_VERSION' constant.
	 *
	 * @var string
	 */
	const DEFAULT_STATS_VERSION = '9';

	/**
	 * Set up before each test
	 *
	 * @before
	 */
	protected function set_up() {
		parent::setUp();
		Constants::set_constant( 'STATS_VERSION', self::DEFAULT_STATS_VERSION );
		Jetpack_Options::update_option( 'id', 1234 );
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		WorDBless_Options::init()->clear_options();
		Constants::clear_constants();
	}
}
