<?php
/**
 * Renders notification-count badges into the wp-admin $menu/$submenu globals.
 *
 * @package automattic/jetpack-menu-badges
 */

namespace Automattic\Jetpack\Menu_Badges;

/**
 * Reads the Notification_Counts registry and writes the top-level and submenu
 * badges. Sole writer of Jetpack menu badges in wp-admin. Idempotent.
 */
class Menu_Renderer {

	/**
	 * Build a single badge span.
	 *
	 * @param string $id       Owning entry id (or 'total').
	 * @param int    $count    Count to show.
	 * @param bool   $is_total Whether this is the top-level total badge.
	 * @return string
	 */
	public static function badge_markup( $id, $count, $is_total = false ) {
		$count = (int) $count;
		// A zero-count badge still renders (so client live-updates have an element to
		// target) but ships hidden. The inline style trails the data-jp-* attributes so
		// strip()'s idempotency regex still matches; setBadgeCount() clears it to reveal.
		$hidden = $count > 0 ? '' : ' style="display:none"';
		// The top-level Jetpack total badge carries the core `awaiting-mod` and
		// `update-plugins` classes so it picks up WordPress's standard menu-bubble styling;
		// submenu badges use only our own `menu-counter` hook. `menu-counter` is always
		// present for CSS/JS targeting.
		$classes = $is_total ? 'awaiting-mod update-plugins menu-counter' : 'menu-counter';
		$attrs   = sprintf(
			'class="%1$s count-%2$d" data-jp-menu-badge="%3$s" data-jp-menu-count="%2$d"%4$s%5$s',
			$classes,
			$count,
			esc_attr( $id ),
			$is_total ? ' data-jp-menu-badge-total="1"' : '',
			$hidden
		);
		return sprintf(
			' <span %1$s><span class="count">%2$s</span></span>',
			$attrs,
			number_format_i18n( $count )
		);
	}

	/**
	 * Strip any badge this renderer previously wrote from a menu title (idempotency).
	 *
	 * @param string $title Menu title.
	 * @return string
	 */
	private static function strip( $title ) {
		return trim( (string) preg_replace( '/\s*<span class="[^"]*menu-counter count-\d+" data-jp-menu-badge=.*$/s', '', (string) $title ) );
	}

	/**
	 * Render badges into the current $menu/$submenu globals.
	 *
	 * @return void
	 */
	public static function render() {
		global $menu, $submenu;

		if ( ! is_array( $menu ) ) {
			return;
		}

		$entries = Notification_Counts::all();

		// Submenu badges: one per registered menu_slug. A registered slug always gets a
		// badge span — even at count 0 — so a later client live-update (0 -> positive)
		// has an element to reveal. badge_markup() ships the zero case hidden.
		if ( isset( $submenu['jetpack'] ) && is_array( $submenu['jetpack'] ) ) {
			foreach ( $submenu['jetpack'] as $i => $item ) {
				if ( ! isset( $item[2] ) || ! isset( $item[0] ) ) {
					continue;
				}
				$slug  = $item[2];
				$title = self::strip( $item[0] );
				if ( self::has_registered_slug( $entries, $slug ) ) {
					$title .= self::badge_markup( $slug, Notification_Counts::get_for_menu( $slug ) );
				}
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$submenu['jetpack'][ $i ][0] = $title;
			}
		}

		// Nothing registered: leave the Jetpack parent untouched (no badge to write or strip).
		if ( empty( $entries ) ) {
			return;
		}

		// Top-level total on the Jetpack parent. Rendered even at 0 (hidden) so a live
		// update can reveal it without a reload.
		$parent_index = self::find_parent_index( $menu );
		if ( null === $parent_index ) {
			return;
		}
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$menu[ $parent_index ][0] = self::strip( $menu[ $parent_index ][0] ) . self::badge_markup( 'total', Notification_Counts::get_total(), true );
	}

	/**
	 * Whether any registered entry badges the given submenu slug.
	 *
	 * @param array<string,array> $entries Registry entries (from Notification_Counts::all()).
	 * @param string              $slug    Submenu slug.
	 * @return bool
	 */
	private static function has_registered_slug( array $entries, $slug ) {
		foreach ( $entries as $entry ) {
			if ( isset( $entry['menu_slug'] ) && $entry['menu_slug'] === $slug ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Locate the Jetpack top-level menu row to carry the total badge.
	 *
	 * Prefers the row whose slug (item[2]) is 'jetpack' — portable across self-hosted,
	 * Atomic, and WP.com Simple, where jetpack-mu-wpcom builds the parent with a different
	 * capability. Falls back to the plugin's 'jetpack_admin_page' capability (item[1]).
	 *
	 * @param array $menu The wp-admin $menu global.
	 * @return int|string|null Matching key, or null when no Jetpack parent is present.
	 */
	private static function find_parent_index( array $menu ) {
		foreach ( $menu as $i => $item ) {
			if ( isset( $item[0] ) && isset( $item[2] ) && 'jetpack' === $item[2] ) {
				return $i;
			}
		}
		foreach ( $menu as $i => $item ) {
			if ( isset( $item[0] ) && isset( $item[1] ) && 'jetpack_admin_page' === $item[1] ) {
				return $i;
			}
		}
		return null;
	}
}
