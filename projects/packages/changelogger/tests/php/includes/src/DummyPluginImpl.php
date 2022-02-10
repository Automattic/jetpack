<?php
/**
 * Dummy plugin implementation for testing plugin handling.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Tests;

/**
 * Dummy plugin implementation for testing plugin handling.
 */
class DummyPluginImpl implements DummyPlugin {
	use \Automattic\Jetpack\Changelogger\PluginTrait;

	/**
	 * Configuration.
	 *
	 * @var array
	 */
	public $config;

	/**
	 * Constructor.
	 *
	 * @param array $config Configuration.
	 */
	public function __construct( array $config ) {
		$this->config = $config;
	}
}
