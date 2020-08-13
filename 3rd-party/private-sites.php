<?php
/**
 * Adds the ability to activate a "private site" mode for Jetpack. This does not change the visibility or
 * accessibility of the site at all, but only deactivates parts of Jetpack that could reveal content, e.g. the WP.com Reader.
 *
 * @package Jetpack.
 */

namespace Automattic\Jetpack\PrivateSite;

use function add_filter;
use function apply_filters;

add_action( 'init', __NAMESPACE__ . '\add_filters' );

/**
 * Checks if the filter is set to enable 'private site mode' and adds needed filters.
 *
 * Runs on the `init` hook.
 */
function add_filters() {
	/**
	 * Activates Jetpack's "Private Site" Mode.
	 *
	 * This filter will enable a variety of filters needed to ensure that content is not publicly visible.
	 *
	 * @since 8.9.0
	 *
	 * @param $activate bool To enable "private site mode". Default false.
	 */
	if ( ! apply_filters( 'jetpack_private_site_mode', false ) ) {
		return; // Private Site Mode is disabled.
	}

	/**
	 * Disables the JSON API and Enhanced Distribution modules.
	 *
	 * The JSON API module allows for interacting with site content via public-api.wordpress.com, including reading
	 * content that is usually public (e.g. "public" posts).
	 *
	 * The Enhanced Distribution module pushes pings of new posts to a firehose.
	 */
	add_filter(
		'jetpack_active_modules',
		function ( $modules ) {
			unset( $modules['json-api'] );
			unset( $modules['enhanced-distribution'] );

			return $modules;
		}
	);

	/**
	 * Removes the JSON API and Enhanced Distribution from available features.
	 */
	add_filter(
		'jetpack_get_available_modules',
		function ( $modules ) {
			unset( $modules['json-api'] );
			unset( $modules['enhanced-distribution'] );

			return $modules;
		}
	);

	/**
	 * Filters various sync functionality so that the WordPress.com-side gets a "-1" for the `blog_public` option.
	 *
	 * Core uses a 0 or 1 for this option to indicate if a site should be indexed by search engines or not. WP.com adds
	 * a third `-1` option to indicate a site is private. These filters allow us to provide to WP.com the expected value
	 * without potential breakage to code expecting Core's possible values. (e.g. -1 == true == 1, which is to allow indexing.
	 */
	add_filter( 'jetpack_sync_before_enqueue_added_option', __NAMESPACE__ . '\filter_blog_public_option' );
	add_filter( 'jetpack_sync_before_enqueue_updated_option', __NAMESPACE__ . '\filter_blog_public_option' );
	add_filter( 'jetpack_sync_before_enqueue_deleted_option', __NAMESPACE__ . '\filter_blog_public_option' );
	add_filter( 'jetpack_sync_before_send_jetpack_full_sync_options', __NAMESPACE__ . '\filter_blog_public_option_full_sync', 11 );

}

/**
 * Filter the blog_public option for option updates.
 *
 * @param array $args {
 *  Sync values.
 *
 * @type string Option name.
 * @type mixed Old value.
 * @type mixed New value.
 * }
 *
 * @return array
 */
function filter_blog_public_option( $args ) {
	if ( 'blog_public' === $args[0] ) {
		$args[2] = '-1';
	}

	return $args;
}

/**
 * Filter the blog_public option on full syncs.
 *
 * @param array $args {
 *  Sync option values.
 *
 * @type string Option name.
 * @type mixed Value.
 * }
 *
 * @return array
 */
function filter_blog_public_option_full_sync( $args ) {
	if ( ! $args ) {
		return $args;
	}

	$args['blog_public'] = '-1';

	return $args;
}

