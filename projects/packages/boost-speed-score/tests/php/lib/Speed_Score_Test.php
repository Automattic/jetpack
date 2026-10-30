<?php
/**
 * Tests for the response Speed_Score builds from its two requests.
 *
 * @package automattic/jetpack-boost-speed-score
 */

namespace Automattic\Jetpack\Boost_Speed_Score\Tests\Lib;

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_History;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Request;
use Automattic\Jetpack\Boost_Speed_Score\Tests\Base_TestCase;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class Speed_Score_Test
 *
 * @package Automattic\Jetpack\Boost_Speed_Score\Tests\Lib
 */
class Speed_Score_Test extends Base_TestCase {

	const URL          = 'http://example.com';
	const URL_NO_BOOST = 'http://example.com?jb-disable-modules=all';

	/**
	 * Options, keyed by option name.
	 *
	 * @var array
	 */
	public $options = array();

	/**
	 * Stub the WordPress functions the response reads through.
	 */
	protected function set_up() {
		parent::set_up();

		$this->options = array(
			self::history_option( self::URL )          => array( self::entry( 80, 90 ) ),
			self::history_option( self::URL_NO_BOOST ) => array( self::entry( 60, 70 ) ),
		);
		Functions\when( 'get_option' )->alias(
			function ( $name, $default_value = false ) {
				return array_key_exists( $name, $this->options ) ? $this->options[ $name ] : $default_value;
			}
		);
		Functions\when( 'add_query_arg' )->alias(
			function ( $key, $value, $url ) {
				return $url . '?' . $key . '=' . $value;
			}
		);
		Functions\when( 'rest_ensure_response' )->returnArg();
	}

	/**
	 * The option a URL's history is stored under.
	 *
	 * @param string $url The measured URL.
	 * @return string
	 */
	private static function history_option( $url ) {
		return Speed_Score_History::OPTION_PREFIX . Speed_Score_Request::generate_cache_id_from_url( $url );
	}

	/**
	 * A history entry recorded now.
	 *
	 * @param int $mobile  Mobile score.
	 * @param int $desktop Desktop score.
	 * @return array
	 */
	private static function entry( $mobile, $desktop ) {
		return array(
			'timestamp' => time(),
			'scores'    => array(
				'mobile'  => $mobile,
				'desktop' => $desktop,
			),
			'theme'     => 'Twenty Twenty-Four',
		);
	}

	/**
	 * Request statuses, and the response status and comparison scores that follow.
	 *
	 * @return array
	 */
	public static function provide_request_states() {
		$previous = array(
			'mobile'  => 60,
			'desktop' => 70,
		);

		return array(
			'own score ready, comparison still running' => array( 'success', 'pending', 'success', $previous ),
			'both ready'                                => array( 'success', 'success', 'success', $previous ),
			'own score still running'                   => array( 'pending', 'success', 'pending', null ),
			'comparison failed'                         => array( 'success', 'error', 'error', null ),
		);
	}

	/**
	 * @dataProvider provide_request_states
	 *
	 * @param string     $boosted  Status of the request with Boost.
	 * @param string     $no_boost Status of the request without Boost.
	 * @param string     $status   Expected response status.
	 * @param array|null $no_boost_scores Expected comparison scores on success.
	 */
	#[DataProvider( 'provide_request_states' )]
	public function test_the_site_score_does_not_wait_for_the_comparison_run( $boosted, $no_boost, $status, $no_boost_scores ) {
		$speed_score = new Speed_Score( array(), 'test' );
		$method      = new \ReflectionMethod( Speed_Score::class, 'prepare_speed_score_response' );
		// Required to reach the private method before PHP 8.1, a deprecated no-op from 8.5.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$response = $method->invoke(
			$speed_score,
			self::URL,
			new Speed_Score_Request( self::URL, array( 'critical_css' ), null, $boosted ),
			new Speed_Score_Request( self::URL_NO_BOOST, array(), null, $no_boost )
		);

		$this->assertSame( $status, $response['status'] );
		if ( 'success' === $status ) {
			$this->assertSame( $no_boost_scores, $response['scores']['noBoost'] );
		}
	}

	public function test_progress_ignores_a_comparison_left_running_from_an_earlier_test() {
		$speed_score = new Speed_Score( array(), 'test' );
		$method      = new \ReflectionMethod( Speed_Score::class, 'prepare_speed_score_response' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$response = $method->invoke(
			$speed_score,
			self::URL,
			new Speed_Score_Request( self::URL, array( 'critical_css' ), microtime( true ) - 10, 'pending' ),
			new Speed_Score_Request( self::URL_NO_BOOST, array(), microtime( true ) - 60, 'pending' )
		);

		$this->assertSame( 10, $response['progress']['elapsed'] );
	}
}
