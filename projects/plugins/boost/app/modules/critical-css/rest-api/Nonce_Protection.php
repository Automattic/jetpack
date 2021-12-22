<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

/**
 * A REST API Endpoint that should be protected by a nonce.
 *
 * By tagging a `Boost_Endpoint` with `Nonce_Protection` Boost_API will automatically
 * wrap the permission callback to first validate the nonce and only
 * then call the `permission_callback` that the Boost_Endpoint
 * instance is using.
 */
interface Nonce_Protection {}