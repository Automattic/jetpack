<?php
/**
 * Tests for My Jetpack script data.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use WorDBless\BaseTestCase;

/**
 * Tests the My Jetpack addition to the unified script data object.
 */
class Script_Data_Test extends BaseTestCase {

	public function test_offline_features_seed_is_opt_in() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'offline-admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);
		\Automattic\Jetpack\Status\Cache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );
		try {
			$this->assertFalse( Initializer::should_initialize() );
			$this->assertArrayNotHasKey( 'offlineFeatures', Initializer::add_admin_script_data( array() )['myJetpack'] );
			add_filter( 'jetpack_my_jetpack_offline_features', '__return_true' );
			$this->assertArrayNotHasKey( 'offlineFeatures', Initializer::add_admin_script_data( array() )['myJetpack'] );
			$_GET['page'] = 'my-jetpack';
			$site         = array(
				'rest_root'  => rest_url(),
				'rest_nonce' => wp_create_nonce( 'wp_rest' ),
			);
			$data         = Initializer::add_admin_script_data(
				array(
					'existing' => 'value',
					'site'     => $site,
				)
			);
			$this->assertSame( 'value', $data['existing'] );
			$this->assertSame( $site, $data['site'] );
			$this->assertTrue( Initializer::should_initialize() );
			$this->assertNotEmpty( $data['myJetpack']['offlineFeatures']['mainFeatures']['features'] );
			$this->assertSame( Main_Features::get_state( true ), $data['myJetpack']['offlineFeatures']['mainFeatures'] );
			foreach ( $data['myJetpack']['offlineFeatures']['mainFeatures']['features'] as $feature ) {
				$this->assertNull( $feature['upgrade'] );
			}
			$this->assertSame( \Automattic\Jetpack\Plugins_Installer::get_plugins(), $data['myJetpack']['offlineFeatures']['plugins'] );
			$this->assertArrayNotHasKey( 'apiRoot', $data['myJetpack']['offlineFeatures'] );
			$this->assertArrayNotHasKey( 'apiNonce', $data['myJetpack']['offlineFeatures'] );
			$this->assertSame( 1, wp_verify_nonce( $data['site']['rest_nonce'], 'wp_rest' ) );
		} finally {
			remove_all_filters( 'jetpack_offline_mode' );
			\Automattic\Jetpack\Status\Cache::clear();
			remove_all_filters( 'jetpack_my_jetpack_offline_features' );
			unset( $_GET['page'] );
			wp_set_current_user( 0 );
		}
	}

	public function test_offline_features_seed_respects_host_veto_and_editor_permissions() {
		$_GET['page'] = 'my-jetpack';
		\Automattic\Jetpack\Status\Cache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );
		add_filter( 'jetpack_my_jetpack_offline_features', '__return_true' );
		try {
			wp_set_current_user(
				wp_insert_user(
					array(
						'user_login' => 'offline-editor',
						'user_pass'  => 'password',
						'role'       => 'editor',
					)
				)
			);
			$this->assertFalse( REST_Main_Features::permissions_callback() );
			$this->assertArrayNotHasKey( 'offlineFeatures', Initializer::add_admin_script_data( array() )['myJetpack'] );
			wp_set_current_user(
				wp_insert_user(
					array(
						'user_login' => 'host-admin',
						'user_pass'  => 'password',
						'role'       => 'administrator',
					)
				)
			);
			add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );
			$this->assertFalse( Initializer::should_initialize() );
			$this->assertArrayNotHasKey( 'offlineFeatures', Initializer::add_admin_script_data( array() )['myJetpack'] );
		} finally {
			remove_all_filters( 'jetpack_offline_mode' );
			\Automattic\Jetpack\Status\Cache::clear();
			remove_all_filters( 'jetpack_my_jetpack_offline_features' );
			remove_all_filters( 'jetpack_my_jetpack_should_initialize' );
			unset( $_GET['page'] );
			wp_set_current_user( 0 );
		}
	}

	public function test_offline_switch_does_not_change_online_disconnected_data() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'online-admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);
		\Automattic\Jetpack\Status\Cache::clear();
		add_filter( 'jetpack_offline_mode', '__return_false' );
		try {
			$before = Initializer::add_admin_script_data( array() );
			add_filter( 'jetpack_my_jetpack_offline_features', '__return_true' );
			$this->assertSame( $before, Initializer::add_admin_script_data( array() ) );
			$this->assertSame( Main_Features::get_state(), REST_Main_Features::get_state()->get_data() );
			$this->assertTrue( Initializer::should_initialize() );
		} finally {
			remove_all_filters( 'jetpack_offline_mode' );
			\Automattic\Jetpack\Status\Cache::clear();
			remove_all_filters( 'jetpack_my_jetpack_offline_features' );
			unset( $_GET['page'] );
			wp_set_current_user( 0 );
		}
	}

	/**
	 * Site Editor data is added without replacing existing script data.
	 */
	public function test_adds_site_editor_data() {
		$data = Initializer::add_script_data( array( 'existing' => 'value' ) );

		$this->assertSame( 'value', $data['existing'] );
		$this->assertIsBool( $data['myJetpack']['siteEditor']['isBlockTheme'] );
		$this->assertIsBool( $data['myJetpack']['siteEditor']['isSharingBlockAvailable'] );
		$this->assertIsBool( $data['myJetpack']['siteEditor']['isLikeBlockAvailable'] );
		$this->assertSame( get_stylesheet(), $data['myJetpack']['siteEditor']['activeThemeStylesheet'] );
	}

	/**
	 * The base has to address the package's own built images, and to match the value the
	 * My Jetpack page localizes, so `assetUrl()` resolves the same URL either way.
	 */
	public function test_adds_the_image_base_url() {
		$data = Initializer::add_admin_script_data( array( 'existing' => 'value' ) );

		$this->assertSame( 'value', $data['existing'] );
		$this->assertStringEndsWith( '/my-jetpack/build/images/', $data['myJetpack']['assetsUrl'] );
		$this->assertSame( Initializer::get_assets_url(), $data['myJetpack']['assetsUrl'] );
	}

	public function test_publishes_features_navigation_for_released_footers() {
		$features = array(
			'slug'  => 'features',
			'label' => 'Features',
		);

		$this->assertSame( $features, Initializer::get_products_section() );
		$this->assertSame( $features, Initializer::add_admin_script_data( array() )['myJetpack']['productsSection'] );
	}

	/**
	 * Availability requires initialization, page registration, and access for the current user.
	 */
	public function test_admin_page_availability() {
		global $_registered_pages, $wp_actions;

		$registered_pages = $_registered_pages;
		$actions          = $wp_actions;
		$user_id          = get_current_user_id();
		$page_hook        = get_plugin_page_hookname( 'my-jetpack', 'jetpack' );
		$editor_id        = wp_insert_user(
			array(
				'user_login' => 'footer-editor',
				'user_pass'  => 'test-password',
				'role'       => 'editor',
			)
		);

		try {
			wp_set_current_user( $editor_id );
			unset( $wp_actions['my_jetpack_init'] );
			$_registered_pages[ $page_hook ] = true;
			$this->assertFalse( Initializer::add_admin_script_data( array() )['myJetpack']['isAvailable'] );

			do_action( 'my_jetpack_init' );
			unset( $_registered_pages[ $page_hook ] );
			$this->assertFalse( Initializer::add_admin_script_data( array() )['myJetpack']['isAvailable'] );

			$_registered_pages[ $page_hook ] = true;
			$this->assertTrue( Initializer::add_admin_script_data( array() )['myJetpack']['isAvailable'] );

			unset( $_GET['page'] );
			wp_set_current_user( 0 );
			$this->assertFalse( Initializer::add_admin_script_data( array() )['myJetpack']['isAvailable'] );
		} finally {
			$_registered_pages = $registered_pages;
			$wp_actions        = $actions;
			wp_set_current_user( $user_id );
		}
	}

	/**
	 * Covers requests other than the My Jetpack page's own.
	 */
	public function test_the_image_base_url_is_registered_off_the_my_jetpack_page() {
		remove_all_filters( 'jetpack_admin_js_script_data' );

		Initializer::init();

		$this->assertSame( 0, did_action( 'admin_enqueue_scripts' ) );
		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data', array( Initializer::class, 'add_admin_script_data' ) )
		);
	}

	/**
	 * Covers sites where `jetpack_my_jetpack_should_initialize` is false.
	 */
	public function test_the_image_base_url_is_registered_where_my_jetpack_is_off() {
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );
		remove_all_filters( 'jetpack_admin_js_script_data' );

		Initializer::init();

		$this->assertFalse( Initializer::should_initialize() );
		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data', array( Initializer::class, 'add_admin_script_data' ) )
		);

		remove_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );
	}
}
