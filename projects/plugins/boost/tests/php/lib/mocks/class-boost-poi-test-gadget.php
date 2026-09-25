<?php
/**
 * Mock gadget class for the PHP Object Injection tests.
 *
 * Stands in for a class an attacker would name in a serialized payload; in a real
 * attack it lives in WordPress core, another plugin, or a theme. The tests use it
 * to prove that reading a poisoned cache entry never instantiates it and never
 * fires its magic methods.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Mocks;

/**
 * Class Boost_POI_Test_Gadget
 */
class Boost_POI_Test_Gadget {

	/**
	 * Set to true if __wakeup() ever runs, which would mean unserialize()
	 * really instantiated this class. Reset between tests.
	 *
	 * @var bool
	 */
	public static $woken = false;

	/**
	 * Marker property, stands in for attacker-controlled gadget state.
	 *
	 * @var string
	 */
	public $payload = 'rce';

	/**
	 * Records that deserialization instantiated this class for real.
	 */
	public function __wakeup() {
		self::$woken = true;
	}
}
