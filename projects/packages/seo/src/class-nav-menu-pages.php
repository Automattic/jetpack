<?php
/**
 * Pages a site links from its navigation menus.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Finds the pages linked from the site's main menu and from its other displayed menus,
 * for both classic menu locations and block theme Navigation blocks.
 */
class Nav_Menu_Pages {

	/**
	 * How many pattern or menu references to follow in a row, so one that includes itself
	 * can't recurse forever.
	 */
	const MAX_DEPTH = 5;

	/**
	 * Page IDs from the main menu and from the other displayed menus, each in menu order,
	 * with no page in both lists.
	 *
	 * @return array{main: int[], other: int[]}
	 */
	public static function get() {
		$classic = self::classic_menu_pages();
		$block   = self::block_theme_menu_pages();

		$main  = array_values( array_unique( array_merge( $classic['main'], $block['main'] ) ) );
		$other = array_values( array_diff( array_unique( array_merge( $classic['other'], $block['other'] ) ), $main ) );

		return array(
			'main'  => $main,
			'other' => $other,
		);
	}

	/**
	 * Whether a classic menu location holds the main menu by theme convention, e.g.
	 * `primary`, `primary-menu`, `main_menu`, `header` or `menu-1`.
	 *
	 * @param string $location Menu location slug.
	 * @return bool
	 */
	public static function is_main_location( $location ) {
		return in_array( $location, array( 'menu-1', 'top' ), true )
			|| (bool) preg_match( '/(?:^|[-_])(?:primary|main|header)(?:[-_]|$)/', $location );
	}

	/**
	 * Pages in the menus assigned to the theme's registered locations. When no location
	 * name looks like the main menu, the first registered location with a menu is used.
	 *
	 * @return array{main: int[], other: int[]}
	 */
	private static function classic_menu_pages() {
		$pages     = array(
			'main'  => array(),
			'other' => array(),
		);
		$assigned  = array_filter( (array) get_nav_menu_locations() );
		$locations = array_intersect( array_keys( get_registered_nav_menus() ), array_keys( $assigned ) );
		if ( empty( $locations ) ) {
			return $pages;
		}

		$main = array_filter( $locations, array( __CLASS__, 'is_main_location' ) );
		if ( empty( $main ) ) {
			$main = array( reset( $locations ) );
		}

		foreach ( $locations as $location ) {
			$group = in_array( $location, $main, true ) ? 'main' : 'other';
			$items = wp_get_nav_menu_items( $assigned[ $location ] );
			foreach ( is_array( $items ) ? $items : array() as $item ) {
				if ( 'post_type' === $item->type && 'page' === $item->object ) {
					$pages[ $group ][] = (int) $item->object_id;
				}
			}
		}

		return $pages;
	}

	/**
	 * Pages in the Navigation blocks of a block theme's header (main) and footer (other)
	 * template parts.
	 *
	 * @return array{main: int[], other: int[]}
	 */
	private static function block_theme_menu_pages() {
		$pages = array(
			'main'  => array(),
			'other' => array(),
		);
		if ( ! wp_is_block_theme() && ! current_theme_supports( 'block-template-parts' ) ) {
			return $pages;
		}

		foreach ( get_block_templates( array(), 'wp_template_part' ) as $part ) {
			if ( 'header' === $part->area || 'header' === $part->slug ) {
				$group = 'main';
			} elseif ( 'footer' === $part->area || 'footer' === $part->slug ) {
				$group = 'other';
			} else {
				continue;
			}
			$pages[ $group ] = array_merge( $pages[ $group ], self::page_ids_in_blocks( parse_blocks( (string) $part->content ) ) );
		}

		return $pages;
	}

	/**
	 * Page IDs linked from the Navigation blocks in a block tree, in order.
	 *
	 * @param array $blocks Parsed blocks.
	 * @param int   $depth  Pattern or menu references followed so far.
	 * @return int[]
	 */
	private static function page_ids_in_blocks( array $blocks, $depth = 0 ) {
		$ids = array();
		foreach ( $blocks as $block ) {
			$name     = $block['blockName'] ?? '';
			$attrs    = $block['attrs'] ?? array();
			$inner    = $block['innerBlocks'] ?? array();
			$followed = false;

			if ( 'core/navigation' === $name && empty( $inner ) && $depth < self::MAX_DEPTH ) {
				// Without its own links, the block shows the menu it references, or core's fallback.
				$menu = ! empty( $attrs['ref'] ) ? get_post( (int) $attrs['ref'] ) : self::fallback_navigation();
				if ( $menu instanceof \WP_Post && 'wp_navigation' === $menu->post_type && 'publish' === $menu->post_status ) {
					$inner    = parse_blocks( $menu->post_content );
					$followed = true;
				}
			} elseif ( in_array( $name, array( 'core/navigation-link', 'core/navigation-submenu' ), true ) ) {
				if ( ! empty( $attrs['id'] ) && 'post-type' === ( $attrs['kind'] ?? '' ) && 'page' === ( $attrs['type'] ?? '' ) ) {
					$ids[] = (int) $attrs['id'];
				}
			} elseif ( 'core/pattern' === $name && ! empty( $attrs['slug'] ) && $depth < self::MAX_DEPTH ) {
				$pattern  = \WP_Block_Patterns_Registry::get_instance()->get_registered( $attrs['slug'] );
				$inner    = parse_blocks( (string) ( $pattern['content'] ?? '' ) );
				$followed = true;
			}

			if ( ! empty( $inner ) ) {
				$ids = array_merge( $ids, self::page_ids_in_blocks( $inner, $followed ? $depth + 1 : $depth ) );
			}
		}
		return $ids;
	}

	/**
	 * The menu a Navigation block without a reference falls back to: the newest published
	 * `wp_navigation` post, as in core's `WP_Navigation_Fallback`, without creating one.
	 *
	 * @return \WP_Post|null
	 */
	private static function fallback_navigation() {
		$menus = get_posts(
			array(
				'post_type'        => 'wp_navigation',
				'post_status'      => 'publish',
				'posts_per_page'   => 1,
				'orderby'          => 'date',
				'order'            => 'DESC',
				'no_found_rows'    => true,
				'suppress_filters' => false,
			)
		);
		return $menus[0] ?? null;
	}
}
