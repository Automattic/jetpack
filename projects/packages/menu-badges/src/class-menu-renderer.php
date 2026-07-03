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
		$attrs = sprintf(
			'class="menu-counter count-%1$d" data-jp-menu-badge="%2$s" data-jp-menu-count="%1$d"%3$s',
			(int) $count,
			esc_attr( $id ),
			$is_total ? ' data-jp-menu-badge-total="1"' : ''
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
		return trim( (string) preg_replace( '/\s*<span class="menu-counter count-\d+" data-jp-menu-badge=.*$/s', '', (string) $title ) );
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

		// Submenu badges: one per registered menu_slug with a positive count.
		if ( isset( $submenu['jetpack'] ) && is_array( $submenu['jetpack'] ) ) {
			foreach ( $submenu['jetpack'] as $i => $item ) {
				if ( ! isset( $item[2] ) || ! isset( $item[0] ) ) {
					continue;
				}
				$slug  = $item[2];
				$count = Notification_Counts::get_for_menu( $slug );
				$title = self::strip( $item[0] );
				if ( $count > 0 ) {
					$title .= self::badge_markup( $slug, $count );
				}
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$submenu['jetpack'][ $i ][0] = $title;
			}
		}

		// Top-level total on the Jetpack parent (found by capability).
		$total = Notification_Counts::get_total();
		foreach ( $menu as $i => $item ) {
			if ( isset( $item[1] ) && 'jetpack_admin_page' === $item[1] && isset( $item[0] ) ) {
				$title = self::strip( $item[0] );
				if ( $total > 0 ) {
					$title .= self::badge_markup( 'total', $total, true );
				}
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$menu[ $i ][0] = $title;
				break;
			}
		}
	}
}
