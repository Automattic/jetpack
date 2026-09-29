<?php
/**
 * Sets up the Sharing & Likes package.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes;

use Automattic\Jetpack\Sharing_Likes\REST\Endpoints;
use Automattic\Jetpack\Sharing_Likes\Settings\Post_Handler;
use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page;

/**
 * Wires up Settings > Sharing and the REST routes behind it, whichever modules are active.
 */
final class Initializer {

	/**
	 * Package version.
	 */
	public const PACKAGE_VERSION = '0.1.0';

	/**
	 * Whether `init()` already ran in this request.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hook everything up. Safe to call more than once.
	 */
	public static function init(): void {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// Outside the `is_admin()` branch, which is false in REST requests.
		Endpoints::init();

		if ( is_admin() ) {
			Settings_Page::init();
			Post_Handler::init();
		}
	}
}
