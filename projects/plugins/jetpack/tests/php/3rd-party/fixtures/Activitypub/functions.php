<?php
/**
 * Test fixture: stub of the ActivityPub plugin's `is_activitypub_request()`.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Activitypub;

if ( ! function_exists( __NAMESPACE__ . '\\is_activitypub_request' ) ) {
	/**
	 * Stub driven by the upstream filter, which is how a transform flags its own renders.
	 *
	 * @return bool
	 */
	function is_activitypub_request(): bool {
		return (bool) apply_filters( 'activitypub_is_activitypub_request', false );
	}
}
