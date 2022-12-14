<?php // phpcs:ignore
/**
 * Tests for /wpcom/v2/admin-menu endpoint.
 */

require_once dirname( dirname( __DIR__ ) ) . '/lib/class-wp-test-jetpack-rest-testcase.php';

/**
 * Class WP_Test_WPCOM_REST_API_V2_Endpoint_Admin_Menu
 *
 * @coversDefaultClass WPCOM_REST_API_V2_Endpoint_Admin_Menu
 */
class WP_Test_WPCOM_REST_API_V2_Endpoint_Admin_Menu extends WP_Test_Jetpack_REST_Testcase {

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
	 *
	 * @covers ::get_item_permissions_check
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
	 * @covers ::get_item_permissions_check
	 * @covers ::get_item
	 * @covers ::prepare_menu_for_response
	 * @depends test_successful_request
	 *
	 * @param WP_REST_Response $response Admin Menu API response.
	 */
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
	 * @covers ::prepare_menu_for_response
	 * @depends test_successful_request
	 *
	 * @param WP_REST_Response $response Admin Menu API response.
	 */
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
	 * @covers ::prepare_menu_item
	 */
	public function test_prepare_menu_item( array $menu_item, array $expected ) {
		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_menu_item = $class->getMethod( 'prepare_menu_item' );
		$prepare_menu_item->setAccessible( true );

		$this->assertEquals(
			$expected,
			$prepare_menu_item->invokeArgs( new WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $menu_item ) )
		);
	}

	/**
	 * Data provider for test_prepare_menu_item.
	 *
	 * @return \string[][][]
	 */
	public function menu_item_data() {
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
	 * Tests preparing a submenu item.
	 *
	 * @param array $submenu_item Submenu item as generated in wp-admin/menu.php.
	 * @param array $menu_item    Menu item as generated in wp-admin/menu.php.
	 * @param array $expected     Menu item object ready for API response.
	 *
	 * @throws \ReflectionException Noop.
	 * @dataProvider submenu_item_data
	 * @covers ::prepare_submenu_item
	 */
	public function test_prepare_submenu_item( array $submenu_item, array $menu_item, array $expected ) {
		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_submenu_item = $class->getMethod( 'prepare_submenu_item' );
		$prepare_submenu_item->setAccessible( true );

		$this->assertSame(
			$expected,
			$prepare_submenu_item->invokeArgs( new WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $submenu_item, $menu_item ) )
		);
	}

	/**
	 * Data provider for test_prepare_submenu_item.
	 *
	 * @return \string[][][]
	 */
	public function submenu_item_data() {
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
		$prepare_menu_item->setAccessible( true );

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
	 * @covers ::prepare_menu_item_icon
	 * @covers ::prepare_dashicon
	 */
	public function test_prepare_menu_item_icon( $icon, $expected ) {
		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_menu_item_icon = $class->getMethod( 'prepare_menu_item_icon' );
		$prepare_menu_item_icon->setAccessible( true );

		$this->assertEquals(
			$expected,
			$prepare_menu_item_icon->invokeArgs( new WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $icon ) )
		);
	}

	/**
	 * Data provider for test_prepare_submenu_item.
	 *
	 * @return \string[][]
	 */
	public function menu_item_icon_data() {
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
	 * @covers ::prepare_menu_item_url
	 */
	public function test_prepare_menu_item_url( $url, $parent_slug, $callback, $expected ) {
		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_menu_item_url = $class->getMethod( 'prepare_menu_item_url' );
		$prepare_menu_item_url->setAccessible( true );

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
	 * @return \string[][]
	 */
	public function menu_item_url_data() {
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
	 * @covers ::parse_menu_item
	 */
	public function test_parse_menu_item( $menu_item, $expected ) {
		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_menu_item_url = $class->getMethod( 'parse_menu_item' );
		$prepare_menu_item_url->setAccessible( true );

		$this->assertSame(
			$expected,
			$prepare_menu_item_url->invokeArgs( new WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $menu_item ) )
		);
	}

	/**
	 * Data provider for test_prepare_menu_item_url.
	 *
	 * @return \string[][]
	 */
	public function menu_item_update_data() {
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
}
