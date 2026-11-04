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
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
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
	 * ATmosphere's offer off Simple, where it needs PHP 8.2. The CI matrix runs both sides of that line.
	 *
	 * @param string $action The action.
	 * @return array<string, string>
	 */
	private static function atmosphere( string $action ): array {
		return PHP_VERSION_ID >= 80200 ? array( 'atmosphere' => $action ) : array();
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
		remove_all_filters( 'map_meta_cap' );
		if ( file_exists( WP_PLUGIN_DIR . '/activitypub/activitypub.php' ) ) {
			unlink( WP_PLUGIN_DIR . '/activitypub/activitypub.php' );
			rmdir( WP_PLUGIN_DIR . '/activitypub' );
		}
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
				self::atmosphere( 'install' ) + array( 'activitypub' => 'install' ),
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

		$this->assertSame( $expected, Companion_Plugins::get_script_data() );
	}

	/**
	 * A plugin already on disk is activated, unless the user cannot manage plugins at all.
	 *
	 * @param bool        $can_manage Whether the user keeps `activate_plugins`, which wpcomsh denies on plans without plugins.
	 * @param string|null $expected   The ActivityPub action.
	 * @dataProvider provide_installed_plugin
	 */
	#[DataProvider( 'provide_installed_plugin' )]
	public function test_activates_an_installed_plugin( bool $can_manage, ?string $expected ) {
		// `wp_mkdir_p()` refuses WorDBless's `WP_PLUGIN_DIR`, which contains `../`.
		wp_mkdir_p( realpath( WP_PLUGIN_DIR ) . '/activitypub' );
		file_put_contents( WP_PLUGIN_DIR . '/activitypub/activitypub.php', '<?php' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( ! $can_manage ) {
			add_filter(
				'map_meta_cap',
				static function ( $caps, $cap ) {
					return 'activate_plugins' === $cap ? array( 'do_not_allow' ) : $caps;
				},
				10,
				2
			);
		}
		$this->log_in( 'administrator' );

		$this->assertSame( $expected, Companion_Plugins::get_script_data()['activitypub'] ?? null );
	}

	/**
	 * Whether the user can manage plugins, and the action offered for an installed plugin.
	 *
	 * @return array<string, array{bool, string|null}>
	 */
	public static function provide_installed_plugin(): array {
		return array(
			'admin activates it'            => array( true, 'activate' ),
			'plan without plugins hides it' => array( false, null ),
		);
	}

	/**
	 * An active plugin is not offered again, however it was loaded (network, WordPress.com bundle).
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_skips_active_plugins() {
		define( 'ACTIVITYPUB_PLUGIN_VERSION', '1.0.0' );
		$this->log_in( 'administrator' );

		$this->assertSame( self::atmosphere( 'install' ), Companion_Plugins::get_script_data() );
	}

	/**
	 * A dismissal hides one plugin, for that user and that site only.
	 */
	public function test_dismissal_is_per_plugin_user_and_site() {
		global $wpdb;

		$user_id = $this->log_in( 'administrator' );
		Companion_Plugins::dismiss( 'atmosphere' );

		$this->assertSame( array( 'activitypub' => 'install' ), Companion_Plugins::get_script_data() );
		// Stored under the site's prefix, so on a network it does not follow the user to their other sites.
		$this->assertSame( array( 'atmosphere' ), get_user_meta( $user_id, $wpdb->get_blog_prefix() . Companion_Plugins::DISMISSED_OPTION, true ) );

		$this->log_in( 'administrator' );
		$this->assertSame( self::atmosphere( 'install' ) + array( 'activitypub' => 'install' ), Companion_Plugins::get_script_data() );
	}
}
