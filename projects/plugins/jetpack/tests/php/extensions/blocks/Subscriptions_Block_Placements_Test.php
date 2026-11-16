<?php
/**
 * Subscribe block placement registration tests.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriptions/subscriptions.php';

/**
 * Subscribe block placement registration tests.
 *
 * @covers ::Automattic\Jetpack\Extensions\Subscriptions\register_block
 */
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Subscriptions\\register_block' )]
class Subscriptions_Block_Placements_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Theme directories before the test registered the core fixtures.
	 *
	 * @var string[]
	 */
	private $theme_directories;

	public function set_up() {
		parent::set_up();
		$this->theme_directories = $GLOBALS['wp_theme_directories'];
		register_theme_directory( DIR_TESTDATA . '/themedir1' );
		switch_theme( 'block-theme' );
		update_option( 'jetpack_subscriptions_subscribe_post_end_enabled', true );
		add_filter(
			'jetpack_active_modules',
			function ( $modules ) {
				$modules[] = 'subscriptions';
				return $modules;
			}
		);
		set_current_screen( 'site-editor' );
	}

	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->theme_directories;
		Constants::clear_constants();
		Cache::clear();
		parent::tear_down();
	}

	/**
	 * Only WordPress.com Simple fires `restapi_theme_init` for the Site Editor's requests.
	 *
	 * @param array $constants        Host constants.
	 * @param bool  $registers_on_init Whether placements register without `restapi_theme_init`.
	 * @dataProvider provide_hosts
	 */
	#[DataProvider( 'provide_hosts' )]
	public function test_placements_register_in_admin( array $constants, bool $registers_on_init ) {
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}
		Cache::clear();

		Automattic\Jetpack\Extensions\Subscriptions\register_block();
		$this->assertSame( $registers_on_init, has_filter( 'hooked_block_jetpack/subscriptions' ) );

		do_action( 'restapi_theme_init' );
		$this->assertTrue( has_filter( 'hooked_block_jetpack/subscriptions' ) );
	}

	/**
	 * Data provider for test_placements_register_in_admin.
	 *
	 * @return array
	 */
	public static function provide_hosts() {
		return array(
			'Atomic' => array(
				array(
					'ATOMIC_SITE_ID'       => 999,
					'ATOMIC_CLIENT_ID'     => 999,
					'WPCOMSH__PLUGIN_FILE' => 'wpcomsh.php',
				),
				true,
			),
			'Simple' => array( array( 'IS_WPCOM' => true ), false ),
		);
	}
}
