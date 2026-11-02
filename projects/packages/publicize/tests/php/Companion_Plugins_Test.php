<?php
/**
 * Tests for Companion_Plugins.
 *
 * @package automattic/jetpack-publicize
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Publicize;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Class Companion_Plugins_Test
 *
 * @covers \Automattic\Jetpack\Publicize\Companion_Plugins
 */
#[CoversClass( Companion_Plugins::class )]
class Companion_Plugins_Test extends TestCase {

	/**
	 * Log in a new user with the given role.
	 *
	 * @param string $role The role.
	 */
	private function log_in( string $role ): void {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'user_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pass',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * Slugs of the plugins offered to the current user.
	 *
	 * @return string[]
	 */
	private function offered(): array {
		return array_column( Companion_Plugins::get_script_data(), 'slug' );
	}

	/**
	 * Clean up.
	 */
	protected function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Admins are offered both plugins; roles that cannot install plugins get nothing to act on.
	 */
	public function test_offers_plugins_only_to_users_who_can_install_them() {
		$this->log_in( 'administrator' );
		$this->assertSame( array( 'atmosphere', 'activitypub' ), $this->offered() );

		$this->log_in( 'editor' );
		$this->assertSame( array(), $this->offered() );
	}

	/**
	 * An active plugin is not offered again.
	 */
	public function test_skips_active_plugins() {
		update_option( 'active_plugins', array( 'activitypub/activitypub.php' ) );
		$this->log_in( 'administrator' );

		$this->assertSame( array( 'atmosphere' ), $this->offered() );
	}

	/**
	 * A dismissal hides one plugin, for that user only.
	 */
	public function test_dismissal_is_per_plugin_and_per_user() {
		$this->log_in( 'administrator' );
		$this->assertTrue( Companion_Plugins::dismiss( 'atmosphere' ) );
		$this->assertFalse( Companion_Plugins::dismiss( 'not-a-plugin' ) );

		$this->assertSame( array( 'activitypub' ), $this->offered() );
		$this->assertSame( array( 'atmosphere' ), Companion_Plugins::get_dismissed() );

		$this->log_in( 'administrator' );
		$this->assertSame( array( 'atmosphere', 'activitypub' ), $this->offered() );
	}
}
