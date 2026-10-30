<?php
/**
 * Tests for LCP_Invalidator class
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Constants;
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
	 * The HTTP status the cloud answers LCP requests with.
	 *
	 * @var int
	 */
	private $cloud_status = 200;

	/**
	 * How many LCP requests reached the cloud.
	 *
	 * @var int
	 */
	private $lcp_requests = 0;

	/**
	 * Set up test environment
	 */
	public function set_up() {
		parent::set_up();

		( new Lcp() )->register_data_sync( Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE ) );
		LCP_Invalidator::init();

		add_filter( 'jetpack_boost_cornerstone_pages_list_complete', array( $this, 'get_cornerstone_pages' ) );
		add_filter( 'pre_http_request', array( $this, 'answer_as_cloud' ), 10, 3 );

		// The client sends nothing without a blog token.
		update_option( 'jetpack_options', array( 'id' => 1234 ) );
		update_option( 'jetpack_private_options', array( 'blog_token' => 'test.token' ) );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Tear down test environment
	 */
	public function tear_down() {
		wp_clear_scheduled_hook( LCP_Invalidator::STYLE_REANALYSIS_HOOK );
		remove_all_actions( 'save_post' );
		remove_all_actions( LCP_Invalidator::STYLE_REANALYSIS_HOOK );
		remove_filter( 'jetpack_boost_cornerstone_pages_list_complete', array( $this, 'get_cornerstone_pages' ) );
		remove_filter( 'pre_http_request', array( $this, 'answer_as_cloud' ), 10 );
		delete_option( 'jetpack_options' );
		delete_option( 'jetpack_private_options' );
		Constants::clear_single_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
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
	 * @param false|array $pre  Whether to preempt the request.
	 * @param array       $args The request arguments.
	 * @param string      $url  The request URL.
	 * @return array|\WP_Error The cloud's answer to an LCP request; an error for anything else.
	 */
	public function answer_as_cloud( $pre, $args, $url ) {
		if ( ! str_contains( $url, '/jetpack-boost/lcp' ) ) {
			return new \WP_Error( 'blocked', 'No HTTP in tests.' );
		}

		++$this->lcp_requests;

		return array(
			'response' => array( 'code' => $this->cloud_status ),
			'body'     => 200 === $this->cloud_status ? '{"status":"enqueued"}' : '{"statusCode":429,"error":"Too Many Requests"}',
			'headers'  => array(),
		);
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

	public function test_a_later_save_moves_the_reanalysis_after_it() {
		wp_schedule_single_event( time() + MINUTE_IN_SECONDS, LCP_Invalidator::STYLE_REANALYSIS_HOOK );

		wp_insert_post(
			array(
				'post_type'   => 'wp_global_styles',
				'post_status' => 'publish',
				'post_title'  => 'Saved',
			)
		);

		$this->assertGreaterThanOrEqual( time() + 5 * MINUTE_IN_SECONDS - 1, wp_next_scheduled( LCP_Invalidator::STYLE_REANALYSIS_HOOK ) );
	}

	/**
	 * @dataProvider reanalysis_cases
	 */
	#[DataProvider( 'reanalysis_cases' )]
	public function test_the_reanalysis_refreshes_an_analysed_site_only( $seeded_status, $seeded_age, $cloud_status, $expected_status, $requests, $rescheduled ) {
		if ( $seeded_status ) {
			jetpack_boost_ds_set(
				'lcp_state',
				array(
					'status'  => $seeded_status,
					'pages'   => array( array_merge( Cornerstone_Utils::prepare_provider_data( $this->url ), array( 'status' => LCP_State::PAGE_STATES['success'] ) ) ),
					'created' => 1.0,
					'updated' => microtime( true ) - $seeded_age,
				)
			);
		}
		$this->cloud_status = $cloud_status;

		do_action( LCP_Invalidator::STYLE_REANALYSIS_HOOK );

		$state = ( new LCP_State() )->get();
		$this->assertSame( $expected_status, $state['status'] );
		$this->assertSame( $requests, $this->lcp_requests );
		$this->assertSame( $rescheduled, (bool) wp_next_scheduled( LCP_Invalidator::STYLE_REANALYSIS_HOOK ) );
	}

	/**
	 * Seeded status and age in seconds, the cloud's answer, then the expected status, requests and reschedule.
	 *
	 * @return array[]
	 */
	public static function reanalysis_cases() {
		$analyzed = LCP_State::ANALYSIS_STATES['analyzed'];
		$pending  = LCP_State::ANALYSIS_STATES['pending'];

		return array(
			'analysed: its pages go pending'           => array( $analyzed, 60, 200, $pending, 1, false ),
			'the cloud refuses: an error, not pending' => array( $analyzed, 60, 429, LCP_State::ANALYSIS_STATES['error'], 1, false ),
			'an analysis already running: tried again later' => array( $pending, 60, 200, $pending, 0, true ),
			'pending for over an hour: runs anyway'    => array( $pending, 2 * HOUR_IN_SECONDS, 200, $pending, 1, false ),
			'never analysed: left alone'               => array( null, 0, 200, LCP_State::ANALYSIS_STATES['not_analyzed'], 0, false ),
		);
	}
}
