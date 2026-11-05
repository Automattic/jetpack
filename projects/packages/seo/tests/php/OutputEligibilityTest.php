<?php
/**
 * Paid output with the real host-plugin helpers.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Dashboard_Data
 * @covers \Automattic\Jetpack\SEO\Schema_Builder
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversClass( Dashboard_Data::class )]
#[CoversClass( Schema_Builder::class )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class OutputEligibilityTest extends TestCase {

	/**
	 * Original bootstrap switch.
	 *
	 * @var string|false
	 */
	private static $original_bootstrap_switch;

	/**
	 * Bootstrap isolated processes without the plugin stubs.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		self::$original_bootstrap_switch = getenv( 'JETPACK_SEO_TEST_WITHOUT_PLUGIN_HELPER' );
		putenv( 'JETPACK_SEO_TEST_WITHOUT_PLUGIN_HELPER=1' );
	}

	/**
	 * Restore the bootstrap switch for subsequent test classes.
	 */
	public static function tearDownAfterClass(): void {
		putenv(
			false === self::$original_bootstrap_switch
				? 'JETPACK_SEO_TEST_WITHOUT_PLUGIN_HELPER'
				: 'JETPACK_SEO_TEST_WITHOUT_PLUGIN_HELPER=' . self::$original_bootstrap_switch
		);
		parent::tearDownAfterClass();
	}

	/**
	 * @dataProvider provide_hosts
	 * @param string $host Hosting platform.
	 */
	#[DataProvider( 'provide_hosts' )]
	public function test_paid_free_paid_preserves_values_and_legacy_description( $host ) {
		$plugin = __DIR__ . '/../../../../plugins/jetpack/modules/seo-tools/';
		require_once $plugin . 'class-jetpack-seo-utils.php';
		require_once $plugin . 'class-jetpack-seo-titles.php';
		require_once $plugin . 'class-jetpack-seo-posts.php';

		if ( 'simple' === $host ) {
			Constants::set_constant( 'IS_WPCOM', true );
		} elseif ( 'atomic' === $host ) {
			Constants::set_constant( 'ATOMIC_SITE_ID', 1 );
			Constants::set_constant( 'ATOMIC_CLIENT_ID', 1 );
			Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', 'wpcomsh/wpcomsh.php' );
		}
		\Automattic\Jetpack\Status\Cache::clear();
		add_filter( Initializer::FEATURE_FILTER, '__return_true' );
		\Wpcom_Test_Features::$known = array( 'advanced-seo' );
		$formats                     = array(
			'front_page' => array(
				array(
					'type'  => 'string',
					'value' => 'Paid title',
				),
			),
		);
		update_option( 'advanced_seo_title_formats', $formats );
		update_option( 'advanced_seo_front_page_description', 'Paid description' );
		update_option( 'show_on_front', 'posts' );
		update_option( 'blogname', 'Output eligibility site' );
		$GLOBALS['wp_query']          = new \WP_Query();
		$GLOBALS['wp_query']->is_home = true;
		$fallback                     = new \ReflectionMethod( Dashboard_Data::class, 'is_jetpack_seo_enabled_without_helper' );
		if ( PHP_VERSION_ID < 80100 ) {
			$fallback->setAccessible( true );
		}

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Validation post',
				'post_status' => 'publish',
			)
		);
		$this->assertIsInt( $post_id );
		update_post_meta( $post_id, \Jetpack_SEO_Posts::HTML_TITLE_META_KEY, 'Paid custom post title' );
		update_post_meta( $post_id, \Jetpack_SEO_Posts::DESCRIPTION_META_KEY, 'Paid custom post description' );
		update_post_meta( $post_id, \Jetpack_SEO_Posts::NOINDEX_META_KEY, true );

		foreach ( array( true, false, true ) as $entitled ) {
			\Wpcom_Test_Features::$entitled = $entitled ? array( 'advanced-seo' ) : array();
			$enabled                        = 'self-hosted' === $host || $entitled;
			$this->assertSame( $enabled, \Jetpack_SEO_Utils::is_enabled_jetpack_seo() );
			$this->assertSame( $enabled, $fallback->invoke( null ) );
			$this->assertSame( $enabled ? 'Paid title' : 'Default title', \Jetpack_SEO_Titles::get_custom_title( 'Default title' ) );
			$this->assertSame( $enabled ? 'Paid description' : '', \Jetpack_SEO_Utils::get_front_page_meta_description() );
			$settings = Dashboard_Data::get_settings_data();
			$this->assertSame( 'Paid description', $settings['front_page_description'] );
			$this->assertSame( $enabled, $settings['title_formats_editable'] );
			$this->assertSame( $enabled ? 'Paid custom post title' : '', \Jetpack_SEO_Posts::get_post_custom_html_title( $post_id ) );
			$this->assertSame( $enabled ? 'Paid custom post description' : '', \Jetpack_SEO_Posts::get_post_custom_description( $post_id ) );
			$this->assertSame( $enabled, \Jetpack_SEO_Posts::get_post_noindex_setting( $post_id ) );
			$this->assertSame( 'Paid custom post title', get_post_meta( $post_id, \Jetpack_SEO_Posts::HTML_TITLE_META_KEY, true ) );
			$this->assertSame( 'Paid custom post description', get_post_meta( $post_id, \Jetpack_SEO_Posts::DESCRIPTION_META_KEY, true ) );
			$this->assertTrue( (bool) get_post_meta( $post_id, \Jetpack_SEO_Posts::NOINDEX_META_KEY, true ) );

			ob_start();
			Schema_Builder::emit();
			$schema = ob_get_clean();
			$this->assertSame( $enabled, false !== strpos( $schema, 'application/ld+json' ) );
			$this->assertSame( $formats, get_option( 'advanced_seo_title_formats' ) );
			$this->assertSame( 'Paid description', get_option( 'advanced_seo_front_page_description' ) );
		}

		\Wpcom_Test_Features::$entitled = array();
		update_option( 'seo_meta_description', 'Grandfathered description' );
		$this->assertSame(
			'self-hosted' === $host ? 'Paid description' : 'Grandfathered description',
			\Jetpack_SEO_Utils::get_front_page_meta_description()
		);
		$this->assertSame( 'self-hosted' !== $host, Dashboard_Data::get_settings_data()['has_legacy_front_page_meta'] );
		$user_id = wp_insert_user(
			array(
				'user_login' => 'output_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		$this->assertIsInt( $user_id );
		wp_set_current_user( $user_id );
		add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ), 5 );
		$GLOBALS['wp_rest_server'] = null;
		$request                   = new \WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_param( Dashboard_Data::FRONT_PAGE_META_OPTION, 'Updated description' );
		$this->assertSame( 200, rest_do_request( $request )->get_status() );
		$this->assertSame( 'Updated description', \Jetpack_SEO_Utils::get_front_page_meta_description() );
		if ( 'self-hosted' !== $host ) {
			$this->assertSame( 'Paid description', get_option( 'advanced_seo_front_page_description' ) );
			\Wpcom_Test_Features::$entitled = array( 'advanced-seo' );
			$this->assertSame( 'Paid description', \Jetpack_SEO_Utils::get_front_page_meta_description() );
		}

		add_filter( 'jetpack_disable_seo_tools', '__return_true' );
		$this->assertFalse( \Jetpack_SEO_Utils::is_enabled_jetpack_seo() );
		$this->assertFalse( $fallback->invoke( null ) );
	}

	/**
	 * @return array<string, array{string}>
	 */
	public static function provide_hosts() {
		return array(
			'Simple'      => array( 'simple' ),
			'Atomic'      => array( 'atomic' ),
			'self-hosted' => array( 'self-hosted' ),
		);
	}
}
