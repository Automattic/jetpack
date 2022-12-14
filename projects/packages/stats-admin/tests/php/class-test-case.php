<?php
/**
 * Test_Case class
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Base Test_Case class which intercepts API calls and basic options.
 */
class Test_Case extends TestCase {
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
	 *
	 * @before
	 */
	public function set_up() {
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
		add_filter( 'http_response', array( $this, 'plan_http_response_fixture' ), 10, 3 );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();

		remove_filter( 'http_response', array( $this, 'plan_http_response_fixture' ) );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ) );
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

		if ( strpos( $url, '/sites/999/' ) !== false ) {
			return array(
				'response' => array(
					'code'    => 403,
					'message' => 'forbidden',
				),
				'body'     => '{"code"=>"forbidden"}',
			);
		}

		return $response;
	}
}
