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
	public function setUp() {
		parent::setUp();

		wp_set_current_user( static::$user_id );
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
	 * Tests get item.
	 *
	 * @covers ::get_item_permissions_check
	 * @covers ::get_item
	 * @covers ::prepare_menu_for_response
	 */
	public function test_get_item() {
		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/admin-menu' );
		$response = $this->server->dispatch( $request );

		$this->assertTrue( rest_validate_value_from_schema( $response->get_data(), ( new WPCOM_REST_API_V2_Endpoint_Admin_Menu() )->get_public_item_schema() ) );
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
				array( 'Media', 'upload_files', 'upload.php', '', 'menu-top menu-icon-media', 'menu-media', 'dashicons-admin-media' ),
				array(
					'type'  => 'menu-item',
					'icon'  => 'dashicons-admin-media',
					'slug'  => 'upload-php',
					'title' => 'Media',
					'url'   => 'http://example.org/wp-admin/upload.php',
				),
			),
			// Menu item with update count.
			array(
				array( 'Plugins <span class="update-plugins count-5"><span class="plugin-count">5</span></span>', 'moderate_comments', 'plugins.php', '', 'menu-top menu-icon-plugins', 'menu-plugins', 'dashicons-admin-plugins' ),
				array(
					'type'  => 'menu-item',
					'icon'  => 'dashicons-admin-plugins',
					'slug'  => 'plugins-php',
					'title' => 'Plugins',
					'url'   => 'http://example.org/wp-admin/plugins.php',
					'count' => 5,
				),
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

		$this->assertEquals(
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
		return array(
			// User doesn't have necessary permissions.
			array(
				array( 'Library', 'manage_options', 'upload.php' ),
				array( 'Media', 'upload_files', 'upload.php', '', 'menu-top menu-icon-media', 'menu-media', 'dashicons-admin-media' ),

				array(),
			),
			// Regular submenu item.
			array(
				array( 'Library', 'upload_files', 'upload.php' ),
				array( 'Media', 'upload_files', 'upload.php', '', 'menu-top menu-icon-media', 'menu-media', 'dashicons-admin-media' ),
				array(
					'parent' => 'upload-php',
					'type'   => 'submenu-item',
					'slug'   => 'upload-php',
					'title'  => 'Library',
					'url'    => 'http://example.org/wp-admin/upload.php',
				),
			),
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
	 * @param string $expected    Menu item url ready for API response.
	 *
	 * @throws \ReflectionException Noop.
	 * @dataProvider menu_item_url_data
	 * @covers ::prepare_menu_item_url
	 */
	public function test_prepare_menu_item_url( $url, $parent_slug, $expected ) {
		$class = new ReflectionClass( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

		$prepare_menu_item_url = $class->getMethod( 'prepare_menu_item_url' );
		$prepare_menu_item_url->setAccessible( true );

		// Fake plugin page.
		add_action( 'admin_page_' . $url, '__return_false' );

		$this->assertEquals(
			$expected,
			$prepare_menu_item_url->invokeArgs( new WPCOM_REST_API_V2_Endpoint_Admin_Menu(), array( $url, $parent_slug ) )
		);
	}

	/**
	 * Data provider for test_prepare_menu_item_url.
	 *
	 * @return \string[][]
	 */
	public function menu_item_url_data() {
		return array(
			// Calypso URL.
			array(
				'https://wordpress.com/me',
				'',
				'/me',
			),
			// Core menu item URL.
			array(
				'uploads.php',
				'',
				'http://example.org/wp-admin/uploads.php',
			),
			// Submenu item URL.
			array(
				'custom_settings',
				'upload.php',
				'http://example.org/wp-admin/upload.php?page=custom_settings',
			),
			// Plugin menu item URL.
			array(
				'custom_settings',
				'admin.php',
				'http://example.org/wp-admin/admin.php?page=custom_settings',
			),
			// Plugin menu item URL without a parent.
			array(
				'custom_settings',
				'',
				'http://example.org/wp-admin/admin.php?page=custom_settings',
			),
		);
	}
}
