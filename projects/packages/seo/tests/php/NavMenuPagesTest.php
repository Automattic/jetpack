<?php
/**
 * Tests for Nav_Menu_Pages.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WP_Block_Patterns_Registry;
use WP_Block_Template;

/**
 * @covers \Automattic\Jetpack\SEO\Nav_Menu_Pages
 */
#[CoversClass( Nav_Menu_Pages::class )]
class NavMenuPagesTest extends SeoTestCase {

	const PATTERN = 'jetpack-seo-test/header';

	/**
	 * Undo the block theme stand-ins.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		remove_all_filters( 'pre_get_block_templates' );
		remove_all_filters( 'pre_get_block_template' );
		remove_theme_support( 'block-template-parts' );
		update_option( 'show_on_front', 'posts' );
		update_option( 'page_on_front', 0 );
		if ( WP_Block_Patterns_Registry::get_instance()->is_registered( self::PATTERN ) ) {
			unregister_block_pattern( self::PATTERN );
		}
		parent::tearDown();
	}

	/**
	 * Classic menus split into main and other by location; unassigned menus don't count.
	 *
	 * @return void
	 */
	public function test_classic_menus_split_by_location() {
		list( $a, $b, $c, $d ) = $this->pages( 4 );
		$this->add_nav_menu( array( $a, $b ), 'primary' );
		$this->add_nav_menu( array( $b, $c ), 'footer' );
		$this->add_nav_menu( array( $d ) );

		$this->assertSame(
			array(
				'main'  => array( $a, $b ),
				'other' => array( $c ),
			),
			Nav_Menu_Pages::get()
		);
	}

	/**
	 * When no location name looks like the main menu, the first one that isn't a footer,
	 * secondary or social menu is main.
	 *
	 * @return void
	 */
	public function test_first_non_footer_location_is_main_when_no_name_matches() {
		list( $a, $b, $c ) = $this->pages( 3 );
		$this->add_nav_menu( array( $a ), 'footer' );
		$this->add_nav_menu( array( $b ), 'topbar' );
		$this->add_nav_menu( array( $c ), 'sidebar' );

		$this->assertSame(
			array(
				'main'  => array( $b ),
				'other' => array( $a, $c ),
			),
			Nav_Menu_Pages::get()
		);
	}

	/**
	 * Location names themes use for the main menu.
	 *
	 * @dataProvider provide_locations
	 *
	 * @param string $location Location slug.
	 * @param bool   $expected Whether it is the main menu.
	 * @return void
	 */
	#[DataProvider( 'provide_locations' )]
	public function test_is_main_location( $location, $expected ) {
		$this->assertSame( $expected, Nav_Menu_Pages::is_main_location( $location ) );
	}

	/**
	 * Location slugs and whether each is the main menu.
	 *
	 * @return array
	 */
	public static function provide_locations() {
		return array(
			'primary'          => array( 'primary', true ),
			'primary-menu'     => array( 'primary-menu', true ),
			'main_menu'        => array( 'main_menu', true ),
			'header-menu'      => array( 'header-menu', true ),
			'menu-1'           => array( 'menu-1', true ),
			'top'              => array( 'top', true ),
			'topbar_menu'      => array( 'topbar_menu', false ),
			'secondary'        => array( 'secondary', false ),
			'footer'           => array( 'footer', false ),
			'social'           => array( 'social', false ),
			'footer-main'      => array( 'footer-main', false ),
			'primary-footer'   => array( 'primary-footer', false ),
			'secondary-header' => array( 'secondary-header', false ),
		);
	}

	/**
	 * In a block theme, header template parts hold the main menu and footer parts the
	 * others; other parts don't count.
	 *
	 * @dataProvider provide_template_parts
	 *
	 * @param array[] $parts    Each `array( slug, area, linked page index )`.
	 * @param int[]   $main     Indexes of the expected main-menu pages.
	 * @param int[]   $other    Indexes of the expected other-menu pages.
	 * @param array   $home     Home page templates, as template slug => part slugs it includes.
	 * @return void
	 */
	#[DataProvider( 'provide_template_parts' )]
	public function test_block_theme_header_is_main_and_footer_is_other( $parts, $main, $other, $home = array() ) {
		$pages = $this->pages( 3 );
		foreach ( $parts as &$part ) {
			$part[2] = $this->navigation_markup( $pages[ $part[2] ] );
		}
		$this->use_template_parts( $parts, $home );

		$pick = static function ( $indexes ) use ( $pages ) {
			return array_map(
				static function ( $index ) use ( $pages ) {
					return $pages[ $index ];
				},
				$indexes
			);
		};
		$this->assertSame(
			array(
				'main'  => $pick( $main ),
				'other' => $pick( $other ),
			),
			Nav_Menu_Pages::get()
		);
	}

