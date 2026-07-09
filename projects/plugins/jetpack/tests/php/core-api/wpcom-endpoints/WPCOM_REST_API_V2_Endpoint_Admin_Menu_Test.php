<?php
/**
 * Tests for /wpcom/v2/admin-menu endpoint.
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Depends;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Admin_Menu_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Admin_Menu
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Admin_Menu::class )]
class WPCOM_REST_API_V2_Endpoint_Admin_Menu_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id = $factory->user->create( array( 'role' => 'editor' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		parent::set_up();

		wp_set_current_user( static::$user_id );
		add_action( 'admin_menu', array( $this, 'add_orphan_submenu' ) );
	}

	/**
	 * Tests the schema response for OPTIONS requests.
	 */
	public function test_schema_request() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::OPTIONS, '/wpcom/v2/admin-menu' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$schema = ( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->get_public_item_schema();

		$this->assertEquals( $schema, $data['schema'] );
		$this->assertEquals( 'wpcom/v2', $data['namespace'] );
		$this->assertEquals( array( Requests::GET ), $data['methods'] );
	}

	/**
	 * Tests the permission check.
	 */
	public function test_get_item_permissions_check() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/admin-menu' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
	}

	/**
	 * Basically just a data provider to other tests that rely on a successful response.
	 *
	 * Since the API endpoint relies on file inclusion to create its response,
	 * it can't be run multiple times within the same "request". This test
	 * makes that request once and then passes it on so other tests can depend
	 * on it.
	 *
	 * @return WP_REST_Response
	 */
	public function test_successful_request() {
		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/admin-menu' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		return $response;
	}

	/**
	 * Tests get item.
	 *
	 * @depends test_successful_request
	 *
	 * @param WP_REST_Response $response Admin Menu API response.
	 */
	#[Depends( 'test_successful_request' )]
	public function test_get_item( WP_REST_Response $response ) {
		$this->assertTrue(
			rest_validate_value_from_schema(
				$response->get_data(),
				( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->get_public_item_schema()
			)
		);
	}

	/**
	 * Tests that submenu items get promoted when the user doesn't have the caps for the top-level menu item.
	 *
	 * @depends test_successful_request
	 *
	 * @param WP_REST_Response $response Admin Menu API response.
	 */
	#[Depends( 'test_successful_request' )]
	public function test_parent_menu_item_always_exists( WP_REST_Response $response ) {
		$menu      = wp_list_filter( $response->get_data(), array( 'title' => 'Settings' ) );
		$menu_item = array_pop( $menu );

		$this->assertNotEmpty( $menu_item );
		$this->assertSame( $menu_item['children'][0]['url'], $menu_item['url'], 'Parent and submenu should be the same.' );
	}

	/**
	 * Adds an orphan submenu.
	 *
	 * The user role for these tests is `Editor`, who don't have access to the Settings menu.
	 * Unless it contains a menu item they do have access to.
	 */
	public function add_orphan_submenu() {
		add_submenu_page( 'options-general.php', 'Title', 'Test Title', 'read', 'menu_slug' );
	}

	/**
	 * Tests preparing a menu item.
	 *
	 * @param array $menu_item Menu item as generated in wp-admin/menu.php.
	 * @param array $expected  Menu item object ready for API response.
	 *
	 * @throws \ReflectionException Noop.
	 * @dataProvider menu_item_data
	 */
	#[DataProvider( 'menu_item_data' )]
	public function test_prepare_menu_item( array $menu_item, array $expected ) {
		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_menu_item = $class->getMethod( 'prepare_menu_item' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prepare_menu_item->setAccessible( true );
		}

		$this->assertEquals(
			$expected,
			$prepare_menu_item->invokeArgs( new WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $menu_item ) )
		);
	}

	/**
	 * Data provider for test_prepare_menu_item.
	 *
	 * @return string[][][]
	 */
	public static function menu_item_data() {
		return array(
			// User doesn't have necessary permissions.
			array(
				array( '', 'manage_options', 'separator1', '', 'wp-menu-separator' ),
				array(),
			),
			// Separator item.
			array(
				array( '', 'read', 'separator1', '', 'wp-menu-separator' ),
				array(
					'type' => 'separator',
				),
			),
			// Regular menu item.
			array(
				array( 'Media\'s', 'upload_files', 'upload.php', '', 'menu-top menu-icon-media', 'menu-media', 'dashicons-admin-media' ),
				array(
					'type'  => 'menu-item',
					'icon'  => 'dashicons-admin-media',
					'slug'  => 'upload-php',
					'title' => 'Media\'s',
					'url'   => admin_url( 'upload.php' ),
				),
			),
			// Menu item with update count.
			array(
				array( 'Plugin\'s <span class="update-plugins count-5"><span class="plugin-count">5</span></span>', 'moderate_comments', 'plugins.php', '', 'menu-top menu-icon-plugins', 'menu-plugins', 'dashicons-admin-plugins' ),
				array(
					'type'  => 'menu-item',
					'icon'  => 'dashicons-admin-plugins',
					'slug'  => 'plugins-php',
					'title' => 'Plugin\'s',
					'url'   => admin_url( 'plugins.php' ),
					'count' => 5,
				),
			),
			// Hidden menu item.
			array(
				array( 'Hidden', 'read', 'hidden', '', 'hide-if-js' ),
				array(),
			),
		);
	}

	/**
	 * Tests how prepare_menu_for_response processes empty submenu items.
	 */
	public function test_prepare_menu_for_response_should_ignore_non_array_submenu_items() {
		global $submenu;
		$old_submenu_value = $submenu;
		$menu_item         = array( 'menu_title', 'read', 'index.php', '', '', '', '' );
		$submenu_items     = array();
		for ( $i = 0; $i < 5; $i++ ) {
			$submenu_items[] = array( "submenu_title_$i", 'read', "submenu$i.php", '', '', '', '' );
		}
		$submenu_items[1] = null;
		$submenu_items[4] = null;

		$submenu = array( 'index.php' => $submenu_items );
		$menu    = ( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->prepare_menu_for_response( array( $menu_item ) );
		$submenu = $old_submenu_value;

		$this->assertIsArray( $menu, 'The returned menu should be an array.' );
		$this->assertArrayHasKey( 'children', $menu[0], 'The first menu item should contain a "children" key.' );
		$this->assertIsArray( $menu[0]['children'], 'The "children" key should hold an array.' );
		$this->assertCount( 3, $menu[0]['children'], 'The "children" array should contain exactly 3 items.' );
	}

	/**
	 * Tests preparing a submenu item.
	 *
	 * @param array $submenu_item Submenu item as generated in wp-admin/menu.php.
	 * @param array $menu_item    Menu item as generated in wp-admin/menu.php.
	 * @param array $expected     Menu item object ready for API response.
	 *
	 * @throws \ReflectionException Noop.
	 * @dataProvider submenu_item_data
	 */
	#[DataProvider( 'submenu_item_data' )]
	public function test_prepare_submenu_item( array $submenu_item, array $menu_item, array $expected ) {
		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_submenu_item = $class->getMethod( 'prepare_submenu_item' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prepare_submenu_item->setAccessible( true );
		}

		$this->assertSame(
			$expected,
			$prepare_submenu_item->invokeArgs( new WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $submenu_item, $menu_item ) )
		);
	}

	/**
	 * Data provider for test_prepare_submenu_item.
	 *
	 * @return string[][][]
	 */
	public static function submenu_item_data() {
		$plugin_slug = defined( 'IS_WPCOM' ) && IS_WPCOM ? 'akismet/akismet.png' : 'jetpack/jetpack.php';

		return array(
			// User doesn't have necessary permissions.
			array(
				array( 'Library', 'manage_options', 'upload.php' ),
				array( 'Media', 'upload_files', 'upload.php', '', 'menu-top menu-icon-media', 'menu-media', 'dashicons-admin-media' ),

				array(),
			),
			// Regular submenu item.
			array(
				array( 'Library\'s', 'upload_files', 'upload.php' ),
				array( 'Media', 'upload_files', 'upload.php', '', 'menu-top menu-icon-media', 'menu-media', 'dashicons-admin-media' ),
				array(
					'parent' => 'upload-php',
					'slug'   => 'upload-php',
					'title'  => 'Library\'s',
					'type'   => 'submenu-item',
					'url'    => admin_url( 'upload.php' ),
				),
			),
			// Submenu item with update count.
			array(
				array( 'Library <span class="update-plugins count-15"><span class="update-count">15</span></span>', 'upload_files', 'upload.php' ),
				array( 'Media', 'upload_files', 'upload.php', '', 'menu-top menu-icon-media', 'menu-media', 'dashicons-admin-media' ),
				array(
					'parent' => 'upload-php',
					'slug'   => 'upload-php',
					'title'  => 'Library',
					'type'   => 'submenu-item',
					'url'    => admin_url( 'upload.php' ),
					'count'  => 15,
				),
			),
			// Hidden submenu item.
			array(
				array( 'Hidden', 'read', 'hidden', 'Hidden', 'hide-if-js' ),
				array( 'My Plugin', 'read', 'my-plugin', 'My Plugin', '', '', '' ),
				array(),
			),
			array(
				array(
					0 => 'MYML',
					1 => 'read',
					2 => $plugin_slug,
					3 => 'MYML',
					4 => 'menu-top toplevel_page_my-multilingual-cms/menu/languages',
					5 => 'toplevel_page_my-multilingual-cms/menu/languages',
					6 => 'https://example.org/wp-content/plugins/my-multilingual-cms/icon16.png',
				),
				array(
					0 => 'Troubleshooting',
					1 => 'read',
					2 => $plugin_slug,
					3 => 'Troubleshooting',
				),
				array(
					'parent' => sanitize_title_with_dashes( $plugin_slug ),
					'slug'   => sanitize_title_with_dashes( $plugin_slug ),
					'title'  => 'MYML',
					'type'   => 'submenu-item',
					'url'    => admin_url( 'admin.php?page=' . $plugin_slug ),
				),
			),
		);
	}

	/**
	 * Tests that the central menu-badges registry's authoritative count
	 * overlays the submenu item's `count`, so Calypso/Simple sidebars get
	 * registry-backed counts without relying on title-markup scraping.
	 */
	public function test_prepare_submenu_item_overlays_registry_count() {
		if ( ! class_exists( '\Automattic\Jetpack\Menu_Badges\Notification_Counts' ) ) {
			$this->markTestSkipped( 'menu-badges package not loaded' );
		}
		\Automattic\Jetpack\Menu_Badges\Notification_Counts::reset();
		\Automattic\Jetpack\Menu_Badges\Notification_Counts::register(
			'jetpack-forms',
			array(
				'menu_slug' => 'jetpack-forms-responses-wp-admin',
				'count'     => 15,
			)
		);

		$class  = new \ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );
		$method = $class->getMethod( 'prepare_submenu_item' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$submenu_item = array( 'Forms', 'edit_pages', 'jetpack-forms-responses-wp-admin', 'Forms', '' );
		$menu_item    = array( 'Jetpack', 'jetpack_admin_page', 'jetpack', 'Jetpack', 'menu-top' );

		$result = $method->invokeArgs( new \WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $submenu_item, $menu_item ) );

		$this->assertSame( 15, $result['count'] );
		\Automattic\Jetpack\Menu_Badges\Notification_Counts::reset();
	}

	/**
	 * Mirrors test_prepare_submenu_item_overlays_registry_count() but for the
	 * top-level branch: the central menu-badges registry's authoritative grand
	 * total overlays the top-level "Jetpack" menu item's `count`, so the total
	 * reflects every registered menu_slug (e.g. both jetpack-forms and
	 * my-jetpack contributions), not just one submenu's contribution.
	 */
	public function test_prepare_menu_item_overlays_registry_total() {
		if ( ! class_exists( '\Automattic\Jetpack\Menu_Badges\Notification_Counts' ) ) {
			$this->markTestSkipped( 'menu-badges package not loaded' );
		}

		global $submenu;
		$old_submenu        = $submenu;
		$submenu['jetpack'] = array();

		\Automattic\Jetpack\Menu_Badges\Notification_Counts::reset();
		\Automattic\Jetpack\Menu_Badges\Notification_Counts::register(
			'jetpack-forms',
			array(
				'menu_slug' => 'jetpack-forms-responses-wp-admin',
				'count'     => 15,
			)
		);
		\Automattic\Jetpack\Menu_Badges\Notification_Counts::register(
			'my-jetpack-protect_has_threats',
			array(
				'menu_slug' => 'my-jetpack',
				'type'      => 'attention',
			)
		);

		$class  = new \ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );
		$method = $class->getMethod( 'prepare_menu_item' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$menu_item = array( 'Jetpack', 'read', 'jetpack', 'Jetpack', 'menu-top', 'toplevel_page_jetpack', 'dashicons-admin-generic' );

		$result = $method->invokeArgs( new \WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $menu_item ) );

		$submenu = $old_submenu;

		$this->assertSame( \Automattic\Jetpack\Menu_Badges\Notification_Counts::get_total(), $result['count'] );
		\Automattic\Jetpack\Menu_Badges\Notification_Counts::reset();
	}

	/**
	 * Check if the menu URL is properly generated from the first submenu slug.
	 */
	public function test_if_the_first_submenu_url_is_used_for_menu_url() {
		global $menu;

		add_menu_page( '', 'Foo', 'read', 'foo' );
		$fnc = function () { }; /// needed for the slug to register as a page.
		add_submenu_page( 'foo', 'title', 'title', 'read', 'sharing', $fnc, 0 );

		$foo_item = array();

		foreach ( $menu as $menu_item ) {
			if ( 'foo' === $menu_item[2] ) {
				$foo_item = $menu_item;
				break;
			}
		}

		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_menu_item = $class->getMethod( 'prepare_menu_item' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prepare_menu_item->setAccessible( true );
		}

		$expected = array(
			'icon'  => 'dashicons-admin-generic',
			'slug'  => 'foo',
			'title' => 'Foo',
			'type'  => 'menu-item',
			'url'   => admin_url( 'admin.php?page=sharing' ),
		);

		$this->assertSame(
			$expected,
			$prepare_menu_item->invokeArgs( new WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $foo_item ) )
		);
	}

	/**
	 * Tests preparing a menu item icon.
	 *
	 * @param string $icon     Menu item icon as generated in wp-admin/menu.php.
	 * @param string $expected Menu item icon ready for API response.
	 *
	 * @throws \ReflectionException Noop.
	 * @dataProvider menu_item_icon_data
	 */
	#[DataProvider( 'menu_item_icon_data' )]
	public function test_prepare_menu_item_icon( $icon, $expected ) {
		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_menu_item_icon = $class->getMethod( 'prepare_menu_item_icon' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prepare_menu_item_icon->setAccessible( true );
		}

		$this->assertEquals(
			$expected,
			$prepare_menu_item_icon->invokeArgs( new WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $icon ) )
		);
	}

	/**
	 * Data provider for test_prepare_submenu_item.
	 *
	 * @return string[][]
	 */
	public static function menu_item_icon_data() {
		return array(
			// Empty icon.
			array(
				'',
				'dashicons-admin-generic',
			),
			// Div.
			array(
				'div',
				'dashicons-admin-generic',
			),
			// None.
			array(
				'none',
				'dashicons-admin-generic',
			),
			// Icon URL.
			array(
				'http://example.org/files/jetpack.jpg',
				'http://example.org/files/jetpack.jpg',
			),
			// Dashicon.
			array(
				'dashicons-admin-media',
				'dashicons-admin-media',
			),
			'When the dashicon does not exist in the core dashicon list, we expect the default dashicon.' => array(
				'dashicons-admin-nope',
				'dashicons-admin-generic',
			),
			// SVG.
			array(
				'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMTMgNy41aDV2MmgtNXptMCA3aDV2MmgtNXpNMTkgM0g1Yy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDE0YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6bTAgMTZINVY1aDE0djE0ek0xMSA2SDZ2NWg1VjZ6bS0xIDRIN1Y3aDN2M3ptMSAzSDZ2NWg1di01em0tMSA0SDd2LTNoM3YzeiIvPjwvc3ZnPg==',
				'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMTMgNy41aDV2MmgtNXptMCA3aDV2MmgtNXpNMTkgM0g1Yy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDE0YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6bTAgMTZINVY1aDE0djE0ek0xMSA2SDZ2NWg1VjZ6bS0xIDRIN1Y3aDN2M3ptMSAzSDZ2NWg1di01em0tMSA0SDd2LTNoM3YzeiIvPjwvc3ZnPg==',
			),
		);
	}

	/**
	 * Tests preparing a menu item url.
	 *
	 * @param string $url         Menu item url as generated in wp-admin/menu.php.
	 * @param string $parent_slug Menu parent slug as generated in wp-admin/menu.php.
	 * @param string $callback    Menu callback as generated in wp-admin/menu.php.
	 * @param string $expected    Menu item url ready for API response.
	 *
	 * @throws \ReflectionException Noop.
	 * @dataProvider menu_item_url_data
	 */
	#[DataProvider( 'menu_item_url_data' )]
	public function test_prepare_menu_item_url( $url, $parent_slug, $callback, $expected ) {
		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_menu_item_url = $class->getMethod( 'prepare_menu_item_url' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prepare_menu_item_url->setAccessible( true );
		}

		if ( empty( $parent_slug ) ) {
			add_menu_page( 'Title', 'Title', 'read', $url, $callback );
		} else {
			add_submenu_page( $parent_slug, 'Title', 'Title', 'read', $url, $callback );
		}

		$this->assertEquals(
			$expected,
			$prepare_menu_item_url->invokeArgs( new WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $url, $parent_slug ) )
		);

		if ( empty( $parent_slug ) ) {
			remove_menu_page( $url );
		} else {
			remove_submenu_page( $parent_slug, $url );
		}
	}

	/**
	 * Data provider for test_prepare_menu_item_url.
	 *
	 * @return string[][]
	 */
	public static function menu_item_url_data() {
		$plugin_slug = defined( 'IS_WPCOM' ) && IS_WPCOM ? 'akismet/akismet.png' : 'jetpack/jetpack.php';

		return array(
			// Calypso URL.
			array(
				'https://wordpress.com/me',
				'',
				null,
				'/me',
			),
			// Core menu item URL.
			array(
				'upload.php',
				'',
				null,
				admin_url( 'upload.php' ),
			),
			// Submenu item URL.
			array(
				'custom_settings',
				'upload.php',
				'__return_true',
				admin_url( 'upload.php?page=custom_settings' ),
			),
			// Plugin menu item URL.
			array(
				'custom_settings',
				'',
				'__return_true',
				admin_url( 'admin.php?page=custom_settings' ),
			),
			// Plugin menu item URL without a parent.
			array(
				'custom_settings',
				'admin.php',
				'__return_true',
				admin_url( 'admin.php?page=custom_settings' ),
			),
			// Jetpack.
			array(
				'https://jetpack.com/redirect/?source=calypso-backups&#038;site=example.org',
				'jetpack',
				null,
				'https://jetpack.com/redirect/?source=calypso-backups&site=example.org',
			),
			// WooCommerce URLs.
			array(
				'product_attributes',
				'edit.php?post_type=product',
				'__return_true',
				admin_url( 'edit.php?post_type=product&page=product_attributes' ),
			),
			array(
				'wc-admin&amp;path=/analytics/products',
				'wc-admin&amp;path=/analytics/overview',
				'__return_true',
				admin_url( 'admin.php?page=wc-admin&path=/analytics/products' ),
			),
			array(
				'wc-admin&amp;path=customers',
				'woocommerce',
				'__return_true',
				admin_url( 'admin.php?page=wc-admin&path=customers' ),
			),
			// Treat URLs pointing back to the site as internal URLs.
			array(
				get_site_url() . '/wp-admin/admin.php?page=elementor-app&ver=3.10.0#site-editor/promotion',
				'',
				null,
				get_site_url() . '/wp-admin/admin.php?page=elementor-app&ver=3.10.0#site-editor/promotion',

			),
			// Disallowed URLs.
			array(
				'javascript:alert("Hello")',
				'',
				null,
				'',
			),
			array(
				'http://example.com',
				'',
				null,
				'',
			),
			array(
				'https://wordpress.commerce.malicious-site.com',
				'',
				null,
				'',
			),
			array(
				$plugin_slug,
				'',
				null,
				admin_url( 'admin.php?page=' . $plugin_slug ),
			),
		);
	}

	/**
	 * Tests parsing an update count.
	 *
	 * @param string $menu_item Menu item.
	 * @param string $expected  Parsed menu title & count. Or not.
	 *
	 * @throws \ReflectionException Noop.
	 * @dataProvider menu_item_update_data
	 */
	#[DataProvider( 'menu_item_update_data' )]
	public function test_parse_menu_item( $menu_item, $expected ) {
		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_menu_item_url = $class->getMethod( 'parse_menu_item' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prepare_menu_item_url->setAccessible( true );
		}

		$this->assertSame(
			$expected,
			$prepare_menu_item_url->invokeArgs( new WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $menu_item ) )
		);
	}

	/**
	 * Data provider for test_prepare_menu_item_url.
	 *
	 * @return string[][]
	 */
	public static function menu_item_update_data() {
		return array(
			array(
				'No Updates here',
				array(
					'title' => 'No Updates here',
				),
			),
			array(
				'Zero updates <span class="update-plugins count-0"><span class="update-count">0</span></span>',
				array(
					'title' => 'Zero updates',
				),
			),
			array(
				'<span class="update-plugins count-0"><span class="update-count">0</span></span> Zero updates',
				array(
					'title' => 'Zero updates',
				),
			),
			array(
				'Finally some updates <span class="update-plugins count-5"><span class="update-count">5</span></span>',
				array(
					'count' => 5,
					'title' => 'Finally some updates',
				),
			),
			array(
				'<span class="update-plugins count-5"><span class="update-count">5</span></span> finally some updates',
				array(
					'count' => 5,
					'title' => 'Finally some updates',
				),
			),
			array(
				'Plugin updates <span class="update-plugins count-5"><span class="plugin-count">5</span></span>',
				array(
					'count' => 5,
					'title' => 'Plugin updates',
				),
			),
			array(
				'<span class="update-plugins count-5"><span class="plugin-count">5</span></span> plugin updates',
				array(
					'count' => 5,
					'title' => 'Plugin updates',
				),
			),
			array(
				'Comments <span class="awaiting-mod count-2"><span class="pending-count" aria-hidden="true">2</span><span class="comments-in-moderation-text screen-reader-text">Comments in moderation</span></span>',
				array(
					'count' => 2,
					'title' => 'Comments',
				),
			),
			array(
				'<span class="awaiting-mod count-2"><span class="pending-count" aria-hidden="true">2</span><span class="comments-in-moderation-text screen-reader-text"> comments in moderation</span></span> Comments',
				array(
					'count' => 2,
					'title' => 'Comments',
				),
			),
			array(
				'<span class="unexpected-classname">badge name</span> Unexpected <font style="vertical-align: inherit;"><font style="vertical-align: inherit;">markup</font></font><font style="vertical-align: inherit;"><font style="vertical-align: inherit;"></font></font> <span class="unexpected-classname">badge name</span>',
				array(
					'title' => 'Badge name Unexpected markup badge name',
				),
			),
			array(
				'Comments <span class="awaiting-mod">new feature</span>more title',
				array(
					'badge' => 'new feature',
					'title' => 'Comments more title',
				),
			),
		);
	}

	/**
	 * Without the public `wp-admin-sidebar` plugin loaded the response
	 * preserves the legacy flat-array shape and items do not carry the
	 * additive `group_id` / `signal` fields. This is the contract for
	 * non-WPCOM Jetpack installs.
	 *
	 * @depends test_successful_request
	 *
	 * @param WP_REST_Response $response Admin Menu API response.
	 */
	#[Depends( 'test_successful_request' )]
	public function test_response_is_legacy_shape_without_classifier( WP_REST_Response $response ) {
		// Only meaningful when the classifier is genuinely absent. Skip on
		// hosts that load the public plugin (e.g., a fully wired WPCOM env).
		if ( class_exists( 'Sidebar_Classifier' ) ) {
			$this->markTestSkipped( 'Sidebar_Classifier is loaded; legacy-shape contract does not apply on this host.' );
		}

		$data = $response->get_data();

		$this->assertIsArray( $data );
		// Legacy shape: list keyed by integer indexes, not an associative
		// `{ menu, groups }` envelope.
		$this->assertArrayNotHasKey( 'menu', $data );
		$this->assertArrayNotHasKey( 'groups', $data );

		foreach ( $data as $item ) {
			$this->assertArrayNotHasKey( 'group_id', $item );
			$this->assertArrayNotHasKey( 'signal', $item );
		}
	}

	/**
	 * When stub classifier + signals classes are visible to the endpoint, the
	 * response wraps the menu in `{ menu, groups }`, attaches `group_id` +
	 * `signal` to matched items by slug, and emits the synthetic `groups[]`
	 * row(s) the classifier built.
	 *
	 * The stub classes mirror the public plugin's API surface (the two
	 * static methods + nav-model shape the endpoint actually consumes) so
	 * the test runs offline without depending on `wp-admin-sidebar`.
	 */
	public function test_response_carries_group_fields_when_classifier_is_loaded() {
		if ( ! class_exists( 'Sidebar_Classifier' ) ) {
			eval( // phpcs:ignore Squiz.PHP.Eval.Discouraged, MediaWiki.Usage.ForbiddenFunctions.eval
				'class Sidebar_Classifier {
					private static $model = null;
					public static function set_model( $model ) { self::$model = $model; }
					public static function build_nav_model(): void {}
					public static function get_nav_model(): ?array { return self::$model; }
				}'
			);
		}
		if ( ! class_exists( 'Sidebar_Signals' ) ) {
			eval( // phpcs:ignore Squiz.PHP.Eval.Discouraged, MediaWiki.Usage.ForbiddenFunctions.eval
				'class Sidebar_Signals {}'
			);
		}

		// Skip when a real classifier is present. We don't want to clobber
		// the host's classifier state from a Jetpack unit test.
		// @phan-suppress-next-line PhanUndeclaredClassReference -- Sidebar_Classifier is the stub eval'd above or the real WPCOM mu-plugin class.
		if ( ! method_exists( 'Sidebar_Classifier', 'set_model' ) ) {
			$this->markTestSkipped( 'Real Sidebar_Classifier is loaded; stub-driven test is not applicable.' );
		}

		$menu = array(
			array( 'Dashboard', 'read', 'index.php', '', 'menu-top', 'menu-dashboard', 'dashicons-dashboard' ),
			array( 'No Signal', 'read', 'no-signal', '', 'menu-top', 'menu-no-signal', 'dashicons-admin-generic' ),
			array( 'Jetpack', 'read', 'jetpack', '', 'menu-top', 'menu-jetpack', 'dashicons-admin-plugins' ),
			array( 'WooCommerce', 'read', 'woocommerce', '', 'menu-top', 'menu-woocommerce', 'dashicons-admin-plugins' ),
			array( 'Nested', 'read', 'nested-plugin', '', 'menu-top', 'menu-nested-plugin', 'dashicons-admin-plugins' ),
		);
		global $submenu;
		$previous_submenu = $submenu;
		$submenu          = array(
			'jetpack' => array(
				array( 'Jetpack Dashboard', 'read', 'jetpack', '', 'menu-top' ),
			),
		);

		// The classifier is present, but gating can still leave no nav model.
		$legacy_response_with_no_model = ( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->prepare_menu_for_response( $menu );

		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Sidebar_Classifier is the stub eval'd above.
		Sidebar_Classifier::set_model(
			array(
				'version'      => 1,
				'generated_at' => 0,
				'site_id'      => 1,
				'user_id'      => 1,
				'top_level'    => array(
					array(
						'itemId'         => 'core:core:-:index.php',
						'menuSlug'       => 'index.php',
						'source'         => 'core',
						'reassignable'   => false,
						'default_weight' => 10,
						'default_group'  => null,
						'signal'         => array(
							'count'         => null,
							'numeric_badge' => null,
							'badge'         => null,
							'inline_text'   => null,
							'inline_icon'   => null,
							'attention'     => false,
						),
					),
					array(
						'itemId'        => 'plugin:no-signal/no-signal.php:-:no-signal',
						'menuSlug'      => 'no-signal',
						'source'        => 'plugin',
						'reassignable'  => true,
						'default_group' => '',
						'_weight'       => 77,
					),
					array(
						'itemId'        => 'plugin:parent/parent.php:-:parent-plugin',
						'menuSlug'      => 'parent-plugin',
						'source'        => 'plugin',
						'reassignable'  => true,
						'default_group' => null,
						'children'      => array(
							array(
								'itemId'         => 'plugin:nested/nested.php:-:nested-plugin',
								'menuSlug'       => 'nested-plugin',
								'source'         => 'plugin',
								'reassignable'   => true,
								'default_group'  => null,
								'default_weight' => 88,
							),
						),
					),
				),
				'groups'       => array(
					array(
						'id'       => '',
						'title'    => 'Nameless Group',
						'children' => array(),
					),
					array(
						'id'       => 'plugins',
						'title'    => 'My Plugins',
						'icon'     => null,
						'children' => array(
							array(
								'itemId'        => 'plugin:woocommerce/woocommerce.php:-:woocommerce',
								'menuSlug'      => 'woocommerce',
								'source'        => 'plugin',
								'reassignable'  => true,
								'default_group' => 'plugins',
							),
							array(
								'itemId'        => 'plugin:jetpack/jetpack.php:-:jetpack',
								'menuSlug'      => 'jetpack',
								'source'        => 'plugin',
								'reassignable'  => true,
								'default_group' => 'plugins',
								'children'      => array(
									array(
										'itemId'        => 'plugin:jetpack/jetpack.php:jetpack:jetpack',
										'menuSlug'      => 'jetpack',
										'parent'        => 'jetpack',
										'source'        => 'plugin',
										'reassignable'  => true,
										'default_group' => 'plugins',
									),
								),
								'signal'        => array(
									'count'         => 3,
									'numeric_badge' => null,
									'badge'         => '3',
									'inline_text'   => null,
									'inline_icon'   => null,
									'attention'     => true,
								),
							),
						),
						'signal'   => array(
							'attention' => true,
							'count'     => 3,
						),
					),
				),
			)
		);

		$layout_response_without_storage = ( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->prepare_menu_for_response( $menu );

		if ( ! interface_exists( 'Sidebar_Layout_Storage' ) ) {
			eval( // phpcs:ignore Squiz.PHP.Eval.Discouraged, MediaWiki.Usage.ForbiddenFunctions.eval
				'interface Sidebar_Layout_Storage {
					public function get_layouts( int $user_id ): array;
					public function put_layouts( int $user_id, array $layouts ): bool;
				}'
			);
		}
		if ( ! class_exists( 'WP_User_Meta_Storage' ) ) {
			eval( // phpcs:ignore Squiz.PHP.Eval.Discouraged, MediaWiki.Usage.ForbiddenFunctions.eval
				'class WP_User_Meta_Storage implements Sidebar_Layout_Storage {
					private const META_KEY = "wpcom_admin_sidebar_layouts";
					public function get_layouts( int $user_id ): array {
						$value = get_user_meta( $user_id, self::META_KEY, true );
						return is_array( $value ) ? $value : array();
					}
					public function put_layouts( int $user_id, array $layouts ): bool {
						return (bool) update_user_meta( $user_id, self::META_KEY, $layouts );
					}
				}'
			);
		}

		$layout_delta = array(
			'version'    => 1,
			'updated_at' => 12345,
			'overrides'  => array(
				array(
					'itemId'   => 'plugin:jetpack/jetpack.php:-:jetpack',
					'position' => array(
						'kind'  => 'top_level',
						'index' => 2,
					),
				),
			),
		);
		update_user_meta(
			static::$user_id,
			'wpcom_admin_sidebar_layouts',
			array(
				get_current_blog_id() => $layout_delta,
			)
		);

		$response = ( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->prepare_menu_for_response( $menu );
		wp_set_current_user( 0 );
		$layout_response_without_user = ( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->prepare_menu_for_response( $menu );
		wp_set_current_user( static::$user_id );
		delete_user_meta( static::$user_id, 'wpcom_admin_sidebar_layouts' );
		$empty_layout_response = ( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->prepare_menu_for_response( $menu );
		update_user_meta(
			static::$user_id,
			'wpcom_admin_sidebar_layouts',
			array(
				get_current_blog_id() => array( 'version' => 2 ),
			)
		);
		$invalid_layout_response = ( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->prepare_menu_for_response( $menu );

		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Sidebar_Classifier is the stub eval'd above.
		Sidebar_Classifier::set_model(
			array(
				'version'      => 1,
				'generated_at' => 0,
				'site_id'      => 1,
				'user_id'      => 1,
				'top_level'    => array(
					array(
						'itemId'        => 'core:core:-:index.php',
						'menuSlug'      => 'index.php',
						'source'        => 'core',
						'reassignable'  => false,
						'default_group' => null,
					),
				),
				'groups'       => array(),
			)
		);
		$response_with_empty_groups = ( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->prepare_menu_for_response( $menu );

		// Reset stub state for any subsequent tests.
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Sidebar_Classifier is the stub eval'd above.
		Sidebar_Classifier::set_model( null );
		delete_user_meta( static::$user_id, 'wpcom_admin_sidebar_layouts' );
		$submenu = $previous_submenu;

		$this->assertIsArray( $legacy_response_with_no_model );
		$this->assertArrayNotHasKey( 'menu', $legacy_response_with_no_model );
		$this->assertArrayNotHasKey( 'layoutDelta', $layout_response_without_storage );
		$this->assertArrayNotHasKey( 'layoutDelta', $layout_response_without_user );
		$this->assertTrue(
			rest_validate_value_from_schema(
				$legacy_response_with_no_model,
				( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->get_public_item_schema()
			)
		);
		$this->assertTrue(
			rest_validate_value_from_schema(
				$response,
				( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->get_public_item_schema()
			)
		);

		$this->assertIsArray( $response );
		$this->assertArrayHasKey( 'menu', $response );
		$this->assertArrayHasKey( 'groups', $response );
		$this->assertArrayHasKey( 'layoutDelta', $response );

		$by_slug = array();
		foreach ( $response['menu'] as $item ) {
			$by_slug[ $item['slug'] ] = $item;
		}

		$this->assertArrayHasKey( 'index-php', $by_slug );
		$this->assertArrayHasKey( 'no-signal', $by_slug );
		$this->assertArrayHasKey( 'jetpack', $by_slug );
		$this->assertArrayHasKey( 'woocommerce', $by_slug );

		// Top-level core item: matched, no group, signal attached but inert.
		$this->assertNull( $by_slug['index-php']['group_id'] );
		$this->assertSame( false, $by_slug['index-php']['signal']['attention'] );
		$this->assertSame( 'core:core:-:index.php', $by_slug['index-php']['itemId'] );
		$this->assertSame( 'core', $by_slug['index-php']['source'] );
		$this->assertFalse( $by_slug['index-php']['reassignable'] );
		$this->assertSame( 10, $by_slug['index-php']['default_weight'] );

		// A matched item without signal data keeps the field explicit and null.
		$this->assertNull( $by_slug['no-signal']['group_id'] );
		$this->assertNull( $by_slug['no-signal']['signal'] );
		$this->assertSame(
			'plugin:no-signal/no-signal.php:-:no-signal',
			$by_slug['no-signal']['itemId']
		);
		$this->assertSame( 77, $by_slug['no-signal']['default_weight'] );

		// Recursed child entries can still hydrate menu rows by slug.
		$this->assertArrayHasKey( 'nested-plugin', $by_slug );
		$this->assertSame( 'plugin:nested/nested.php:-:nested-plugin', $by_slug['nested-plugin']['itemId'] );
		$this->assertSame( 88, $by_slug['nested-plugin']['default_weight'] );

		// Grouped plugin item: group_id set, attention signal flowed through.
		$this->assertSame( 'plugins', $by_slug['jetpack']['group_id'] );
		$this->assertSame( 3, $by_slug['jetpack']['signal']['count'] );
		$this->assertTrue( $by_slug['jetpack']['signal']['attention'] );
		$this->assertSame( 'plugin:jetpack/jetpack.php:-:jetpack', $by_slug['jetpack']['itemId'] );
		$this->assertSame(
			'plugin:jetpack/jetpack.php:jetpack:jetpack',
			$by_slug['jetpack']['children'][0]['itemId']
		);
		$this->assertSame( 'plugin', $by_slug['jetpack']['source'] );
		$this->assertTrue( $by_slug['jetpack']['reassignable'] );
		$this->assertSame( 1, $by_slug['jetpack']['default_weight'] );
		$this->assertSame( 'plugins', $by_slug['woocommerce']['group_id'] );
		$this->assertNull( $by_slug['woocommerce']['signal'] );
		$this->assertSame( 0, $by_slug['woocommerce']['default_weight'] );
		$this->assertSame(
			array( 'woocommerce', 'jetpack' ),
			array_values(
				array_map(
					static function ( $item ) {
						return $item['slug'];
					},
					array_filter(
						$response['menu'],
						static function ( $item ) {
							return isset( $item['group_id'] ) && 'plugins' === $item['group_id'];
						}
					)
				)
			)
		);

		// Top-level groups row mirrors the classifier's group shape.
		$this->assertCount( 1, $response['groups'] );
		$group = $response['groups'][0];
		$this->assertSame( 'plugins', $group['id'] );
		$this->assertSame( 'My Plugins', $group['label'] );
		$this->assertFalse( $group['default_expanded'] );
		$this->assertTrue( $group['signal']['attention'] );
		$this->assertSame( 3, $group['signal']['count'] );

		$this->assertSame( $layout_delta, $response['layoutDelta'] );
		$this->assertSame(
			array(
				'version'    => 1,
				'updated_at' => 0,
				'overrides'  => array(),
			),
			$empty_layout_response['layoutDelta']
		);
		$this->assertSame(
			array(
				'version'    => 1,
				'updated_at' => 0,
				'overrides'  => array(),
			),
			$invalid_layout_response['layoutDelta']
		);
		$this->assertSame( array(), $response_with_empty_groups['groups'] );
	}
}
