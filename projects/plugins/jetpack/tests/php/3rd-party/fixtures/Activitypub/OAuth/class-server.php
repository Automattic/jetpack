<?php
/**
 * Test fixture: stub `Activitypub\OAuth\Server` whose `is_oauth_request()` returns true.
 *
 * Loaded from tests that need to simulate a real OAuth bearer being present.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Activitypub\OAuth;

if ( ! class_exists( __NAMESPACE__ . '\\Server' ) ) {
	/**
	 * Stub matching the upstream AP plugin shape for the bits the shim consumes.
	 */
	class Server {
		/**
		 * Stubbed: always reports the request as carrying a real OAuth bearer.
		 *
		 * @return bool
		 */
		public static function is_oauth_request(): bool {
			return true;
		}
	}
}
