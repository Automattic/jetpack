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
 * @since 0.1.0
 *
 * @param string $id   Namespaced id, `vendor/slug`.
 * @param array  $args {
 *     The announcement. Every value is sanitized.
 *
 *     @type string   $date       When it was published. Parsed as GMT unless it carries an offset.
 *     @type string   $title      Plain text.
 *     @type string[] $channels   The channels it is published to, such as `my-plugin` or `my-plugin/settings`.
 *     @type string   $excerpt    Optional. Plain text, one or two sentences.
 *     @type string   $content    Optional. HTML, as a post allows it, without styles, classes or ids.
 *     @type array    $media      Optional. `type` (`image` or `video`), `url` (http or https) and `alt`.
 *     @type string   $link       Optional. URL of the full article, http or https.
 *     @type string   $capability Optional. Hides the announcement from users without it.
 * }
 * @return array|false The registered announcement, or false when it is refused.
 */
function register_announcement( $id, $args ) {
	return Announcement_Registry::get_instance()->register( $id, $args );
}
