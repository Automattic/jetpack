<?php
/**
 * Yoast SEO compatibility for Boost
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Yoast;

// Add the Critical CSS generation query arg to Yoast's allowed query args list.
// This prevents Yoast from removing the query arg, which breaks Critical CSS generation.
add_filter( 'Yoast\WP\SEO\allowlist_permalink_vars', array( '\Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Critical_CSS', 'add_critical_css_query_arg_to_list' ) );
