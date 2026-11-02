<?php
/**
 * Tests for Companion_Plugins.
 *
 * @package automattic/jetpack-publicize
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use ReflectionProperty;
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
	 * @return int The user ID.
	 */
	private function log_in( string $role ): int {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'user_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pass',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * The offered plugins, as slug => action.
	 *
	 * @return array<string, string>
	 */
	private function offered(): array {
		$plugins = Companion_Plugins::get_script_data();

		return array_combine( array_column( $plugins, 'slug' ), array_column( $plugins, 'action' ) );
	}

	/**
	 * Empty Current_Plan's per-request cache.
	 */
	private function reset_plan_cache(): void {
		$cache = new ReflectionProperty( Current_Plan::class, 'active_plan_cache' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$cache->setAccessible( true );
		}
		$cache->setValue( null, null );
	}

	/**
	 * Clean up.
	 */
	protected function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );
		Constants::clear_constants();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
		$this->reset_plan_cache();
	}

	/**
	 * Sites and roles, and what each is offered.
	 *
	 * @return array<string, array{bool, string[], string, array<string, string>}>
	 */
	public static function provide_sites(): array {
		return array(
			'self-hosted admin installs both'            => array(
				false,
				array(),
				'administrator',
				array(
					'atmosphere'  => 'install',
					'activitypub' => 'install',
				),
			),
			'self-hosted editor cannot install'          => array( false, array(), 'editor', array() ),
			'Simple turns ActivityPub on, no ATmosphere' => array( true, array(), 'administrator', array( 'activitypub' => 'enable' ) ),
			'Simple with plugins installs from WP.com'   => array(
				true,
				array( 'install-plugins' ),
				'administrator',
				array(
					'atmosphere'  => 'marketplace',
					'activitypub' => 'enable',
				),
			),
			'Simple editor cannot turn either on'        => array( true, array( 'install-plugins' ), 'editor', array() ),
		);
	}

	/**
	 * Each platform offers the plugins the user can actually turn on, the way that platform turns them on.
	 *
	 * @param bool                  $is_simple Whether the site is WordPress.com Simple.
	 * @param string[]              $features  The plan's features.
	 * @param string                $role      The user's role.
	 * @param array<string, string> $expected  Slug => action.
	 * @dataProvider provide_sites
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_offers_what_the_user_can_turn_on( bool $is_simple, array $features, string $role, array $expected ) {
		if ( $is_simple ) {
			Constants::set_constant( 'IS_WPCOM', true );
		}
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'test',
				'features'     => array( 'active' => $features ),
			)
		);
		$this->reset_plan_cache();
		$this->log_in( $role );

		$this->assertSame( $expected, $this->offered() );
	}

	/**
	 * An active plugin is not offered again.
	 */
	public function test_skips_active_plugins() {
		update_option( 'active_plugins', array( 'activitypub/activitypub.php' ) );
		$this->log_in( 'administrator' );

		$this->assertSame( array( 'atmosphere' => 'install' ), $this->offered() );
	}

	/**
	 * A dismissal hides one plugin, for that user only.
	 */
	public function test_dismissal_is_per_plugin_and_per_user() {
		$this->log_in( 'administrator' );
		$this->assertTrue( Companion_Plugins::dismiss( 'atmosphere' ) );
		$this->assertFalse( Companion_Plugins::dismiss( 'not-a-plugin' ) );

		$this->assertSame( array( 'activitypub' => 'install' ), $this->offered() );

		$this->log_in( 'administrator' );
		$this->assertSame(
			array(
				'atmosphere'  => 'install',
				'activitypub' => 'install',
			),
			$this->offered()
		);
	}

	/**
	 * A dismissal is stored per site, so on a network it does not follow the user to their other sites.
	 */
	public function test_dismissal_is_stored_per_site() {
		global $wpdb;

		$user_id = $this->log_in( 'administrator' );
		Companion_Plugins::dismiss( 'atmosphere' );

		$this->assertSame( array( 'atmosphere' ), get_user_meta( $user_id, $wpdb->get_blog_prefix() . Companion_Plugins::DISMISSED_OPTION, true ) );
		$this->assertSame( '', get_user_meta( $user_id, Companion_Plugins::DISMISSED_OPTION, true ) );
	}
}
