<?php
/**
 * Compatibility for Web Stories
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Web_Stories;

/**
 * Exclude Web Stories pages to be processed by the Render Blocking JS module.
 *
 * @param bool $should_defer_js default filter value.
 */
function web_stories_should_defer_js( $should_defer_js ) {
	if ( class_exists( '\Google\Web_Stories\Story_Post_Type' )
		&& defined( '\Google\Web_Stories\Story_Post_Type::POST_TYPE_SLUG' )
		&& is_singular( \Google\Web_Stories\Story_Post_Type::POST_TYPE_SLUG ) ) {
		return false;
	}

	return $should_defer_js;
}

add_filter( 'jetpack_boost_should_defer_js', __NAMESPACE__ . '\web_stories_should_defer_js' );
