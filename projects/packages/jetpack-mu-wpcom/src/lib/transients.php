<?php
/**
 * Blog-scoped transient helpers.
 *
 * Thin wrappers around WordPress transient functions that make
 * per-blog storage intent explicit. On Simple sites (multisite),
 * set_transient() already stores per-blog in each blog's wp_options
 * table. On Atomic (single-site), there is only one blog.
 *
 * These wrappers add no runtime logic — they exist to make the
 * intent self-documenting for developers and AI agents.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Set a blog-scoped transient.
 *
 * Stores data that is specific to the current blog. On multisite
 * (Simple), this is isolated per blog automatically. On single-site
 * (Atomic), there is only one blog.
 *
 * @param string $key        Transient name. Must be 172 characters or fewer.
 * @param mixed  $value      Transient value.
 * @param int    $expiration Time until expiration in seconds. Default 0 (no expiration).
 * @return bool True if the value was set, false otherwise.
 */
function wpcom_set_blog_transient( $key, $value, $expiration = 0 ) {
	return set_transient( $key, $value, $expiration );
}

/**
 * Get a blog-scoped transient.
 *
 * @param string $key Transient name.
 * @return mixed Transient value or false if not set / expired.
 */
function wpcom_get_blog_transient( $key ) {
	return get_transient( $key );
}

/**
 * Delete a blog-scoped transient.
 *
 * @param string $key Transient name.
 * @return bool True if the transient was deleted, false otherwise.
 */
function wpcom_delete_blog_transient( $key ) {
	return delete_transient( $key );
}
