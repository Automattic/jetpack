<?php
/**
 * All in One SEO compatibility for Boost
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\AIOSEO;

use Automattic\Jetpack_Boost\Jetpack_Boost;

// Add the Critical CSS generation query arg to the list of allowed query args of All in One SEO.
// This prevents All in One SEO from removing the query arg, which breaks Critical CSS generation.
add_filter( 'aioseo_unrecognized_allowed_query_args', array( Jetpack_Boost::class, 'whitelist_query_args' ) );
