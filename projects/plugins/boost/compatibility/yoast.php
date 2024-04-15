<?php
/**
 * Yoast SEO compatibility for Boost
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Yoast;

use Automattic\Jetpack_Boost\Jetpack_Boost;

// Add the Critical CSS generation query arg to Yoast's allowed query args list.
// This prevents Yoast from removing the query arg, which breaks Critical CSS generation.
add_filter( 'Yoast\WP\SEO\allowlist_permalink_vars', array( Jetpack_Boost::class, 'whitelist_query_args' ) );
