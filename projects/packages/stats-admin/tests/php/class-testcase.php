<?php
/**
 * TestCase class
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use PHPUnit\Framework\TestCase as PHPUnit_TestCase;
use ReflectionProperty;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Base TestCase class which intercepts API calls and basic options.
 */
abstract class TestCase extends PHPUnit_TestCase {
	/**
	 * An Admin user id
	 *
	 * @var int
	 */
	protected $admin_id;

	/**
	 * An Editor user id
	 *
	 * @var int
	 */
	protected $editor_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		// Clear any existing data.
		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user_1',
				'user_pass'  => 'dummy_pass_1',
				'role'       => 'administrator',
			)
		);

		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user_2',
				'user_pass'  => 'dummy_pass_2',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( 0 );

		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10, 2 );
		add_filter( 'pre_http_request', array( $this, 'plan_http_response_fixture' ), 10, 3 );
		delete_option( Odyssey_Assets::ODYSSEY_STATS_CACHE_BUSTER_CACHE_KEY );

		// The connection status and the stats options are both memoized in statics, so they
		// outlive the mocked options and the cleared database.
		( new Connection_Manager() )->reset_connection_status();
		$this->reset_stats_options();
	}

	/**
	 * Drop the stats options `Stats\Options` holds on to between calls.
	 */
	private function reset_stats_options() {
		$options = new ReflectionProperty( Stats_Options::class, 'options' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$options->setAccessible( true );
		}
		$options->setValue( null, array() );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();

		remove_filter( 'pre_http_request', array( $this, 'plan_http_response_fixture' ) );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ) );
		delete_option( Odyssey_Assets::ODYSSEY_STATS_CACHE_BUSTER_CACHE_KEY );
	}

	/**
	 * Drop the mocked tokens, leaving a site that was never connected to WordPress.com.
	 */
	protected function disconnect_site() {
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10 );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Intercept the `Jetpack_Options` call and mock the values.
	 * Site-level connection set-up.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name Option name.
	 *
	 * @return mixed
	 */
	public function mock_jetpack_site_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'new.blogtoken';
			case 'user_tokens':
				return array(
					$this->admin_id  => 'token.secret.' . $this->admin_id,
					$this->editor_id => 'token.secret.' . $this->editor_id,
				);
			case 'id':
				return '999';
		}

		return $value;
	}

	/**
	 * Add http response fixtures
	 *
	 * @param array  $response - http response.
	 * @param array  $parsed_args - parsed args.
	 * @param string $url - URL.
	 */
	public function plan_http_response_fixture( $response, $parsed_args, $url ) {
		if ( strpos( $url, '/build_meta.json' ) !== false ) {
			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => '{"cache_buster": "calypso-4917-8664-g72a154d63a"}',
			);
		}

		if ( strpos( $url, '/jetpack-stats-dashboard/notices' ) !== false ) {
			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => '{"opt_in_new_stats":true,"opt_out_new_stats":true,"new_stats_feedback":true,"traffic_page_settings":false}',
			);
		}

		if ( strpos( $url, '/sites/999/' ) !== false ) {
			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => '{}',
			);
		}

		return $response;
	}
}
