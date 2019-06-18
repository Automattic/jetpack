<?php

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;
use Automattic\Jetpack\Constants as Jetpack_Constants;

function plugins_url( $path, $plugin_path ) {
	return $plugin_path . $path;
}

class AssetsTest extends TestCase {
	public function setUp() {
		$plugin_file = dirname( dirname( dirname( dirname( __DIR__ ) ) ) ) . '/jetpack.php';
		Jetpack_Constants::set_constant( 'JETPACK__PLUGIN_FILE', $plugin_file );
		$this->assets = new Assets();
	}

	public function tearDown() {
		unset( $this->assets );
	}

	/**
	 * The following tests are actually checking the behaviour of this class as an
	 * "Injectible Singleton", a special kind of singleton for stateless utility classes that allows
	 * some kinds of mocking that would otherwise be impossible
	 */
	function test_instance_returns_asset_instance() {
		$this->assertEquals( 'Automattic\Jetpack\Assets', get_class( Assets::instance() ) );
	}

	function test_instance_returns_injectable_asset_instance() {
		$instance = $this->getMockBuilder( 'Automattic\Jetpack\Assets' )->getMock();

		// memoize the new singleton instance
		Assets::instance( $instance );

		// should be the same as the mock one we just created
		$this->assertEquals( $instance, Assets::instance() );
	}

	function test_calling_method_statically_calls_real_method() {
		$instance = $this->getMockBuilder( 'Automattic\Jetpack\Assets' )
						->setMethods( ['real_get_file_url_for_environment'] )
						->getMock();

		$instance->expects( $this->once() )->method( 'real_get_file_url_for_environment' )->with( $this->equalTo( 'foo.min.js'), $this->equalTo( 'foo.js' ) );

		// memoize the new singleton instance
		Assets::instance( $instance );

		Assets::get_file_url_for_environment( 'foo.min.js', 'foo.js' );
	}

	function test_calling_method_on_instance_calls_real_method() {
		$instance = $this->getMockBuilder( 'Automattic\Jetpack\Assets' )
						->setMethods( ['real_get_file_url_for_environment'] )
						->getMock();

		$instance->expects( $this->once() )->method( 'real_get_file_url_for_environment' )->with( $this->equalTo( 'foo.min.js'), $this->equalTo( 'foo.js' ) );

		// memoize the new singleton instance
		Assets::instance( $instance );

		Assets::instance()->real_get_file_url_for_environment( 'foo.min.js', 'foo.js' );
	}

	/**
	 * @author ebinnion goldsounds
	 * @dataProvider get_file_url_for_environment_data_provider
	 */
	function test_get_file_url_for_environment( $min_path, $non_min_path, $is_script_debug, $expected, $not_expected ) {
		Constants::set_constant( 'SCRIPT_DEBUG', $is_script_debug );
		$assets = new Assets();
		$file_url = $assets->real_get_file_url_for_environment( $min_path, $non_min_path );

		$this->assertContains( $$expected, $file_url );
		$this->assertNotContains( $$not_expected, $file_url );
	}

	function get_file_url_for_environment_data_provider() {
		return array(
			'script-debug-true' => array(
				'_inc/build/shortcodes/js/instagram.js',
				'modules/shortcodes/js/instagram.js',
				true,
				'non_min_path',
				'min_path'
			),
			'script-debug-false' => array(
				'_inc/build/shortcodes/js/instagram.js',
				'modules/shortcodes/js/instagram.js',
				false,
				'min_path',
				'non_min_path'
			),
		);
	}
}