	/**
	 * Template parts and the pages each group should get.
	 *
	 * @return array
	 */
	public static function provide_template_parts() {
		return array(
			'found by area or slug'  => array(
				array( array( 'site-header', 'header', 0 ), array( 'footer', 'uncategorized', 1 ), array( 'sidebar', 'uncategorized', 2 ) ),
				array( 0 ),
				array( 1 ),
			),
			'part named header wins' => array(
				array( array( 'header', 'header', 0 ), array( 'header-large-title', 'header', 2 ), array( 'footer', 'footer', 1 ) ),
				array( 0 ),
				array( 1 ),
			),
			'home page part wins'    => array(
				array( array( 'header', 'header', 0 ), array( 'header-large-title', 'header', 2 ), array( 'footer', 'footer', 1 ) ),
				array( 2 ),
				array( 1 ),
				array( 'index' => array( 'header-large-title', 'footer' ) ),
			),
		);
	}

	/**
	 * A static front page with its own `page-{slug}` template uses that template's header.
	 *
	 * @return void
	 */
	public function test_static_front_page_uses_its_own_template() {
		list( $a, $b, $front ) = $this->pages( 3 );
		wp_update_post(
			array(
				'ID'        => $front,
				'post_name' => 'welcome',
			)
		);
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $front );
		$this->use_template_parts(
			array(
				array( 'header', 'header', $this->navigation_markup( $a ) ),
				array( 'header-large-title', 'header', $this->navigation_markup( $b ) ),
			),
			array(
				'page'         => array( 'header' ),
				'page-welcome' => array( 'header-large-title' ),
			)
		);

