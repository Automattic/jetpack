<?php
/**
 * Test_Case class
 *
 * @package jetpack-search
 */

namespace Automattic\Jetpack\Search;

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
		$this->admin_id  = wp_insert_user(
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
		if ( strpos( $url, '/jetpack-search/plan' ) !== false ) {
			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => '{"search_subscriptions":[{"ID":"1","user_id":"1","blog_id":"1","product_id":"2001","expiry":"2117-06-30","subscribed_date":"2017-06-30 16:07:06","renew":true,"auto_renew":true,"ownership_id":"9698106","most_recent_renew_date":"","subscription_status":"active","product_name":"Jetpack Professional","product_name_en":"Jetpack Professional","product_slug":"jetpack_business","product_type":"bundle","cost":0,"currency":"USD","bill_period":"365","available":"yes","multi":false,"support_document":null,"is_instant_search":false,"tier":null}],"supports_instant_search":false,"supports_only_classic_search":true,"supports_search":true,"default_upgrade_bill_period":"yearly"}',
			);
		}
		if ( strpos( $url, '/search' ) !== false && strpos( $url, 'v1.3/sites/' ) !== false ) {
			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => '{"total":6,"corrected_query":false,"page_handle":false,"results":[{"_score":2,"fields":{"date":"2021-10-28 21:07:24","blog_id":1,"post_id":12},"result_type":"post","railcar":{"railcar":"axtafgiOICSM","fetch_algo":"jetpack:search\/1-score_default","fetch_position":0,"rec_blog_id":1,"rec_post_id":12,"fetch_lang":"en","session_id":"p5G3vV"}},{"_score":1.1753112,"fields":{"date":"2021-10-11 22:05:36","blog_id":1,"post_id":1},"result_type":"post","railcar":{"railcar":"Urx6pll3AuHX","fetch_algo":"jetpack:search\/1-score_default","fetch_position":1,"rec_blog_id":1,"rec_post_id":1,"fetch_lang":"en","session_id":"p5G3vV"}}],"suggestions":[],"aggregations":[]}',
			);
		}
		return $response;
	}
}
