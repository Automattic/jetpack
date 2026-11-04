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
		remove_theme_support( 'block-template-parts' );
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
	 * When no location name looks like the main menu, the first registered one is main.
	 *
	 * @return void
	 */
	public function test_first_location_is_main_when_no_name_matches() {
		list( $a, $b ) = $this->pages( 2 );
		$this->add_nav_menu( array( $a ), 'topbar' );
		$this->add_nav_menu( array( $b ), 'sidebar' );

		$this->assertSame(
			array(
				'main'  => array( $a ),
				'other' => array( $b ),
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
			'primary'      => array( 'primary', true ),
			'primary-menu' => array( 'primary-menu', true ),
			'main_menu'    => array( 'main_menu', true ),
			'header-menu'  => array( 'header-menu', true ),
			'menu-1'       => array( 'menu-1', true ),
			'top'          => array( 'top', true ),
			'topbar_menu'  => array( 'topbar_menu', false ),
			'secondary'    => array( 'secondary', false ),
			'footer'       => array( 'footer', false ),
			'social'       => array( 'social', false ),
		);
	}

	/**
	 * In a block theme, header template parts hold the main menu and footer parts the
	 * others; other parts don't count.
	 *
	 * @return void
	 */
	public function test_block_theme_header_is_main_and_footer_is_other() {
		list( $a, $b, $c ) = $this->pages( 3 );
		$this->use_template_parts(
			array(
				array( 'site-header', 'header', $this->navigation_markup( $a ) ),
				array( 'footer', 'uncategorized', $this->navigation_markup( $b ) ),
				array( 'sidebar', 'uncategorized', $this->navigation_markup( $c ) ),
			)
		);

		$this->assertSame(
			array(
				'main'  => array( $a ),
				'other' => array( $b ),
			),
			Nav_Menu_Pages::get()
		);
	}

	/**
	 * A header Navigation block finds its links through each way core lets it hold them.
	 *
	 * @dataProvider provide_navigation_blocks
	 *
	 * @param string $markup   Header markup; `{older}`, `{a}` and `{b}` are replaced with IDs.
	 * @param string $expected Which pages it links: `older`, `newer` or `own`.
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

		$markup = strtr(
			$markup,
			array(
				'{older}' => $older,
				'{a}'     => $a,
				'{b}'     => $b,
			)
		);
		$this->use_template_parts( array( array( 'header', 'header', $markup ) ) );

		$pages = array(
			'older' => array( $old_page ),
			'newer' => array( $new_page ),
			'own'   => array( $a, $b ),
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
	 * @return void
	 */
	private function use_template_parts( array $parts ) {
		$templates = array();
		foreach ( $parts as list( $slug, $area, $content ) ) {
			$template          = new WP_Block_Template();
			$template->type    = 'wp_template_part';
			$template->slug    = $slug;
			$template->area    = $area;
			$template->content = $content;
			$templates[]       = $template;
		}

		add_theme_support( 'block-template-parts' );
		add_filter(
			'pre_get_block_templates',
			static function ( $result, $query, $type ) use ( $templates ) {
				return 'wp_template_part' === $type ? $templates : $result;
			},
			10,
			3
		);
	}
}
