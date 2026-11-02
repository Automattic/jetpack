<?php
/**
 * Tests for the URLs that point a module at its settings panel.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\My_Jetpack\Products\Related_Posts;
use WorDBless\BaseTestCase;

/**
 * Tests the settings panel URLs of migrated modules.
 */
class Settings_Panel_Url_Test extends BaseTestCase {

	const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . Initializer::SETTINGS_CONSOLIDATION_FLAG;
	const CONFIGURE   = 'jetpack_module_configuration_url_related-posts';

	/**
	 * Start from a registered flag, with no admin page: the shape of a REST request.
	 */
	public function set_up() {
		parent::set_up();
		Feature_Flags::reset();
		Initializer::register_feature_flags();
	}

	/**
	 * Drop the flag override and the registry.
	 */
	public function tear_down() {
		remove_filter( self::FLAG_FILTER, '__return_true' );
		remove_all_filters( self::CONFIGURE );
		Feature_Flags::reset();
		parent::tear_down();
	}

	public function test_panel_url_needs_the_flag_and_a_migrated_module() {
		$fallback = 'https://example.org/old';
		$panel    = admin_url( 'admin.php?page=my-jetpack&p=%2Ffeatures%3Fconfigure%3Drelated-posts' );

		$this->assertSame( $fallback, Initializer::resolve_settings_url( 'related-posts', $fallback ) );

		add_filter( self::FLAG_FILTER, '__return_true' );

		$this->assertSame( $panel, Initializer::resolve_settings_url( 'related-posts', $fallback ) );
		$this->assertSame( $fallback, Initializer::resolve_settings_url( 'likes', $fallback ) );
	}

	public function test_configure_url_and_manage_url_follow_the_flag() {
		Initializer::register_settings_panel_urls();
		$default = 'https://example.org/settings#/settings?term=related-posts';

		$this->assertSame( $default, apply_filters( self::CONFIGURE, $default ) );
		$this->assertStringContainsString( 'page=jetpack#/traffic', (string) Related_Posts::get_manage_url() );

		add_filter( self::FLAG_FILTER, '__return_true' );

		$this->assertStringContainsString( 'page=my-jetpack', apply_filters( self::CONFIGURE, $default ) );
		$this->assertStringContainsString( 'page=my-jetpack', (string) Related_Posts::get_manage_url() );
	}
}
