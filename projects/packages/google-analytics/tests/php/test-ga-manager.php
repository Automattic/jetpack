<?php
/**
 * Tests for the Google Analytics module.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Google_Analytics\GA_Manager;
use Automattic\Jetpack\Google_Analytics\Legacy;
use Automattic\Jetpack\Google_Analytics\Utils;
use PHPUnit\Framework\TestCase;

/**
 * Class WP_Test_Jetpack_Google_Analytics.
 */
class WP_Test_Jetpack_Google_Analytics extends TestCase {

	/**
	 * Testing Google Analytics account (UA).
	 *
	 * @var string
	 */
	const UA_ID = 'UA-000000000-1';

	/**
	 * Testing Google Analytics account (GA4).
	 *
	 * @var string
	 */
	const GA4_ID = 'G-XXXXXXX';

	/**
	 * Runs the routine before each test is executed.
	 *
	 * @before
	 *
	 * @return void
	 */
	public function set_up() {
		parent::setUp();

		// Hijack the option for Jetpack_Google_Analytics_Options::get_tracking_code().
		add_filter(
			'pre_option_jetpack_wga',
			function ( $option ) {
				if ( false === $option ) {
					$option = array();
				}
				$option['code'] = self::UA_ID;
				return $option;
			}
		);
	}

	/**
	 * Prepare sample data.
	 *
	 * @return array
	 */
	protected function get_sample() {
		$entries = array();

		$config_data = wp_json_encode(
			array(
				'vars'     => array(
					'account' => self::UA_ID,
				),
				'triggers' => array(
					'trackPageview' => array(
						'on'      => 'visible',
						'request' => 'pageview',
					),
				),
			)
		);

		// Generate a hash string to uniquely identify this entry.
		$entry_id = substr( md5( 'googleanalytics' . $config_data ), 0, 12 );

		$entries[ $entry_id ] = array(
			'type'   => 'googleanalytics',
			'config' => $config_data,
		);

		return $entries;
	}

	/**
	 * Confirm that the JSON information for the GA account is added to the AMP analytics entries.
	 */
	public function test_amp_analytics_entries() {
		$this->assertEquals(
			GA_Manager::amp_analytics_entries( array() ),
			$this->get_sample()
		);
	}

	/**
	 * Confirm that the GA account is not added twice to the AMP analytics entries.
	 */
	public function test_amp_analytics_single_entry() {
		$this->assertEquals(
			GA_Manager::amp_analytics_entries( $this->get_sample() ),
			$this->get_sample()
		);
	}

	/**
	 * Verify additional gtag universal commands can run.
	 */
	public function test_filter_jetpack_gtag_universal_commands() {
		// Hijack the option for Jetpack_Google_Analytics_Options::get_tracking_code().
		add_filter(
			'pre_option_jetpack_wga',
			function ( $option ) {
				$option['code'] = self::GA4_ID;
				return $option;
			}
		);

		// Filter being tested.
		add_filter(
			'jetpack_gtag_universal_commands',
			function () {
				return array(
					array(
						'event',
						'jetpack_testing_event',
						array(
							'event_category' => 'somecat',
							'event_label'    => 'somelabel',
							'value'          => 'someval',
						),
					),
					array(
						'event',
						'another_jetpack_testing_event',
						array(
							'event_category' => 'foo',
							'event_label'    => 'bar',
							'value'          => 'baz',
						),
					),
				);
			}
		);

		// GA code is only inserted in non-admin screens.
		set_current_screen( 'front' );

		// Mock `Jetpack_Google_Analytics_Legacy` instance to disable the constructor class.
		// @phan-suppress-next-line PhanDeprecatedFunction -- Conflict between PHPUnit versions, will replace with `anyMethods()` later on.
		$instance = $this->getMockBuilder( Legacy::class )
			->setMethods( null )
			->disableOriginalConstructor()
			->getMock();

		ob_start();
		$instance->insert_code();
		$actual = ob_get_clean();

		$this->assertTrue( false !== strpos( $actual, 'gtag( "event", "jetpack_testing_event", {"event_category":"somecat","event_label":"somelabel","value":"someval"} )' ) );
		$this->assertTrue( false !== strpos( $actual, 'gtag( "event", "another_jetpack_testing_event", {"event_category":"foo","event_label":"bar","value":"baz"} );' ) );
	}

	/**
	 * Verify functionality of DNT header handling.
	 */
	public function test_is_dnt_enabled() {
		$func_return_true      = function () {
			return true;
		};
		$func_return_false     = function () {
			return false;
		};
		$func_enable_honor_dnt = function ( $option ) {
			$option['honor_dnt'] = true;
			return $option;
		};

		// Test defaults
		unset( $_SERVER['HTTP_DNT'] );
		$this->assertFalse( Utils::is_dnt_enabled() );
		$_SERVER['HTTP_DNT'] = 0;
		$this->assertFalse( Utils::is_dnt_enabled() );
		$_SERVER['HTTP_DNT'] = 1;
		$this->assertFalse( Utils::is_dnt_enabled() );

		// Test ignore DNT header.
		add_filter( 'jetpack_honor_dnt_header_for_wga', $func_return_false );
		unset( $_SERVER['HTTP_DNT'] );
		$this->assertFalse( Utils::is_dnt_enabled() );
		$_SERVER['HTTP_DNT'] = 0;
		$this->assertFalse( Utils::is_dnt_enabled() );
		$_SERVER['HTTP_DNT'] = 1;
		$this->assertFalse( Utils::is_dnt_enabled() );
		remove_filter( 'jetpack_honor_dnt_header_for_wga', $func_return_false );

		// Test honor DNT header.
		add_filter( 'jetpack_honor_dnt_header_for_wga', $func_return_true );
		unset( $_SERVER['HTTP_DNT'] );
		$this->assertFalse( Utils::is_dnt_enabled() );
		$_SERVER['HTTP_DNT'] = 0;
		$this->assertFalse( Utils::is_dnt_enabled() );
		$_SERVER['HTTP_DNT'] = 1;
		$this->assertTrue( Utils::is_dnt_enabled() );
		remove_filter( 'jetpack_honor_dnt_header_for_wga', $func_return_true );

		// Test filter overrides option.
		add_filter( 'pre_option_jetpack_wga', $func_enable_honor_dnt );
		add_filter( 'jetpack_honor_dnt_header_for_wga', $func_return_false );
		unset( $_SERVER['HTTP_DNT'] );
		$this->assertFalse( Utils::is_dnt_enabled() );
		$_SERVER['HTTP_DNT'] = 0;
		$this->assertFalse( Utils::is_dnt_enabled() );
		$_SERVER['HTTP_DNT'] = 1;
		$this->assertFalse( Utils::is_dnt_enabled() );
		remove_filter( 'jetpack_honor_dnt_header_for_wga', $func_return_false );
		remove_filter( 'pre_option_jetpack_wga', $func_enable_honor_dnt );
	}
}
