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
 *     @type string[] $channels   The channels it is published to, such as `premium-analytics` or `premium-analytics/main`.
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

/**
 * Reads a feed and returns its items as announcements, for a registrant to register.
 *
 * Read with `fetch_feed()`, which keeps a feed for 12 hours. A feed that fails is left alone for an hour.
 * Nothing is registered: which items to publish, and to which channels, is the registrant's choice.
 *
 * @since $$next-version$$
 *
 * @param string $url    URL of the feed, RSS or Atom.
 * @param string $vendor First half of the id of each announcement, such as `my-plugin`.
 * @param array  $args   {
 *     Optional. Settings of the read.
 *
 *     @type int      $max_age How old an item may be, in seconds. Older ones are left out. Default no limit.
 *     @type string[] $query   Arguments to ask the feed with, by name, added to its URL. Default none.
 * }
 * @return array[] {
 *     One entry per item that has a title, a date and a link. Empty when the feed fails.
 *
 *     @type string   $id         `vendor/hash`. The same for an item on every read.
 *     @type array    $args       `date`, `title`, `excerpt`, `link` and `media`, for `register_announcement()`. Never HTML.
 *     @type string[] $categories The labels the feed gives the item, categories and tags alike.
 * }
 */
function get_announcements_from_feed( $url, $vendor, $args = array() ) {
	return Feed_Announcements::get( $url, $vendor, $args );
}
