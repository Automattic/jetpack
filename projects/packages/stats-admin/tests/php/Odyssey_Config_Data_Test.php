<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;

/**
 * Unit tests for the Odyssey_Config_Data class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Odyssey_Config_Data_Test extends Stats_TestCase {
	/**
	 * Test configData set to JS.
	 */
	public function test_render_config_data() {
		$config_data = new Odyssey_Config_Data();
		$this->assertTrue( strpos( $config_data->get_js_config_data(), 'window.configData' ) === 0 );
	}

	/**
	 * Test configData set to JS.
	 */
	public function test_render_config_data_with_param() {
		$config_data = new Odyssey_Config_Data();
		$this->assertTrue( strpos( $config_data->get_js_config_data( 'configData', array( 'testtesttest' ) ), 'window.configData' ) === 0 );
		$this->assertTrue( strpos( $config_data->get_js_config_data( 'configData', array( 'testtesttest' ) ), 'testtesttest' ) > 0 );
	}

	/**
	 * The app paywalls on the feature list printed here and has no route to refresh it, so a site
	 * that can answer for itself must not be described by a plan it cached before its last
	 * purchase. See STATS-475.
	 */
	public function test_config_data_features_come_from_the_site_itself_on_atomic() {
		update_option( Current_Plan::PLAN_OPTION, array( 'product_slug' => 'jetpack_free' ), true );
		$this->make_site_atomic();

		$data = ( new Odyssey_Config_Data() )->get_data();

		$this->assertSame(
			array( 'stats-paid', 'support' ),
			$data['intial_state']['sites']['features']['999']['data']['active']
		);
	}

	/**
	 * A registry with nothing in it cannot be told apart from a site that bought nothing, so the
	 * cached plan is still the better answer.
	 */
	public function test_config_data_features_fall_back_when_the_registry_has_no_purchases() {
		update_option(
			Current_Plan::PLAN_OPTION,
			array(
				'product_slug' => 'personal-bundle',
				'features'     => array( 'active' => array( 'stats-paid' ) ),
			),
			true
		);
		$this->make_site_atomic();
		$GLOBALS['wpcom_test_site_purchases'] = array();

		$data = ( new Odyssey_Config_Data() )->get_data();

		$this->assertSame(
			array( 'stats-paid' ),
			$data['intial_state']['sites']['features']['999']['data']['active']
		);
	}

	/**
	 * A site carrying no WordPress.com feature registry has only its cached plan to go on.
	 */
	public function test_config_data_features_fall_back_to_the_cached_plan() {
		update_option(
			Current_Plan::PLAN_OPTION,
			array(
				'product_slug' => 'personal-bundle',
				'features'     => array( 'active' => array( 'stats-paid' ) ),
			),
			true
		);

		$data = ( new Odyssey_Config_Data() )->get_data();

		$this->assertSame(
			array( 'stats-paid' ),
			$data['intial_state']['sites']['features']['999']['data']['active']
		);
	}

	/**
	 * Test config_data has all necessary keys.
	 */
	public function test_config_data() {
		$config_data = new Odyssey_Config_Data();
		$data        = $config_data->get_data();
		$this->assertArrayHasKey( 'admin_page_base', $data );
		$this->assertArrayHasKey( 'api_root', $data );
		$this->assertArrayHasKey( 'blog_id', $data );
		$this->assertArrayHasKey( 'env_id', $data );
		$this->assertArrayHasKey( 'google_analytics_key', $data );
		$this->assertArrayHasKey( 'google_maps_and_places_api_key', $data );
		$this->assertArrayHasKey( 'i18n_default_locale_slug', $data );
		$this->assertArrayHasKey( 'nonce', $data );
		$this->assertArrayHasKey( 'site_name', $data );
		$this->assertArrayHasKey( 'intial_state', $data );
		$this->assertArrayHasKey( 'is_running_in_jetpack_site', $data['features'] );
	}

	/**
	 * The app reads the versions from the site record when there is one, so they have to be
	 * available on their own for the site that has none.
	 */
	public function test_config_data_carries_versions_outside_the_site_record() {
		$data = ( new Odyssey_Config_Data() )->get_data();

		$this->assertArrayHasKey( 'jetpack_version', $data );
		$this->assertArrayHasKey( 'stats_admin_version', $data );
		$this->assertArrayHasKey( 'software_version', $data );
		$this->assertSame(
			$data['intial_state']['sites']['items']['999']['options']['admin_url'],
			$data['admin_url']
		);
		$this->assertSame(
			$data['intial_state']['sites']['items']['999']['options']['stats_admin_version'],
			$data['stats_admin_version']
		);
	}

	/**
	 * A site that disconnects keeps its blog ID, but the app cannot sign a single request with
	 * it, so it has to be told there is no site rather than handed one that does not work.
	 */
	public function test_config_data_when_a_connected_site_disconnects() {
		$this->disconnect_site_keeping_blog_id();

		$data = ( new Odyssey_Config_Data() )->get_data();

		$this->assertSame( 0, $data['blog_id'] );
		$this->assertArrayNotHasKey( 'intial_state', $data );
	}

	/**
	 * Keep a registered site's identity when its token is malformed. The traffic request
	 * reports the connection failure; dropping the ID would send paid sites to plan selection.
	 */
	public function test_config_data_with_invalid_blog_token() {
		$this->use_invalid_blog_token();

		$data = ( new Odyssey_Config_Data() )->get_data();

		$this->assertSame( 999, $data['blog_id'] );
		$this->assertArrayHasKey( '999', $data['intial_state']['sites']['items'] );
	}

	/**
	 * Without a connection there is no site to describe, and a record keyed on a blog ID of 0
	 * would only make every lookup in the app miss.
	 */
	public function test_config_data_without_a_connection() {
		$this->disconnect_site();

		$data = ( new Odyssey_Config_Data() )->get_data();

		$this->assertSame( 0, $data['blog_id'] );
		$this->assertArrayNotHasKey( 'intial_state', $data );
		$this->assertArrayHasKey( 'api_root', $data );
		$this->assertArrayHasKey( 'nonce', $data );
		$this->assertArrayHasKey( 'admin_url', $data );
		$this->assertArrayHasKey( 'stats_admin_version', $data );
	}
}
