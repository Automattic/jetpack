<?php
/**
 * Tests for the site launch "Publish" copy experiment.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/common/site-launch-publish-copy.php';

/**
 * Class Site_Launch_Publish_Copy_Test
 */
class Site_Launch_Publish_Copy_Test extends \WorDBless\BaseTestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Set up each test.
	 */
	public function set_up() {
		parent::set_up();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'publish_copy_admin',
				'user_pass'  => 'password',
				'user_email' => 'publish_copy_admin@example.com',
				'role'       => 'administrator',
			)
		);
	}

	/**
	 * Tear down each test.
	 */
	public function tear_down() {
		remove_all_filters( 'wpcom_site_launch_publish_copy_override_is_treatment' );
		delete_transient( $this->get_cache_key() );
		delete_option( 'launch-status' );
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * The override filter forces either arm.
	 */
	public function test_override_forces_the_arm() {
		add_filter( 'wpcom_site_launch_publish_copy_override_is_treatment', '__return_true' );
		$this->assertTrue( wpcom_site_launch_uses_publish_copy() );

		remove_all_filters( 'wpcom_site_launch_publish_copy_override_is_treatment' );
		add_filter( 'wpcom_site_launch_publish_copy_override_is_treatment', '__return_false' );
		$this->assertFalse( wpcom_site_launch_uses_publish_copy() );
	}

	/**
	 * A logged-out visitor gets the control.
	 */
	public function test_logged_out_visitor_gets_control() {
		update_option( 'launch-status', 'unlaunched' );

		$this->assertFalse( wpcom_site_launch_resolve_publish_copy( true ) );
	}

	/**
	 * An admin of a launched site gets the control, and is not assigned.
	 */
	public function test_launched_site_gets_control() {
		wp_set_current_user( $this->admin_id );
		update_option( 'launch-status', 'launched' );
		set_transient( $this->get_cache_key(), 1, HOUR_IN_SECONDS );

		$this->assertFalse( wpcom_site_launch_resolve_publish_copy( true ) );
	}

	/**
	 * A cached treatment assignment is reused.
	 */
	public function test_cached_treatment_is_reused() {
		wp_set_current_user( $this->admin_id );
		update_option( 'launch-status', 'unlaunched' );
		set_transient( $this->get_cache_key(), 1, HOUR_IN_SECONDS );

		$this->assertTrue( wpcom_site_launch_resolve_publish_copy( true ) );
	}

	/**
	 * A cached control assignment is reused.
	 */
	public function test_cached_control_is_reused() {
		wp_set_current_user( $this->admin_id );
		update_option( 'launch-status', 'unlaunched' );
		set_transient( $this->get_cache_key(), 0, HOUR_IN_SECONDS );

		$this->assertFalse( wpcom_site_launch_resolve_publish_copy( true ) );
	}

	/**
	 * A user who can't launch the site gets the control, even with a cached treatment.
	 */
	public function test_user_who_cannot_launch_gets_control() {
		$editor_id = wp_insert_user(
			array(
				'user_login' => 'publish_copy_editor',
				'user_pass'  => 'password',
				'user_email' => 'publish_copy_editor@example.com',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $editor_id );
		update_option( 'launch-status', 'unlaunched' );
		set_transient( 'wpcom-site-launch-publish-copy-' . $editor_id . '-' . WPCOM_SITE_LAUNCH_PUBLISH_COPY_EXPERIMENT, 1, HOUR_IN_SECONDS );

		$this->assertFalse( wpcom_site_launch_resolve_publish_copy( true ) );
	}

	/**
	 * A peek reads a cached assignment.
	 */
	public function test_peek_reads_the_cached_assignment() {
		wp_set_current_user( $this->admin_id );
		update_option( 'launch-status', 'unlaunched' );
		set_transient( $this->get_cache_key(), 1, HOUR_IN_SECONDS );

		$this->assertTrue( wpcom_site_launch_resolve_publish_copy( false ) );
	}

	/**
	 * A peek later in the same request sees the assignment made earlier in it.
	 */
	public function test_peek_after_assign_sees_the_assignment() {
		wp_set_current_user( $this->admin_id );
		update_option( 'launch-status', 'unlaunched' );
		set_transient( $this->get_cache_key(), 1, HOUR_IN_SECONDS );

		$this->assertTrue( wpcom_site_launch_uses_publish_copy() );

		delete_transient( $this->get_cache_key() );
		$this->assertTrue( wpcom_site_launch_peek_publish_copy() );
	}

	/**
	 * Without an answer from ExPlat, the user gets the control and nothing is cached.
	 */
	public function test_unanswered_assignment_is_not_cached() {
		wp_set_current_user( $this->admin_id );
		update_option( 'launch-status', 'unlaunched' );

		$this->assertFalse( wpcom_site_launch_resolve_publish_copy( true ) );
		$this->assertFalse( get_transient( $this->get_cache_key() ) );
	}

	/**
	 * On Atomic, the assignment comes from the calypso platform's endpoint, where the experiment is registered.
	 */
	public function test_atomic_assignment_asks_the_calypso_platform() {
		wp_set_current_user( $this->admin_id );
		update_option( 'launch-status', 'unlaunched' );
		\Jetpack_Options::update_option( 'id', 12345 );
		\Jetpack_Options::update_option( 'blog_token', 'blog.token' );
		\Jetpack_Options::update_option( 'user_tokens', array( $this->admin_id => "token.secret.{$this->admin_id}" ) );
		Connection_Utils::init_default_constants();

		$requested_url = null;
		$answer        = static function ( $preempt, $args, $url ) use ( &$requested_url ) {
			$requested_url = $url;
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( array( 'variations' => array( WPCOM_SITE_LAUNCH_PUBLISH_COPY_EXPERIMENT => 'treatment' ) ), JSON_UNESCAPED_SLASHES ),
			);
		};
		add_filter( 'pre_http_request', $answer, 10, 3 );

		try {
			$this->assertTrue( wpcom_site_launch_resolve_publish_copy( true ) );
			$this->assertStringContainsString( '/experiments/0.1.0/assignments/calypso', (string) $requested_url );
			$this->assertSame( 1, (int) get_transient( $this->get_cache_key() ) );
		} finally {
			remove_filter( 'pre_http_request', $answer, 10 );
			\Jetpack_Options::delete_option( 'id' );
			\Jetpack_Options::delete_option( 'blog_token' );
			\Jetpack_Options::delete_option( 'user_tokens' );
		}
	}

	/**
	 * The transient key for the admin's assignment.
	 *
	 * @return string
	 */
	private function get_cache_key() {
		return 'wpcom-site-launch-publish-copy-' . $this->admin_id . '-' . WPCOM_SITE_LAUNCH_PUBLISH_COPY_EXPERIMENT;
	}
}
