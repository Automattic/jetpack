<?php
/**
 * Public helpers of the Jetpack Announcements package.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

/**
 * Registers an announcement. Call it on the `jetpack_register_announcements` action.
 *
 * @since $$next-version$$
 *
 * @param string $id   Namespaced id, `vendor/slug`.
 * @param array  $args {
 *     The announcement. Every value is sanitized.
 *
 *     @type string   $date       When it was published. Parsed as GMT unless it carries an offset.
 *     @type string   $title      Plain text.
 *     @type string[] $channels   The channels it is published to, such as `premium-analytics`.
 *     @type string   $excerpt    Optional. Plain text, one or two sentences.
 *     @type string   $content    Optional. HTML.
 *     @type array    $media      Optional. `type` (`image` or `video`), `url` and `alt`.
 *     @type string   $link       Optional. URL of the full article.
 *     @type string   $capability Optional. Hides the announcement from users without it.
 * }
 * @return array|false The registered announcement, or false when it is refused.
 */
function register_announcement( $id, $args ) {
	return Announcement_Registry::get_instance()->register( $id, $args );
}
