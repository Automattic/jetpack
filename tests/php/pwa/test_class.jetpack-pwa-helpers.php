<?php

require_once JETPACK__PLUGIN_DIR . 'modules/pwa/class.jetpack-pwa-helpers.php';

class AMP_Customizer_Settings {
	static function get_settings() {
		return array(
			'header_background_color' => '#000'
		);
	}
}

class WP_Test_PWA_Helpers extends WP_UnitTestCase {
	function setup() {
		global $_wp_theme_features;
		$this->initial_theme_features = $_wp_theme_features; // Should be assign by copy

		$this->mods_option_name = sprintf( "theme_mods_%s", get_option( 'stylesheet' ) );
		update_option(
			$this->mods_option_name,
			array(
				'background_color' => 'efefef'
			)
		);
	}

	function tearDown() {
		global $_wp_theme_features;
		$_wp_theme_features = $this->initial_theme_features;
		remove_all_filters( 'amp_post_template_customizer_settings' );
	}

	function test_default_icon_size_values() {
		$defaults = Jetpack_PWA_Helpers::get_default_manifest_icon_sizes();

		$this->assertNotEmpty( $defaults );
		$this->assertContainsOnly( 'int', $defaults );
	}

	function test_site_icon_url_defaults_to_packaged_icons() {
		delete_option( 'site_icon' );
		$icon = Jetpack_PWA_Helpers::site_icon_url();

		$this->assertContains( 'modules/pwa/images/wp-512.png', $icon );
	}

	function test_site_icon_url_when_site_icon_set() {
		$attachment_id = $this->factory->attachment->create_upload_object( JETPACK__PLUGIN_DIR . 'tests/php/jetpack-icon.jpg', 0 );
		update_option( 'site_icon', $attachment_id );
		$icon = Jetpack_PWA_Helpers::site_icon_url();

		$this->assertContains( 'jetpack-icon', $icon );
	}

	function test_theme_color_defaults_to_white() {
		global $_wp_theme_features;
		unset( $_wp_theme_features['custom-background'] );
		add_filter( 'amp_post_template_customizer_settings', '__return_empty_array' );

		$color = Jetpack_PWA_Helpers::get_theme_color();

		$this->assertSame( '#fff', $color );
	}

	function test_theme_color_prefers_amp() {
		$color = Jetpack_PWA_Helpers::get_theme_color();
		$this->assertSame( '#000', $color );
	}

	function test_theme_color_uses_custom_background_when_no_amp() {
		global $_wp_theme_features;
		$_wp_theme_features['custom-background'] = true;

		add_filter( 'amp_post_template_customizer_settings', '__return_empty_array' );

		$color = Jetpack_PWA_Helpers::get_theme_color();
		$this->assertSame( '#efefef', $color );
	}
}
