<?php
/**
 * Subscription service factory without the newer shared entitlement helper.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

/**
 * Return the service supplied by the isolated compatibility test.
 *
 * @return object Subscription service fixture.
 */
function subscription_service() {
	return $GLOBALS['__vp_compatibility_service'];
}