		$this->assertSame( array( $b ), Nav_Menu_Pages::get()['main'] );
	}

	/**
	 * A header Navigation block finds its links through each way core lets it hold them.
	 *
	 * @dataProvider provide_navigation_blocks
	 *
	 * @param string $markup   Header markup; `{older}`, `{synced}`, `{a}` and `{b}` are replaced with IDs.
	 * @param string $expected Which pages it links: `older`, `newer`, `own` or `none`.
	 * @return void
	 */
	#[DataProvider( 'provide_navigation_blocks' )]
	public function test_navigation_block_links( $markup, $expected ) {
		list( $old_page, $new_page, $a, $b ) = $this->pages( 4 );
		$older                               = $this->navigation_post( array( $old_page ), '2026-01-01 00:00:00' );
		$this->navigation_post( array( $new_page ), '2026-02-01 00:00:00' );
		register_block_pattern(
			self::PATTERN,
			array(
				'title'   => 'Header',
				'content' => sprintf( '<!-- wp:navigation {"ref":%d} /-->', $older ),
			)
		);

		$older_markup = sprintf( '<!-- wp:navigation {"ref":%d} /-->', $older );
		$synced       = wp_insert_post(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => 'Synced header',
				'post_content' => $older_markup,
			)
		);

		$markup = strtr(
			$markup,
			array(
				'{older}'  => $older,
				'{synced}' => $synced,
				'{a}'      => $a,
				'{b}'      => $b,
			)
		);
		$this->use_template_parts(
			array(
				array( 'header', 'header', $markup ),
				array( 'site-nav', 'uncategorized', $older_markup ),
			)
		);

		$pages = array(
			'older' => array( $old_page ),
			'newer' => array( $new_page ),
			'own'   => array( $a, $b ),
			'none'  => array(),
		);
		$this->assertSame( $pages[ $expected ], Nav_Menu_Pages::get()['main'] );
	}

	/**
	 * Header Navigation block markup and the pages it links.
	 *
	 * @return array
	 */
	public static function provide_navigation_blocks() {
		return array(
			'menu reference'            => array( '<!-- wp:navigation {"ref":{older}} /-->', 'older' ),
			'no reference, newest'      => array( '<!-- wp:navigation /-->', 'newer' ),
			'own links, custom skipped' => array(
				'<!-- wp:navigation --><!-- wp:navigation-submenu {"id":{a},"kind":"post-type","type":"page"} --><!-- wp:navigation-link {"id":{b},"kind":"post-type","type":"page"} /--><!-- /wp:navigation-submenu --><!-- wp:navigation-link {"url":"https://example.com","kind":"custom"} /--><!-- /wp:navigation -->',
				'own',
			),
			'inside a pattern'          => array( '<!-- wp:pattern {"slug":"' . self::PATTERN . '"} /-->', 'older' ),
			'inside a synced pattern'   => array( '<!-- wp:block {"ref":{synced}} /-->', 'older' ),
			'inside a nested part'      => array( '<!-- wp:template-part {"slug":"site-nav"} /-->', 'older' ),
			'page list ranks none'      => array( '<!-- wp:navigation --><!-- wp:page-list /--><!-- /wp:navigation -->', 'none' ),
		);
	}

	/**
	 * Insert published pages.
	 *
	 * @param int $count How many.
	 * @return int[] Page IDs.
	 */
	private function pages( $count ) {
		$ids = array();
		for ( $i = 1; $i <= $count; $i++ ) {
			$ids[] = wp_insert_post(
				array(
					'post_type'   => 'page',
					'post_status' => 'publish',
					'post_title'  => 'Page ' . $i,
				)
			);
		}
		return $ids;
	}

	/**
	 * Insert a published `wp_navigation` menu linking pages.
	 *
	 * @param int[]  $page_ids Pages to link.
	 * @param string $date     Publish date.
	 * @return int Menu post ID.
	 */
	private function navigation_post( array $page_ids, $date = '2026-01-01 00:00:00' ) {
		$links = '';
		foreach ( $page_ids as $page_id ) {
			$links .= sprintf( '<!-- wp:navigation-link {"id":%d,"kind":"post-type","type":"page"} /-->', $page_id );
		}
		return wp_insert_post(
			array(
				'post_type'    => 'wp_navigation',
				'post_status'  => 'publish',
				'post_title'   => 'Navigation',
				'post_content' => $links,
				'post_date'    => $date,
			)
		);
	}

	/**
	 * Navigation block markup referencing a new menu that links one page.
	 *
	 * @param int $page_id Page to link.
	 * @return string
	 */
	private function navigation_markup( $page_id ) {
		return sprintf( '<!-- wp:navigation {"ref":%d} /-->', $this->navigation_post( array( $page_id ) ) );
	}

	/**
	 * Serve template parts in place of the theme's, with block template parts supported.
	 *
	 * @param array[] $parts Each `array( slug, area, content )`.
	 * @param array   $home  Page templates to serve, as template slug => part slugs it includes.
	 * @return void
	 */
	private function use_template_parts( array $parts, array $home = array() ) {
		$templates = array();
		foreach ( $parts as list( $slug, $area, $content ) ) {
			$template          = new WP_Block_Template();
			$template->type    = 'wp_template_part';
			$template->slug    = $slug;
			$template->area    = $area;
			$template->content = $content;
			$templates[]       = $template;
		}

		$page_templates = array();
		foreach ( $home as $template_slug => $part_slugs ) {
			$template          = new WP_Block_Template();
			$template->type    = 'wp_template';
			$template->slug    = $template_slug;
			$template->content = '';
			foreach ( $part_slugs as $slug ) {
				$template->content .= sprintf( '<!-- wp:group --><!-- wp:template-part {"slug":"%s"} /--><!-- /wp:group -->', $slug );
			}
			$page_templates[] = $template;
		}

		add_theme_support( 'block-template-parts' );
		add_filter(
			'pre_get_block_templates',
			static function ( $result, $query, $type ) use ( $templates, $page_templates ) {
				if ( 'wp_template_part' === $type ) {
					return $templates;
				}
				$slugs = $query['slug__in'] ?? array();
				return array_values(
					array_filter(
						$page_templates,
						static function ( $template ) use ( $slugs ) {
							return in_array( $template->slug, $slugs, true );
						}
					)
				);
			},
			10,
			3
		);
		add_filter(
			'pre_get_block_template',
			static function ( $result, $id ) use ( $templates ) {
				foreach ( $templates as $template ) {
					if ( substr( $id, -strlen( '//' . $template->slug ) ) === '//' . $template->slug ) {
						return $template;
					}
				}
				return $result;
			},
			10,
			2
		);
	}
}
