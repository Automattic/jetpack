<?php
/**
 * Nonce protection interface.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

/**
 * A REST API Endpoint that should be protected by a nonce.
 *
 * By tagging a `BoostEndpoint` with `NonceProtection` BoostAPI will automatically
 * wrap the permission callback to first validate the nonce and only
 * then call the `permission_callback` that the BoostEndpoint
 * instance is using.
 */
interface NonceProtection {}
