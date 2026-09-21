<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

class Main_Features_Rest_Test extends TestCase {

	const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . Initializer::FEATURES_TAB_FEATURE_FLAG;

	const ROUTE = '/wpcom/v2/my-jetpack/site/features/plugin';

	/**
	 * A standalone plugin on disk, in the folder the feature map names.
	 */
	const PLUGIN_DIR = WP_PLUGIN_DIR . '/jetpack-boost';

	private $server;

	public function setUp(): void {
		parent::setUp();

		if ( ! file_exists( self::PLUGIN_DIR ) ) {
			mkdir( self::PLUGIN_DIR, 0777, true );
		}
		copy( __DIR__ . '/assets/boost-mock-plugin.txt', self::PLUGIN_DIR . '/jetpack-boost.php' );
		wp_cache_delete( 'plugins', 'plugins' );

		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		add_filter( self::FLAG_FILTER, '__return_true' );

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Initializer::init();
		do_action( 'rest_api_init' );

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'test_admin',
					'user_pass'  => '123',
					'role'       => 'administrator',
				)
			)
		);
	}

	public function tearDown(): void {
		parent::tearDown();

		remove_all_filters( self::FLAG_FILTER );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		unlink( self::PLUGIN_DIR . '/jetpack-boost.php' );
		rmdir( self::PLUGIN_DIR );
		wp_cache_delete( 'plugins', 'plugins' );
	}

	/**
	 * Send one request to the route.
	 *
	 * @param string $plugin The plugin slug.
	 * @param string $action The action.
	 * @return \WP_REST_Response
	 */
	private function send( $plugin, $action ) {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_body_params( compact( 'plugin', 'action' ) );

		return $this->server->dispatch( $request );
	}

	/**
	 * The boost feature's plugin status in a response.
	 *
	 * @param \WP_REST_Response $response The response.
	 * @return string
	 */
	private function boost_status( $response ) {
		return array_column( $response->get_data()['features'], 'plugin_status', 'slug' )['boost'];
	}

	public function test_activates_and_deactivates_a_mapped_plugin() {
		$activated = $this->send( 'jetpack-boost', 'activate' );
		$this->assertSame( 200, $activated->get_status() );
		$this->assertSame( Main_Features::PLUGIN_ACTIVE, $this->boost_status( $activated ) );

		$deactivated = $this->send( 'jetpack-boost', 'deactivate' );
		$this->assertSame( 200, $deactivated->get_status() );
		$this->assertSame( Main_Features::PLUGIN_INACTIVE, $this->boost_status( $deactivated ) );
	}

	/**
	 * Switching a plugin on has to run the product's own activation step too, or a
	 * product that needs more than its plugin comes up half on.
	 */
	public function test_runs_the_products_own_activation_step() {
		// Boost writes this option from do_product_specific_activation() and nowhere else.
		// Watching the write rather than the value, which is false either way.
		$written = 0;
		add_filter(
			'pre_update_option_jb_get_started',
			function ( $value ) use ( &$written ) {
				++$written;
				return $value;
			}
		);

		$this->send( 'jetpack-boost', 'activate' );
		remove_all_filters( 'pre_update_option_jb_get_started' );

		$this->assertSame( 1, $written );
	}

	public function test_refuses_a_plugin_the_map_does_not_name() {
		$response = $this->send( 'hello-dolly', 'activate' );

		// The enum is what confines this route to the map, so assert the argument was
		// rejected rather than the 400 an uninstalled plugin would earn anyway.
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * Installing is a bigger act than switching, so it takes a capability of its own.
	 */
	public function test_forbids_installing_without_the_capability() {
		$deny = function ( $caps ) {
			$caps['install_plugins'] = false;
			return $caps;
		};
		add_filter( 'user_has_cap', $deny );

		$response = $this->send( 'jetpack-boost', 'install' );

		remove_filter( 'user_has_cap', $deny );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'not_allowed', $response->get_data()['code'] );
	}

	/**
	 * A module that refuses to switch on does not undo the plugin that is now active, so
	 * the route reports the state rather than an error the caller would retry forever.
	 */
	public function test_a_failed_module_activation_does_not_fail_the_plugin_action() {
		add_filter( 'jetpack_get_available_standalone_modules', '__return_empty_array' );

		$response = $this->send( 'jetpack-boost', 'activate' );

		remove_filter( 'jetpack_get_available_standalone_modules', '__return_empty_array' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( Main_Features::PLUGIN_ACTIVE, $this->boost_status( $response ) );
	}

	public function test_refuses_to_deactivate_jetpack() {
		$response = $this->send( 'jetpack', 'deactivate' );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'not_allowed', $response->get_data()['code'] );
	}

	public function test_forbids_users_who_cannot_activate_plugins() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'test_editor',
					'user_pass'  => '123',
					'role'       => 'editor',
				)
			)
		);

		$this->assertSame( 403, $this->send( 'jetpack-boost', 'activate' )->get_status() );
	}
}
