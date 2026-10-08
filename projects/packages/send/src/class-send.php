<?php
/**
 * Jetpack Send bootstrap.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Wires Jetpack Send's hooks.
 */
class Send {

	/**
	 * Package version, bumped at release through composer.json `version-constants`.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Whether init() already ran.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire the hooks once.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		Admin_Page::init();
	}

	/**
	 * Remove everything Send stored on the site.
	 *
	 * @return void
	 */
	public static function uninstall() {
	}
}
