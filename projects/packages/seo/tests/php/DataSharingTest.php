<?php
/**
 * Tests for the WordPress.com consent settings boundary.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/** @covers \Automattic\Jetpack\SEO\Data_Sharing */
#[CoversClass( Data_Sharing::class )]
class DataSharingTest extends SeoTestCase {
	/** @var array Original option values. */
	private $previous;

	/** @var int Original current user. */
	private $previous_user;

	protected function setUp(): void {
		parent::setUp();
		$this->previous_user = get_current_user_id();
		Cache::clear();
		foreach ( array( 'blog_public', 'wpcom_data_sharing_opt_out', 'wpcom_public_coming_soon', Ai_Crawlers::OPTION ) as $key ) {
			$this->previous[ $key ] = get_option( $key, null );
		}
	}

	protected function tearDown(): void {
		foreach ( $this->previous as $key => $value ) {
			if ( null === $value ) {
				delete_option( $key );
			} else {
				update_option( $key, $value );
			}
		}
		wp_set_current_user( $this->previous_user );
		Cache::clear();
		parent::tearDown();
	}

	/**
	 * Consent cannot bypass privacy or indexing restrictions.
	 *
	 * @dataProvider restricted_visibility
	 * @param int $public Visibility option.
	 */
	#[DataProvider( 'restricted_visibility' )]
	public function test_locked_consent_does_not_change_visibility_or_preferences( $public ) {
		update_option( 'blog_public', $public );
		update_option( 'wpcom_data_sharing_opt_out', false );
		update_option(
			Ai_Crawlers::OPTION,
			array(
				'answer'   => array( 'perplexitybot' ),
				'training' => array( 'gptbot' ),
			)
		);
		$request = new \WP_REST_Request( 'POST' );
		$request->set_param( 'prevent_sharing', false );
		$result = Data_Sharing::save( $request );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'seo_sharing_visibility_locked', $result->get_error_code() );
		$this->assertSame( $public, (int) get_option( 'blog_public' ) );
		$this->assertFalse( (bool) get_option( 'wpcom_data_sharing_opt_out' ) );
		$this->assertSame(
			array(
				'answer'   => array( 'perplexitybot' ),
				'training' => array( 'gptbot' ),
			),
			get_option( Ai_Crawlers::OPTION )
		);
		$this->assertTrue( Data_Sharing::get_status()['locked'] );
	}

	/** @return array Visibility values that must lock the control. */
	public static function restricted_visibility() {
		return array(
			'discouraged' => array( 0 ),
			'private'     => array( -1 ),
		);
	}

	/** A self-hosted site must not receive a platform-only write route. */
	public function test_self_hosted_sites_have_no_consent_route() {
		$server                    = new \WP_REST_Server();
		$prior                     = $GLOBALS['wp_rest_server'] ?? null;
		$GLOBALS['wp_rest_server'] = $server;
		try {
			Data_Sharing::register_routes();
			$this->assertArrayNotHasKey( '/jetpack/v4/seo/data-sharing', $server->get_routes() );
		} finally {
			$GLOBALS['wp_rest_server'] = $prior;
		}
	}

	/**
	 * Only settings administrators may reach the consent writer.
	 *
	 * @dataProvider route_users
	 * @param string $role User role, or anonymous.
	 * @param int    $expected Expected response status.
	 */
	#[DataProvider( 'route_users' )]
	public function test_simple_route_requires_site_settings_permission( $role, $expected ) {
		Constants::set_constant( 'IS_WPCOM', true );
		$prior                     = $GLOBALS['wp_rest_server'] ?? null;
		$GLOBALS['wp_rest_server'] = new \WP_REST_Server();
		$user                      = 'anonymous' === $role ? 0 : wp_insert_user(
			array(
				'user_login' => 'sharing-' . wp_generate_uuid4(),
				'user_pass'  => wp_generate_password(),
				'role'       => $role,
			)
		);
		wp_set_current_user( $user );
		update_option( 'blog_public', 0 );
		try {
			add_action( 'rest_api_init', array( Data_Sharing::class, 'register_routes' ) );
			do_action( 'rest_api_init' );
			$request = new \WP_REST_Request( 'POST', '/jetpack/v4/seo/data-sharing' );
			$request->set_param( 'prevent_sharing', false );
			$response = rest_do_request( $request );
			$this->assertSame( $expected, $response->get_status() );
		} finally {
			remove_action( 'rest_api_init', array( Data_Sharing::class, 'register_routes' ) );
			Constants::clear_single_constant( 'IS_WPCOM' );
			if ( $user ) {
				wp_delete_user( $user );
			}
			$GLOBALS['wp_rest_server'] = $prior;
		}
	}

	/** @return array Roles distinguish authentication, authorization, and controller execution. */
	public static function route_users() {
		return array(
			'anonymous'                                  => array( 'anonymous', 401 ),
			'subscriber'                                 => array( 'subscriber', 403 ),
			'editor'                                     => array( 'editor', 403 ),
			'administrator reaches the visibility guard' => array( 'administrator', 409 ),
		);
	}

	/** Both saved consent values remain editable on an unrestricted public site. */
	public function test_public_consent_reports_saved_preference_separately_from_restrictions() {
		update_option( 'blog_public', 1 );
		update_option( 'wpcom_public_coming_soon', false );
		foreach ( array( false, true ) as $value ) {
			update_option( 'wpcom_data_sharing_opt_out', $value );
			$this->assertSame( $value, Data_Sharing::get_status()['prevent_sharing'] );
			$this->assertFalse( Data_Sharing::get_status()['locked'] );
		}
	}

	/** Coming Soon forces effective protection without rewriting saved consent. */
	public function test_coming_soon_prevents_writes_without_overwriting_saved_consent() {
		update_option( 'blog_public', 1 );
		update_option( 'wpcom_public_coming_soon', true );
		update_option( 'wpcom_data_sharing_opt_out', false );
		Cache::clear();
		$request = new \WP_REST_Request( 'POST' );
		$request->set_param( 'prevent_sharing', true );
		$result = Data_Sharing::save( $request );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'seo_sharing_visibility_locked', $result->get_error_code() );
		$this->assertTrue( (bool) get_option( 'wpcom_public_coming_soon' ) );
		$this->assertSame( 1, (int) get_option( 'blog_public' ) );
		$this->assertFalse( (bool) get_option( 'wpcom_data_sharing_opt_out' ) );
	}

	/** A restricted hosting subdomain keeps its underlying consent preference intact. */
	public function test_restricted_staging_host_locks_the_control_without_overwriting_consent() {
		update_option( 'blog_public', 1 );
		update_option( 'wpcom_data_sharing_opt_out', false );
		$staging = static function () {
			return 'https://sharing-test.wpcomstaging.com';
		};
		add_filter( 'pre_option_home', $staging );
		try {
			$this->assertTrue( Data_Sharing::get_status()['locked'] );
			$this->assertFalse( Data_Sharing::get_status()['prevent_sharing'] );
		} finally {
			remove_filter( 'pre_option_home', $staging );
		}
	}
}
