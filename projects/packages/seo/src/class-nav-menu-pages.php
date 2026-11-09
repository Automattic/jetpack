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
	 * Location slugs that never hold the main menu, even when they also say `main` or `header`.
	 */
	const NOT_MAIN_PATTERN = '/footer|secondary|social/';

	/**
	 * Core's fallback menu for this lookup: `false` until fetched, then a post or null.
	 *
	 * @var \WP_Post|null|false
	 */
	private static $fallback_menu = false;

	/**
	 * Page IDs from the main menu and from the other displayed menus, each in menu order,
	 * with no page in both lists.
	 *
	 * @return array{main: int[], other: int[]}
	 */
	public static function get() {
		self::$fallback_menu = false;
		$classic             = self::classic_menu_pages();
		$block               = self::block_theme_menu_pages();

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
		if ( preg_match( self::NOT_MAIN_PATTERN, $location ) ) {
			return false;
		}
		return in_array( $location, array( 'menu-1', 'top' ), true )
			|| (bool) preg_match( '/(?:^|[-_])(?:primary|main|header)(?:[-_]|$)/', $location );
	}

	/**
	 * Pages in the menus assigned to the theme's registered locations. When no location
	 * name looks like the main menu, the first assigned one that isn't a footer, secondary
	 * or social menu is used.
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
			$main = array_slice( preg_grep( self::NOT_MAIN_PATTERN, $locations, PREG_GREP_INVERT ), 0, 1 );
		}

		foreach ( $locations as $location ) {
			$group = in_array( $location, $main, true ) ? 'main' : 'other';
			$items = wp_get_nav_menu_items( $assigned[ $location ] );
			foreach ( is_array( $items ) ? $items : array() as $item ) {
				if ( 'post_type' === $item->type && 'page' === $item->object ) {
					$pages[ $group ][] = (int) $item->object_id;
				} elseif ( 'custom' === $item->type ) {
					$id = self::local_page_id( (string) $item->url );
					if ( $id ) {
						$pages[ $group ][] = $id;
					}
				}
			}
		}

		return $pages;
	}

	/**
	 * Pages in the Navigation blocks of a block theme's header (main) and footer (other)
	 * template parts, preferring the parts the home page uses.
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

		$areas = array(
			'header' => array(),
			'footer' => array(),
		);
		foreach ( get_block_templates( array(), 'wp_template_part' ) as $part ) {
			foreach ( array_keys( $areas ) as $area ) {
				if ( $area === $part->area || $area === $part->slug ) {
					$areas[ $area ][ $part->slug ] = $part;
				}
			}
		}

		$home = array_flip( self::home_template_part_slugs() );
		foreach ( array(
			'header' => 'main',
			'footer' => 'other',
		) as $area => $group ) {
			// Prefer the parts the home page includes, then the one named after the area, so
			// unused variants such as `header-large-title` don't count.
			$parts = array_intersect_key( $areas[ $area ], $home );
			if ( empty( $parts ) ) {
				$parts = isset( $areas[ $area ][ $area ] ) ? array( $areas[ $area ][ $area ] ) : $areas[ $area ];
			}
			foreach ( $parts as $part ) {
				$pages[ $group ] = array_merge( $pages[ $group ], self::page_ids_in_blocks( parse_blocks( (string) $part->content ) ) );
			}
		}

		return $pages;
	}

	/**
	 * Slugs of the template parts in the block template the home page uses.
	 *
	 * @return string[]
	 */
	private static function home_template_part_slugs() {
		$hierarchy = array( 'front-page' );
		$front_id  = 'page' === get_option( 'show_on_front' ) ? (int) get_option( 'page_on_front' ) : 0;
		if ( $front_id ) {
			$custom = get_page_template_slug( $front_id );
			if ( $custom ) {
				$hierarchy[] = $custom;
			}
			$hierarchy[] = 'page-' . urldecode( (string) get_post_field( 'post_name', $front_id ) );
			array_push( $hierarchy, 'page-' . $front_id, 'page', 'singular' );
		} else {
			$hierarchy[] = 'home';
		}
		$hierarchy[] = 'index';

		$template = resolve_block_template( 'frontpage', $hierarchy, '' );
		return $template ? self::template_part_slugs( parse_blocks( (string) $template->content ) ) : array();
	}

	/**
	 * Slugs of the template part blocks in a block tree, including those inside patterns
	 * and synced patterns.
	 *
	 * @param array $blocks Parsed blocks.
	 * @param int   $depth  Pattern references followed so far.
	 * @return string[]
	 */
	private static function template_part_slugs( array $blocks, $depth = 0 ) {
		$slugs = array();
		foreach ( $blocks as $block ) {
			$name     = $block['blockName'] ?? '';
			$attrs    = $block['attrs'] ?? array();
			$inner    = $block['innerBlocks'] ?? array();
			$followed = false;

			if ( 'core/template-part' === $name ) {
				if ( ! empty( $attrs['slug'] ) ) {
					$slugs[] = $attrs['slug'];
				}
			} elseif ( $depth < self::MAX_DEPTH ) {
				$content = self::referenced_content( $name, $attrs );
				if ( null !== $content ) {
					$inner    = parse_blocks( $content );
					$followed = true;
				}
			}

			if ( ! empty( $inner ) ) {
				$slugs = array_merge( $slugs, self::template_part_slugs( $inner, $followed ? $depth + 1 : $depth ) );
			}
		}
		return $slugs;
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

			if ( 'core/navigation' === $name && ( ! empty( $attrs['ref'] ) || empty( $inner ) ) && $depth < self::MAX_DEPTH ) {
				// Like core, a menu reference replaces the block's own links, and the block falls back when it
				// has neither or that menu isn't published; a deleted menu shows nothing.
				$menu  = empty( $attrs['ref'] ) ? null : get_post( (int) $attrs['ref'] );
				$inner = array();
				if ( empty( $attrs['ref'] ) || ( $menu instanceof \WP_Post && 'publish' !== $menu->post_status ) ) {
					$menu = self::fallback_navigation();
				}
				if ( $menu instanceof \WP_Post && 'wp_navigation' === $menu->post_type && 'publish' === $menu->post_status ) {
					$inner    = parse_blocks( $menu->post_content );
					$followed = true;
				}
			} elseif ( in_array( $name, array( 'core/navigation-link', 'core/navigation-submenu' ), true ) ) {
				// Only explicit links rank a page; a Page List block shows every page, so it ranks none.
				if ( ! empty( $attrs['id'] ) && 'post-type' === ( $attrs['kind'] ?? '' ) && 'page' === ( $attrs['type'] ?? '' ) ) {
					$ids[] = (int) $attrs['id'];
				} elseif ( 'custom' === ( $attrs['kind'] ?? 'custom' ) && ! empty( $attrs['url'] ) ) {
					$id = self::local_page_id( $attrs['url'] );
					if ( $id ) {
						$ids[] = $id;
					}
				}
			} elseif ( $depth < self::MAX_DEPTH ) {
				$content = self::referenced_content( $name, $attrs );
				if ( null !== $content ) {
					$inner    = parse_blocks( $content );
					$followed = true;
				}
			}

			if ( ! empty( $inner ) ) {
				$ids = array_merge( $ids, self::page_ids_in_blocks( $inner, $followed ? $depth + 1 : $depth ) );
			}
		}
		return $ids;
	}

	/**
	 * Markup a pattern, synced pattern or nested template part block stands in for.
	 *
	 * @param string $name  Block name.
	 * @param array  $attrs Block attributes.
	 * @return string|null Null when the block references nothing.
	 */
	private static function referenced_content( $name, array $attrs ) {
		if ( 'core/pattern' === $name && ! empty( $attrs['slug'] ) ) {
			$pattern = \WP_Block_Patterns_Registry::get_instance()->get_registered( $attrs['slug'] );
			return (string) ( $pattern['content'] ?? '' );
		}
		if ( 'core/block' === $name && ! empty( $attrs['ref'] ) ) {
			$synced = get_post( (int) $attrs['ref'] );
			return $synced instanceof \WP_Post && 'wp_block' === $synced->post_type && 'publish' === $synced->post_status ? $synced->post_content : null;
		}
		if ( 'core/template-part' === $name && ! empty( $attrs['slug'] ) ) {
			$part = get_block_template( ( $attrs['theme'] ?? get_stylesheet() ) . '//' . $attrs['slug'], 'wp_template_part' );
			return $part ? (string) $part->content : null;
		}
		return null;
	}

	/**
	 * The page a custom menu link points to, so a page linked by URL ranks like one picked
	 * from the page list.
	 *
	 * @param string $url Link URL.
	 * @return int Page ID, or 0 for a link to anything else, including other sites.
	 */
	private static function local_page_id( $url ) {
		$id = url_to_postid( $url );
		return $id && 'page' === get_post_type( $id ) ? $id : 0;
	}

	/**
	 * The menu a Navigation block without a published menu falls back to: the newest published
	 * `wp_navigation` post, as in core's `WP_Navigation_Fallback`, without creating one.
	 *
	 * @return \WP_Post|null
	 */
	private static function fallback_navigation() {
		if ( false !== self::$fallback_menu ) {
			return self::$fallback_menu;
		}
		$menus               = get_posts(
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
		self::$fallback_menu = $menus[0] ?? null;
		return self::$fallback_menu;
	}
}
