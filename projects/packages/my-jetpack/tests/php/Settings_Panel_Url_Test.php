<?php
/**
 * Tests for the URLs that point a module at its settings panel.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\My_Jetpack\Products\Creator;
use Automattic\Jetpack\My_Jetpack\Products\Related_Posts;
use Automattic\Jetpack\My_Jetpack\Products\Videopress;
use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use PHPUnit\Framework\Attributes\DataProvider;
use ReflectionProperty;
use WorDBless\BaseTestCase;

/**
 * Tests the URLs that move to My Jetpack behind settings consolidation.
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
		$default = admin_url( 'admin.php?page=jetpack-settings' ) . '#/settings?term=related-posts';

		$this->assertSame( $default, apply_filters( self::CONFIGURE, $default ) );
		$this->assertStringContainsString( 'page=jetpack#/traffic', (string) Related_Posts::get_manage_url() );

		add_filter( self::FLAG_FILTER, '__return_true' );

		$this->assertStringContainsString( 'page=my-jetpack', apply_filters( self::CONFIGURE, $default ) );
		$this->assertStringContainsString( 'page=my-jetpack', (string) Related_Posts::get_manage_url() );
	}

	public function test_configure_url_keeps_a_page_that_is_not_the_settings_search() {
		Initializer::register_settings_panel_urls();
		add_filter( self::FLAG_FILTER, '__return_true' );
		$own_page = admin_url( 'admin.php?page=jetpack-seo' );

		$this->assertSame( $own_page, apply_filters( self::CONFIGURE, $own_page ) );
	}

	/**
	 * @dataProvider provide_feature_search_manage_urls
	 * @param string $product  The product class.
	 * @param bool   $flag     Whether settings consolidation is on.
	 * @param string $expected The manage URL, relative to wp-admin.
	 */
	#[DataProvider( 'provide_feature_search_manage_urls' )]
	public function test_manage_url_searches_features_behind_the_flag( $product, $flag, $expected ) {
		// update_init_options() never turns admin_ui off again, so clear it to reach the fallback.
		$options = new ReflectionProperty( VideoPress_Initializer::class, 'init_options' );
		if ( PHP_VERSION_ID < 80100 ) {
			$options->setAccessible( true );
		}
		$saved = $options->getValue();
		$options->setValue( null, array() );

		if ( $flag ) {
			add_filter( self::FLAG_FILTER, '__return_true' );
		}
		$actual = $product::get_manage_url();
		$options->setValue( null, $saved );

		$this->assertSame( admin_url( $expected ), $actual );
	}

	/**
	 * Products whose manage URL moves to a Features search.
	 *
	 * @return array
	 */
	public static function provide_feature_search_manage_urls() {
		return array(
			'creator, flag off'    => array( Creator::class, false, 'admin.php?page=jetpack#/settings?term=creator' ),
			'creator, flag on'     => array( Creator::class, true, 'admin.php?page=my-jetpack#/features?search=creator' ),
			'videopress, flag off' => array( Videopress::class, false, 'admin.php?page=jetpack#/settings?term=videopress' ),
			'videopress, flag on'  => array( Videopress::class, true, 'admin.php?page=my-jetpack#/features?search=videopress' ),
		);
	}
}
