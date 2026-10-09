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
 * Wires up Settings > Sharing and the REST routes behind it, even with the Sharing, Likes and Comment Likes modules off.
 */
final class Initializer {

	/**
	 * Package version.
	 */
	const PACKAGE_VERSION = '0.2.0';

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

		// Not behind `is_admin()`: Calypso's sidebar comes from `wpcom/v2/admin-menu`, a REST request that fires `admin_menu`.
		Endpoints::init();
		Settings_Page::init();
		Post_Handler::init();
	}
}
