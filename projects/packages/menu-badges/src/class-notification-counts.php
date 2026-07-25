<?php
/**
 * Central registry of admin-menu notification counts.
 *
 * @package automattic/jetpack-menu-badges
 */

namespace Automattic\Jetpack\Menu_Badges;

/**
 * Passive source of truth for admin-menu notification counts. Products register
 * a count against a menu item; renderers read the aggregate. No rendering here.
 */
class Notification_Counts {

	/**
	 * Registered entries, keyed by id.
	 *
	 * @var array<string,array>
	 */
	private static $entries = array();

	/**
	 * Memoized result of all(), or null when stale. Invalidated on register()/reset().
	 *
	 * @var array<string,array>|null
	 */
	private static $visible_cache = null;

	/**
	 * Register (or overwrite) a notification count for a product.
	 *
	 * @param string $id   Unique id (e.g. 'jetpack-forms').
	 * @param array  $args {
	 *     Notification count entry arguments.
	 *
	 *     @type string|null $menu_slug Submenu item slug to badge; null → top-level only.
	 *     @type int         $count     Magnitude for 'count' entries. Default 0.
	 *     @type string      $type      'count' | 'attention'. Default 'count'.
	 *     @type bool        $is_silent Exclude from totals/display. Default false.
	 * }
	 * @return void
	 */
	public static function register( $id, array $args ) {
		self::$entries[ $id ] = array(
			'menu_slug' => isset( $args['menu_slug'] ) ? (string) $args['menu_slug'] : null,
			'count'     => isset( $args['count'] ) ? (int) $args['count'] : 0,
			'type'      => ( isset( $args['type'] ) && 'attention' === $args['type'] ) ? 'attention' : 'count',
			'is_silent' => ! empty( $args['is_silent'] ),
		);
		self::$visible_cache  = null;
	}

	/**
	 * All non-silent entries, after applying the extension filter.
	 *
	 * @return array<string,array>
	 */
	public static function all() {
		if ( null !== self::$visible_cache ) {
			return self::$visible_cache;
		}

		/**
		 * Filters the registered menu notification counts.
		 *
		 * @since 0.1.0
		 * @param array<string,array> $entries Map of id => entry.
		 */
		$entries = apply_filters( 'jetpack_menu_notification_counts', self::$entries );

		$visible = array();
		foreach ( $entries as $id => $entry ) {
			if ( empty( $entry['is_silent'] ) ) {
				$visible[ $id ] = $entry;
			}
		}

		self::$visible_cache = $visible;
		return $visible;
	}

	/**
	 * The magnitude an entry contributes to a total: its count, or 1 for attention.
	 *
	 * @param array $entry Entry.
	 * @return int
	 */
	private static function magnitude( array $entry ) {
		if ( isset( $entry['type'] ) && 'attention' === $entry['type'] ) {
			return 1;
		}
		return isset( $entry['count'] ) ? (int) $entry['count'] : 0;
	}

	/**
	 * Summed count for a specific submenu item.
	 *
	 * @param string $menu_slug Submenu slug.
	 * @return int
	 */
	public static function get_for_menu( $menu_slug ) {
		$total = 0;
		foreach ( self::all() as $entry ) {
			if ( isset( $entry['menu_slug'] ) && $entry['menu_slug'] === $menu_slug ) {
				$total += self::magnitude( $entry );
			}
		}
		return $total;
	}

	/**
	 * Top-level total across all non-silent entries.
	 *
	 * @return int
	 */
	public static function get_total() {
		$total = 0;
		foreach ( self::all() as $entry ) {
			$total += self::magnitude( $entry );
		}
		return $total;
	}

	/**
	 * Clear all registered entries (test helper).
	 *
	 * @return void
	 */
	public static function reset() {
		self::$entries       = array();
		self::$visible_cache = null;
	}
}
