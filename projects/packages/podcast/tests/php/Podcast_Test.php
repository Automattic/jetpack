<?php
/**
 * Tests for the Podcast loader class.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Podcast;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * @covers \Automattic\Jetpack\Podcast\Podcast
 */
#[CoversClass( Podcast::class )]
class Podcast_Test extends BaseTestCase {

	protected function tearDown(): void {
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		remove_all_filters( 'jetpack_posts_to_podcast' );
		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
		WorDBless_Options::init()->clear_options();
		parent::tearDown();
	}

	/**
	 * `init()` wires the full package on any host without erroring.
	 */
	public function test_init_wires_cleanly_on_non_wpcom_host() {
		Podcast::init();
		$this->expectNotToPerformAssertions();
	}

	/**
	 * `PACKAGE_VERSION` is exposed for the changelogger version-constants
	 * mapping declared in `composer.json`.
	 */
	public function test_package_version_constant_is_defined() {
		$this->assertNotEmpty( Podcast::PACKAGE_VERSION );
	}

	/**
	 * Posts to Podcast should be public for connected users without requiring
	 * the request to come through the A8C proxy.
	 */
	public function test_posts_to_podcast_is_enabled_for_connected_user_without_proxied_request() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'posts_to_podcast_connected_user',
				'user_pass'  => 'password',
			)
		);
		wp_set_current_user( $user_id );
		\Jetpack_Options::update_option(
			'user_tokens',
			array(
				$user_id => 'token.secret.' . $user_id,
			)
		);

		$_SERVER['A8C_PROXIED_REQUEST'] = '0';

		$this->assertTrue( Podcast::is_posts_to_podcast_enabled() );
	}
}
