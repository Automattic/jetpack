<?php
/**
 * Tests for the Google Analytics module.
 *
 * @package Jetpack
 */

require_jetpack_file( 'modules/google-analytics/wp-google-analytics.php' );

/**
 * Class WP_Test_Jetpack_Google_Analytics.
 */
class WP_Test_Jetpack_Google_Analytics extends WP_UnitTestCase {

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
	 * @return void
	 */
	public function setUp() {
		parent::setUp();

		// Hijack the option for Jetpack_Google_Analytics_Options::get_tracking_code().
		add_filter(
			'pre_option_jetpack_wga',
			function( $option ) {
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
			Jetpack_Google_Analytics::amp_analytics_entries( array() ),
			$this->get_sample()
		);
	}

	/**
	 * Confirm that the GA account is not added twice to the AMP analytics entries.
	 */
	public function test_amp_analytics_single_entry() {
		$this->assertEquals(
			Jetpack_Google_Analytics::amp_analytics_entries( $this->get_sample() ),
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
		$instance = $this->getMockBuilder( Jetpack_Google_Analytics_Legacy::class )
			->setMethods( null )
			->disableOriginalConstructor()
			->getMock();

		ob_start();
		$instance->insert_code();
		$actual = ob_get_clean();

		$this->assertContains(
			'gtag( "event", "jetpack_testing_event", {"event_category":"somecat","event_label":"somelabel","value":"someval"} )',
			$actual
		);

		$this->assertContains(
			'gtag( "event", "another_jetpack_testing_event", {"event_category":"foo","event_label":"bar","value":"baz"} );',
			$actual
		);
	}
}
