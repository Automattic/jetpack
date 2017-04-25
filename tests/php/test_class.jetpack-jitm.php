<?php

require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-jitm.php' );

// Allows us to instantiate JITM class without calling anything
class Mock_JITM extends Jetpack_JITM {
	function __construct() {
	}
}

class WP_Test_Jetpack_JITM extends WP_UnitTestCase {
	function test_init() {
		$initial   = Mock_JITM::init();
		$singleton = Mock_JITM::init();

		$this->assertInstanceOf( 'Jetpack_JITM', $initial );
		$this->assertEquals( $initial, $singleton );
	}

	static function activate_plugin( $plugin ) {
		update_option( 'active_plugins', array_merge( get_option( 'active_plugins', array() ), array( $plugin ) ) );
	}

	/**
	 * This tests the output of an html function, so that if any changes are inadvertently made, it will be noticed.
	 * Just update this test if you change it on purpose
	 */
	function test_emblem() {
		$jitm = new Mock_JITM();

		$emblem          = $jitm->get_emblem();
		$expected_emblem = '<div class="jp-emblem"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0" y="0" viewBox="0 0 172.9 172.9" enable-background="new 0 0 172.9 172.9" xml:space="preserve">	<path d="M86.4 0C38.7 0 0 38.7 0 86.4c0 47.7 38.7 86.4 86.4 86.4s86.4-38.7 86.4-86.4C172.9 38.7 134.2 0 86.4 0zM83.1 106.6l-27.1-6.9C49 98 45.7 90.1 49.3 84l33.8-58.5V106.6zM124.9 88.9l-33.8 58.5V66.3l27.1 6.9C125.1 74.9 128.4 82.8 124.9 88.9z" /></svg></div>';
		$this->assertEquals( $expected_emblem, $emblem );
	}

	function test_prepare_jitm_edit_comments() {
		$user = $this->factory()->user->create( array(
			'role' => 'administrator'
		) );
		wp_set_current_user( $user );

		set_current_screen( 'edit-comments' );
		$screen = get_current_screen();

		$jitm = new Mock_JITM();
		$this->_backup_hooks();
		$jitm->prepare_jitms( $screen );

		$this->assertTrue( has_action( 'admin_enqueue_scripts', array( $jitm, 'jitm_enqueue_files' ) ) !== false );
		$this->assertTrue( has_action( 'admin_notices', array( $jitm, 'akismet_msg' ) ) !== false );

		$this->_restore_hooks();

		// "activate" akismet
		self::activate_plugin( 'akismet/akismet.php' );

		// assert jitm will not show if Akismet is active
		$jitm->prepare_jitms( $screen );

		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( $jitm, 'jitm_enqueue_files' ) ) );
		$this->assertFalse( has_action( 'admin_notices', array( $jitm, 'akismet_msg' ) ) );
	}

	function test_prepare_jitm_post() {
		$user = $this->factory()->user->create( array(
			'role' => 'administrator'
		) );
		wp_set_current_user( $user );

		set_current_screen( 'post' );
		$screen = get_current_screen();

		$_GET['message'] = 6;

		$jitm = new Mock_JITM();
		$this->_backup_hooks();
		$jitm->prepare_jitms( $screen );

		$this->assertTrue( has_action( 'admin_enqueue_scripts', array( $jitm, 'jitm_enqueue_files' ) ) !== false );
		$this->assertTrue( has_action( 'edit_form_top', array( $jitm, 'backups_after_publish_msg' ) ) !== false );

		$this->_restore_hooks();
		$this->clean_up_global_scope();

		// assert will not show unless $_GET['message'] == 6
		$jitm->prepare_jitms( $screen );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( $jitm, 'jitm_enqueue_files' ) ) );
		$this->assertFalse( has_action( 'edit_form_top', array( $jitm, 'backups_after_publish_msg' ) ) );

		// assert will not show if Vaultpress is active
		$_GET['message'] = 6;
		self::activate_plugin( 'vaultpress/vaultpress.php' );
		$jitm->prepare_jitms( $screen );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( $jitm, 'jitm_enqueue_files' ) ) );
		$this->assertFalse( has_action( 'edit_form_top', array( $jitm, 'backups_after_publish_msg' ) ) );

		// assert will not show if Vaultpress is active and $_GET['message'] != 6
		$this->clean_up_global_scope();
		$jitm->prepare_jitms( $screen );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( $jitm, 'jitm_enqueue_files' ) ) );
		$this->assertFalse( has_action( 'edit_form_top', array( $jitm, 'backups_after_publish_msg' ) ) );
	}

	function test_prepare_jitm_core() {
		$user = $this->factory()->user->create( array(
			'role' => 'administrator'
		) );
		wp_set_current_user( $user );

		set_current_screen( 'update-core' );
		$screen = get_current_screen();

		$jitm = new Mock_JITM();
		$this->_backup_hooks();
		$jitm->prepare_jitms( $screen );

		$this->assertTrue( has_action( 'admin_enqueue_scripts', array( $jitm, 'jitm_enqueue_files' ) ) !== false );
		$this->assertTrue( has_action( 'admin_notices', array( $jitm, 'backups_updates_msg' ) ) !== false );

		// assert jitm will not show if VaultPress is active
		$this->_restore_hooks();
		self::activate_plugin( 'vaultpress/vaultpress.php' );

		$jitm->prepare_jitms( $screen );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( $jitm, 'jitm_enqueue_files' ) ) );
		$this->assertFalse( has_action( 'admin_notices', array( $jitm, 'backups_updates_msg' ) ) );
	}

	function test_prepare_jitm_woo_services() {
		$user = $this->factory()->user->create( array(
			'role' => 'administrator'
		) );
		wp_set_current_user( $user );

		set_current_screen( 'woocommerce_page_wc-settings' );
		$screen = get_current_screen();

		$jitm = new Mock_JITM();
		$this->_backup_hooks();
		$jitm->prepare_jitms( $screen );

		$this->assertTrue( has_action( 'admin_enqueue_scripts', array( $jitm, 'jitm_enqueue_files' ) ) !== false );
		$this->assertTrue( has_action( 'admin_notices', array( $jitm, 'woocommerce_services_msg' ) ) !== false );

		$this->_restore_hooks();
		self::activate_plugin( 'woocommerce-services/woocommerce-services.php' );

		$jitm->prepare_jitms( $screen );

		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( $jitm, 'jitm_enqueue_files' ) ) );
		$this->assertFalse( has_action( 'admin_notices', array( $jitm, 'woocommerce_services_msg' ) ) );
	}

	function test_jitm_dismiss() {
		$jitm = new Mock_JITM();

		$this->assertFalse(
			$jitm->is_jitm_dismissed(),
			'The test JITM should not be dismissed initially'
		);

		Jetpack_Options::update_option( 'hide_jitm', array( 'any' ) );

		$this->assertTrue(
			$jitm->is_jitm_dismissed(),
			'The test JITM should be dismissed upon setting the option'
		);
	}
}
