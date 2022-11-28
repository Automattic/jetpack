<?php
/**
 * Test module related methods in Jetpack and Jetpack_Admin class.
 *
 * @package jetpack
 */

use Automattic\Jetpack\Status\Cache as StatusCache;

/**
 * Test module related methods in Jetpack and Jetpack_Admin class.
 */
class WP_Test_Get_Modules extends WP_UnitTestCase {

	/**
	 * Store all available modules.
	 *
	 * @var array
	 */
	public static $all_modules;

	/**
	 * This is an expensive operation so let's make it only once
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();
		self::$all_modules = Jetpack::get_available_modules();
	}

	/**
	 * Make sure all our modules are being found.
	 */
	public function test_get_available_modules() {

		$expected_modules = array(
			'comment-likes',
			'comments',
			'contact-form',
			'copy-post',
			'custom-content-types',
			'custom-css',
			'enhanced-distribution',
			'google-analytics',
			'gravatar-hovercards',
			'infinite-scroll',
			'json-api',
			'latex',
			'lazy-images',
			'likes',
			'markdown',
			'masterbar',
			'monitor',
			'notes',
			'photon-cdn',
			'photon',
			'post-by-email',
			'protect',
			'publicize',
			'related-posts',
			'search',
			'seo-tools',
			'sharedaddy',
			'shortcodes',
			'shortlinks',
			'sitemaps',
			'sso',
			'stats',
			'subscriptions',
			'tiled-gallery',
			'vaultpress',
			'verification-tools',
			'videopress',
			'widget-visibility',
			'widgets',
			'woocommerce-analytics',
			'wordads',
		);

		$this->assertSame( asort( $expected_modules ), asort( self::$all_modules ) );

	}

	/**
	 * Test
	 *
	 * @dataProvider get_test_connection_filters_data
	 * @param null|bool $value_requires_connection Value to be used in the requires_connection filter.
	 * @param null|bool $value_requires_user_connection Value to be used in the requires_user_connection filter.
	 * @return void
	 */
	public function test_filter_by_require_connection( $value_requires_connection, $value_requires_user_connection ) {
		$modules = Jetpack::get_available_modules( false, false, $value_requires_connection, $value_requires_user_connection );
		$found   = array();
		foreach ( $modules as $module ) {
			$found[] = $module;
			$details = Jetpack::get_module( $module );
			if ( is_bool( $value_requires_connection ) ) {
				$this->assertSame( $value_requires_connection, $details['requires_connection'] );
			}
			if ( is_bool( $value_requires_user_connection ) ) {
				$this->assertSame( $value_requires_user_connection, $details['requires_user_connection'] );
			}
		}

		// Make sure no one was left behind.
		$max_matches = 0;
		if ( is_bool( $value_requires_connection ) ) {
			$max_matches++;
		}
		if ( is_bool( $value_requires_user_connection ) ) {
			$max_matches++;
		}
		foreach ( self::$all_modules as $module ) {
			if ( in_array( $module, $found, true ) ) {
				continue;
			}
			$matches = 0;
			$details = Jetpack::get_module( $module );
			if ( is_bool( $value_requires_connection ) && $details['requires_connection'] === $value_requires_connection ) {
				$matches++;
			}
			if ( is_bool( $value_requires_user_connection ) && $details['requires_user_connection'] === $value_requires_user_connection ) {
				$matches++;
			}
			$this->assertGreaterThan( $matches, $max_matches, $module . ' module should be returned by get_available_modules but was not.' );
		}
	}

	/**
	 * Send all the possible combinations to test_filter_by_require_connection
	 *
	 * @return array
	 */
	public function get_test_connection_filters_data() {
		return array(
			array(
				true,
				true,
			),
			array(
				true,
				false,
			),
			array(
				false,
				true,
			),
			array(
				false,
				false,
			),
			array(
				null,
				true,
			),
			array(
				null,
				false,
			),
			array(
				false,
				null,
			),
			array(
				true,
				null,
			),
		);
	}

	/**
	 * Test_get_module_unavailable_reason
	 *
	 * @covers Jetpack_Admin::get_module_unavailable_reason()
	 */
	public function test_get_module_unavailable_reason() {
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php';
		// Inalid input.
		$this->assertFalse( Jetpack_Admin::get_module_unavailable_reason( array() ) );

		$dummy_module = array(
			'module'                   => 'dummy',
			'requires_connection'      => true,
			'requires_user_connection' => true,
		);

		$this->assertSame( 'Jetpack is not connected', Jetpack_Admin::get_module_unavailable_reason( $dummy_module ) );

		// Mock site connection.
		Jetpack_Options::update_option( 'blog_token', 'dummy.blogtoken' );
		Jetpack_Options::update_option( 'id', '123' );

		add_filter( 'jetpack_no_user_testing_mode', '__return_true' );
		$this->assertSame( 'Requires a connected WordPress.com account', Jetpack_Admin::get_module_unavailable_reason( $dummy_module ) );
		remove_filter( 'jetpack_no_user_testing_mode', '__return_true' );
		// Mock a user connection.
		$user = self::factory()->user->create_and_get(
			array(
				'role' => 'administrator',
			)
		);
		Jetpack_Options::update_option( 'master_user', $user->ID );
		Jetpack_Options::update_option( 'user_tokens', array( $user->ID => "dummy.usertoken.$user->ID" ) );

		$this->assertSame( 'Not supported by current plan', Jetpack_Admin::get_module_unavailable_reason( $dummy_module ) );

		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );
		$this->assertSame( 'Offline mode', Jetpack_Admin::get_module_unavailable_reason( $dummy_module ) );
		remove_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();

		$dummy_module['module'] = 'woocommerce-analytics';
		$this->assertSame( 'Requires WooCommerce 3+ plugin', Jetpack_Admin::get_module_unavailable_reason( $dummy_module ) );

		$dummy_module['module'] = 'vaultpress';
		$this->assertSame( '', Jetpack_Admin::get_module_unavailable_reason( $dummy_module ) );
	}

	/**
	 * Test get_module with a valid module name that has module info.
	 */
	public function test_get_module_valid_module() {
		$module_info = array(
			'name'                      => 'Secure Sign On',
			'description'               => 'Allow users to log in to this site using WordPress.com accounts',
			'sort'                      => 30,
			'recommendation_order'      => 5,
			'introduced'                => '2.6',
			'changed'                   => '',
			'deactivate'                => true,
			'free'                      => true,
			'requires_connection'       => true,
			'requires_user_connection'  => true,
			'auto_activate'             => 'No',
			'module_tags'               => array( 'Developers' ),
			'feature'                   => array( 'Security' ),
			'additional_search_queries' => 'sso, single sign on, login, log in, 2fa, two-factor',
			'plan_classes'              => array( 'free' ),
		);

		$this->assertSame( $module_info, Jetpack::get_module( 'sso' ) );
	}

	/**
	 * Test get_module with a module slug that doesn't have module info.
	 */
	public function test_get_module_module_no_info() {
		$this->assertFalse( Jetpack::get_module( 'module-extras' ) );
	}
}
