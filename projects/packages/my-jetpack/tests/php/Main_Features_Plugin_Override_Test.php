<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Boost;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * Unit tests for reading a host's forced plugins.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Main_Features::get_plugin_override
 */
class Main_Features_Plugin_Override_Test extends TestCase {

	const PLUGIN_DIR = WP_PLUGIN_DIR . '/jetpack-boost';

	const PLUGIN_FILE = 'jetpack-boost/jetpack-boost.php';

	public function setUp(): void {
		parent::setUp();

		if ( ! file_exists( self::PLUGIN_DIR ) ) {
			mkdir( self::PLUGIN_DIR, 0777, true );
		}
		copy( __DIR__ . '/assets/boost-mock-plugin.txt', self::PLUGIN_DIR . '/jetpack-boost.php' );
		wp_cache_delete( 'plugins', 'plugins' );
	}

	public function tearDown(): void {
		parent::tearDown();

		remove_all_filters( 'option_active_plugins' );
		WorDBless_Options::init()->clear_options();
	}

	public function test_an_unfiltered_plugin_is_the_owners_to_switch() {
		$this->assertSame( '', Main_Features::get_plugin_override( 'jetpack-boost', Boost::class ) );
	}

	public function test_a_plugin_the_host_adds_is_forced_on() {
		add_filter(
			'option_active_plugins',
			function ( $plugins ) {
				$plugins[] = self::PLUGIN_FILE;
				return array_unique( $plugins );
			}
		);

		$this->assertSame( 'active', Main_Features::get_plugin_override( 'jetpack-boost', Boost::class ) );
	}

	public function test_a_plugin_the_host_drops_is_forced_off() {
		add_filter(
			'option_active_plugins',
			function ( $plugins ) {
				return array_values( array_diff( $plugins, array( self::PLUGIN_FILE ) ) );
			}
		);

		$this->assertSame( 'inactive', Main_Features::get_plugin_override( 'jetpack-boost', Boost::class ) );
	}

	public function test_a_filter_on_other_plugins_leaves_this_one_alone() {
		add_filter(
			'option_active_plugins',
			function ( $plugins ) {
				$plugins[] = 'akismet/akismet.php';
				return $plugins;
			}
		);

		$this->assertSame( '', Main_Features::get_plugin_override( 'jetpack-boost', Boost::class ) );
	}

	public function test_a_missing_plugin_has_no_override() {
		add_filter( 'option_active_plugins', '__return_empty_array' );

		$this->assertSame( '', Main_Features::get_plugin_override( 'zero-bs-crm' ) );
	}

	public function test_the_grid_carries_the_override() {
		add_filter( 'option_active_plugins', '__return_empty_array' );

		$features = array_column( Main_Features::get_features(), 'plugin_override', 'slug' );

		$this->assertSame( 'inactive', $features['boost'] );
		$this->assertSame( '', $features['stats'] );
	}
}
