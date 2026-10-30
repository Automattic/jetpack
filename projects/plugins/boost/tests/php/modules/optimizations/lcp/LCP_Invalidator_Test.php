<?php
/**
 * Tests for LCP_Invalidator class
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Lcp;

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\Lcp;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_Invalidator;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_State;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once dirname( __DIR__, 5 ) . '/wp-js-data-sync.php';

/**
 * Class LCP_Invalidator_Test
 */
class LCP_Invalidator_Test extends BaseTestCase {

	/**
	 * The cornerstone page the tests analyse.
	 *
	 * @var string
	 */
	private $url = 'https://example.org/cornerstone/';

	/**
	 * Set up test environment
	 */
	public function set_up() {
		parent::set_up();

		( new Lcp() )->register_data_sync( Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE ) );
		LCP_Invalidator::init();

		add_filter( 'jetpack_boost_cornerstone_pages_list_complete', array( $this, 'get_cornerstone_pages' ) );
		add_filter( 'pre_http_request', array( $this, 'block_http' ) );
	}

	/**
	 * Tear down test environment
	 */
	public function tear_down() {
		wp_clear_scheduled_hook( LCP_Invalidator::STYLE_REANALYSIS_HOOK );
		remove_all_actions( 'save_post' );
		remove_all_actions( LCP_Invalidator::STYLE_REANALYSIS_HOOK );
		remove_filter( 'jetpack_boost_cornerstone_pages_list_complete', array( $this, 'get_cornerstone_pages' ) );
		remove_filter( 'pre_http_request', array( $this, 'block_http' ) );
		( new LCP_State() )->clear();
		\WorDBless\Posts::init()->clear_all_posts();
		parent::tear_down();
	}

	/**
	 * @return string[]
	 */
	public function get_cornerstone_pages() {
		return array( $this->url );
	}

	/**
	 * @return \WP_Error
	 */
	public function block_http() {
		return new \WP_Error( 'blocked', 'No HTTP in tests.' );
	}

	/**
	 * @dataProvider saves
	 */
	#[DataProvider( 'saves' )]
	public function test_a_save_schedules_a_reanalysis_only_when_it_can_restyle_every_page( $post_type, $post_status, $schedules ) {
		wp_insert_post(
			array(
				'post_type'    => $post_type,
				'post_status'  => $post_status,
				'post_title'   => 'Saved',
				'post_content' => 'img { object-fit: contain; }',
			)
		);

		$this->assertSame( $schedules, (bool) wp_next_scheduled( LCP_Invalidator::STYLE_REANALYSIS_HOOK ) );
	}

	/**
	 * @return array[]
	 */
	public static function saves() {
		return array(
			'a template'             => array( 'wp_template', 'publish', true ),
			'a template part'        => array( 'wp_template_part', 'publish', true ),
			'Global Styles'          => array( 'wp_global_styles', 'publish', true ),
			'Additional CSS'         => array( 'custom_css', 'publish', true ),
			'a draft template'       => array( 'wp_template', 'draft', false ),
			'a post: its own update' => array( 'post', 'publish', false ),
		);
	}

	public function test_saves_in_a_row_leave_one_reanalysis_scheduled() {
		foreach ( array( 'wp_template', 'wp_template_part', 'wp_global_styles' ) as $post_type ) {
			wp_insert_post(
				array(
					'post_type'   => $post_type,
					'post_status' => 'publish',
					'post_title'  => 'Saved',
				)
			);
		}

		$events = array_filter(
			_get_cron_array(),
			function ( $hooks ) {
				return isset( $hooks[ LCP_Invalidator::STYLE_REANALYSIS_HOOK ] );
			}
		);

		$this->assertCount( 1, $events );
	}

	/**
	 * @dataProvider reanalysis_cases
	 */
	#[DataProvider( 'reanalysis_cases' )]
	public function test_the_reanalysis_refreshes_an_analysed_site_only( $analysed, $expected_status ) {
		if ( $analysed ) {
			jetpack_boost_ds_set(
				'lcp_state',
				array(
					'status'  => LCP_State::ANALYSIS_STATES['analyzed'],
					'pages'   => array( array_merge( Cornerstone_Utils::prepare_provider_data( $this->url ), array( 'status' => LCP_State::PAGE_STATES['success'] ) ) ),
					'created' => 1.0,
					'updated' => 1.0,
				)
			);
		}

		do_action( LCP_Invalidator::STYLE_REANALYSIS_HOOK );

		$state = ( new LCP_State() )->get();
		$this->assertSame( $expected_status, $state['status'] );
	}

	/**
	 * @return array[]
	 */
	public static function reanalysis_cases() {
		return array(
			'analysed: its pages go pending' => array( true, LCP_State::ANALYSIS_STATES['pending'] ),
			'never analysed: left alone'     => array( false, LCP_State::ANALYSIS_STATES['not_analyzed'] ),
		);
	}
}
