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

			wp_set_current_user( 0 );
			$this->assertFalse( Initializer::add_admin_script_data( array() )['myJetpack']['isAvailable'] );
		} finally {
			$_registered_pages = $registered_pages;
			$wp_actions        = $actions;
			wp_set_current_user( $user_id );
		}
	}

	/**
	 * Footers on every Jetpack admin page link to the products tab from script data.
	 */
	public function test_adds_the_products_section() {
		$filter = 'jetpack_feature_flag_enabled_' . Initializer::FEATURES_TAB_FEATURE_FLAG;
		$this->assertNull( Initializer::add_admin_script_data( array() )['myJetpack']['productsSection'] );

		add_filter( $filter, '__return_true' );
		$data = Initializer::add_admin_script_data( array() );
		remove_all_filters( $filter );

		$this->assertSame( 'features', $data['myJetpack']['productsSection']['slug'] );
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
