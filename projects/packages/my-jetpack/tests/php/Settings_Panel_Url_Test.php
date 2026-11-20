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
use Automattic\Jetpack\My_Jetpack\Products\Site_Accelerator;
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
	const HOST_FILTER = 'jetpack_my_jetpack_modules_management_available';
	const INIT_FILTER = 'jetpack_my_jetpack_should_initialize';

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
		remove_filter( self::HOST_FILTER, '__return_false' );
		remove_filter( self::INIT_FILTER, '__return_false' );
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
	 * @dataProvider provide_moved_manage_urls
	 * @param string $product    The product class.
	 * @param bool   $flag       Whether settings consolidation is on.
	 * @param string $expected   The manage URL, relative to wp-admin.
	 * @param string $off_filter A filter to force false, if any.
	 */
	#[DataProvider( 'provide_moved_manage_urls' )]
	public function test_manage_url_moves_behind_the_flag( $product, $flag, $expected, $off_filter = '' ) {
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
		if ( $off_filter ) {
			add_filter( $off_filter, '__return_false' );
		}
		$actual = $product::get_manage_url();
		$options->setValue( null, $saved );

		$this->assertSame( admin_url( $expected ), $actual );
	}

	/**
	 * Products whose manage URL moves off the Settings screen.
	 *
	 * @return array
	 */
	public static function provide_moved_manage_urls() {
		return array(
			'creator, flag off'                       => array( Creator::class, false, 'admin.php?page=jetpack#/settings?term=creator' ),
			'creator, flag on'                        => array( Creator::class, true, 'admin.php?page=jetpack-newsletter' ),
			'videopress, flag off'                    => array( Videopress::class, false, 'admin.php?page=jetpack#/settings?term=videopress' ),
			'videopress, flag on'                     => array( Videopress::class, true, 'admin.php?page=my-jetpack#/features?search=videopress' ),
			'site accelerator, flag off'              => array( Site_Accelerator::class, false, 'admin.php?page=jetpack#/settings?term=site%20accelerator' ),
			'site accelerator, flag on'               => array( Site_Accelerator::class, true, 'admin.php?page=my-jetpack#/features?search=cdn' ),
			'creator, host hides My Jetpack'          => array( Creator::class, true, 'admin.php?page=jetpack#/settings?term=creator', self::HOST_FILTER ),
			'videopress, host hides My Jetpack'       => array( Videopress::class, true, 'admin.php?page=jetpack#/settings?term=videopress', self::HOST_FILTER ),
			'site accelerator, host hides My Jetpack' => array( Site_Accelerator::class, true, 'admin.php?page=jetpack#/settings?term=site%20accelerator', self::HOST_FILTER ),
			'related posts, host hides My Jetpack'    => array( Related_Posts::class, true, 'admin.php?page=jetpack#/traffic?term=related%20posts', self::HOST_FILTER ),
			'related posts, My Jetpack off'           => array( Related_Posts::class, true, 'admin.php?page=jetpack#/traffic?term=related%20posts', self::INIT_FILTER ),
		);
	}
}
