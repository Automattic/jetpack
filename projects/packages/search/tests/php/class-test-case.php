<?php
/**
 * Test_Case class
 *
 * @package automattic/jetpack-search
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
	const PLAN_INFO_FIXTURE      = '{"search_subscriptions":[{"ID":"1","user_id":"1","blog_id":"1","product_id":"2001","expiry":"2117-06-30","subscribed_date":"2017-06-30 16:07:06","renew":true,"auto_renew":true,"ownership_id":"9698106","most_recent_renew_date":"","subscription_status":"active","product_name":"Jetpack Professional","product_name_en":"Jetpack Professional","product_slug":"jetpack_business","product_type":"bundle","cost":0,"currency":"USD","bill_period":"365","available":"yes","multi":false,"support_document":null,"is_instant_search":false,"tier":null}],"supports_instant_search":false,"supports_only_classic_search":true,"supports_search":true,"default_upgrade_bill_period":"yearly"}';
	const SEARCH_RESULT_FIXTURE  = '{"total":6,"corrected_query":false,"page_handle":false,"results":[{"_score":2,"fields":{"date":"2021-10-28 21:07:24","blog_id":1,"post_id":12},"result_type":"post","railcar":{"railcar":"axtafgiOICSM","fetch_algo":"jetpack:search\/1-score_default","fetch_position":0,"rec_blog_id":1,"rec_post_id":12,"fetch_lang":"en","session_id":"p5G3vV"}},{"_score":1.1753112,"fields":{"date":"2021-10-11 22:05:36","blog_id":1,"post_id":1},"result_type":"post","railcar":{"railcar":"Urx6pll3AuHX","fetch_algo":"jetpack:search\/1-score_default","fetch_position":1,"rec_blog_id":1,"rec_post_id":1,"fetch_lang":"en","session_id":"p5G3vV"}}],"suggestions":[],"aggregations":[]}';
	const WPCOM_PRODUCTS_FIXTURE = '{"jetpack_free":{"product_id":2002,"product_name":"JetpackFree","product_slug":"jetpack_free","description":"","product_type":"jetpack","available":true,"is_domain_registration":false,"cost_display":"A$0.00","combined_cost_display":"A$0.00","cost":0,"currency_code":"AUD","price_tier_list":[],"price_tier_usage_quantity":null,"product_term":"onetime","price_tiers":[],"price_tier_slug":""},"jetpack_search":{"product_id":2104,"product_name":"JetpackSearch","product_slug":"jetpack_search","description":"","product_type":"search","available":true,"is_domain_registration":false,"cost_display":"A$83.40","combined_cost_display":"A$83.40","cost":83.4,"currency_code":"AUD","price_tier_list":[{"minimum_units":0,"maximum_units":100,"minimum_price":8340,"minimum_price_display":"A$83.40","minimum_price_monthly_display":"A$6.95","maximum_price":8340,"maximum_price_display":"A$83.40","maximum_price_monthly_display":"A$6.95"},{"minimum_units":101,"maximum_units":1000,"minimum_price":16680,"minimum_price_display":"A$166.80","minimum_price_monthly_display":"A$13.90","maximum_price":16680,"maximum_price_display":"A$166.80","maximum_price_monthly_display":"A$13.90"},{"minimum_units":1001,"maximum_units":10000,"minimum_price":41700,"minimum_price_display":"A$417","minimum_price_monthly_display":"A$34.75","maximum_price":41700,"maximum_price_display":"A$417","maximum_price_monthly_display":"A$34.75"},{"minimum_units":10001,"maximum_units":100000,"minimum_price":100080,"minimum_price_display":"A$1,000.80","minimum_price_monthly_display":"A$83.40","maximum_price":100080,"maximum_price_display":"A$1,000.80","maximum_price_monthly_display":"A$83.40"},{"minimum_units":100001,"maximum_units":1000000,"minimum_price":333600,"minimum_price_display":"A$3,336","minimum_price_monthly_display":"A$278","maximum_price":333600,"maximum_price_display":"A$3,336","maximum_price_monthly_display":"A$278"},{"minimum_units":1000001,"maximum_units":null,"minimum_price":667200,"minimum_price_display":"A$6,672","minimum_price_monthly_display":"A$556","maximum_price":0,"maximum_price_display":null,"maximum_price_monthly_display":null}],"price_tier_usage_quantity":null,"product_term":"year","price_tiers":[],"price_tier_slug":"","sale_cost":41.7,"combined_sale_cost_display":"A$41.70","sale_coupon":{"start_date":"2022-02-2800:00:00","expires":"2023-02-2800:00:00","discount":50,"purchase_types":[3],"product_ids":[2104],"allowed_for_domain_transfers":false,"allowed_for_renewals":false,"allowed_for_new_purchases":true,"code":"1d1efd26ac357573"}},"jetpack_search_monthly":{"product_id":2105,"product_name":"JetpackSearch","product_slug":"jetpack_search_monthly","description":"","product_type":"search","available":true,"is_domain_registration":false,"cost_display":"A$6.95","combined_cost_display":"A$6.95","cost":6.95,"currency_code":"AUD","price_tier_list":[{"minimum_units":0,"maximum_units":100,"minimum_price":8340,"minimum_price_display":"A$83.40","minimum_price_monthly_display":"A$6.95","maximum_price":8340,"maximum_price_display":"A$83.40","maximum_price_monthly_display":"A$6.95"},{"minimum_units":101,"maximum_units":1000,"minimum_price":16680,"minimum_price_display":"A$166.80","minimum_price_monthly_display":"A$13.90","maximum_price":16680,"maximum_price_display":"A$166.80","maximum_price_monthly_display":"A$13.90"},{"minimum_units":1001,"maximum_units":10000,"minimum_price":41700,"minimum_price_display":"A$417","minimum_price_monthly_display":"A$34.75","maximum_price":41700,"maximum_price_display":"A$417","maximum_price_monthly_display":"A$34.75"},{"minimum_units":10001,"maximum_units":100000,"minimum_price":100080,"minimum_price_display":"A$1,000.80","minimum_price_monthly_display":"A$83.40","maximum_price":100080,"maximum_price_display":"A$1,000.80","maximum_price_monthly_display":"A$83.40"},{"minimum_units":100001,"maximum_units":1000000,"minimum_price":333600,"minimum_price_display":"A$3,336","minimum_price_monthly_display":"A$278","maximum_price":333600,"maximum_price_display":"A$3,336","maximum_price_monthly_display":"A$278"},{"minimum_units":1000001,"maximum_units":null,"minimum_price":667200,"minimum_price_display":"A$6,672","minimum_price_monthly_display":"A$556","maximum_price":0,"maximum_price_display":null,"maximum_price_monthly_display":null}],"price_tier_usage_quantity":null,"product_term":"month","price_tiers":[],"price_tier_slug":""},"jetpack_scan":{"product_id":2106,"product_name":"JetpackScanDaily","product_slug":"jetpack_scan","description":"","product_type":"jetpack","available":true,"is_domain_registration":false,"cost_display":"A$155.40","combined_cost_display":"A$155.40","cost":155.4,"currency_code":"AUD","price_tier_list":[],"price_tier_usage_quantity":null,"product_term":"year","price_tiers":[],"price_tier_slug":"","introductory_offer":{"interval_unit":"year","interval_count":1,"usage_limit":null,"cost_per_interval":59.4,"transition_after_renewal_count":0,"should_prorate_when_offer_ends":false}}}';

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
		if ( strpos( $url, '/jetpack-search/plan' ) !== false ) {
			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => self::PLAN_INFO_FIXTURE,
			);
		}
		if ( strpos( $url, '/search' ) !== false && strpos( $url, 'v1.3/sites/' ) !== false ) {
			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => self::SEARCH_RESULT_FIXTURE,
			);
		}
		if ( strpos( $url, 'v1.1/products' ) !== false ) {
			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => self::WPCOM_PRODUCTS_FIXTURE,
			);
		}
		return $response;
	}
}
