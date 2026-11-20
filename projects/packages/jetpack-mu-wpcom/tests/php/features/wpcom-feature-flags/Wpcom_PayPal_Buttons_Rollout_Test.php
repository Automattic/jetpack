<?php
/**
 * Tests for the PayPal API-managed buttons rollout on WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Covers the precedence: kill switch, then the per-site override, then the rollout default.
 *
 * Tests run on the hooks the package bootstrap adds, and set the percent and the kill switch themselves,
 * so they pass at any shipped PERCENT or KILLED.
 */
class Wpcom_PayPal_Buttons_Rollout_Test extends \WorDBless\BaseTestCase {

	/**
	 * The flag the paypal-payments package registers. A literal, so renaming the class constant fails here.
	 */
	const FLAG = 'paypal-payments-api-managed-buttons';

	/**
	 * The kill switch network option, set by name on WordPress.com. A literal, so renaming the class constant fails here.
	 */
	const KILL_SWITCH_OPTION = 'wpcom_paypal_buttons_kill_switch';

	/**
	 * Each blog's bucket: crc32( 'paypal-payments-api-managed-buttons:' . $blog_id ) % 100.
	 */
	const BUCKETS = array(
		1   => 14,
		100 => 75,
	);

	/**
	 * The rollout's hook priorities as the package bootstrap wired them.
	 *
	 * @var array<string, int|false>
	 */
	private static $bootstrap_wiring = array();

	/**
	 * The blog id the test started on, restored by tear_down().
	 *
	 * @var int
	 */
	private $original_blog_id;

	/**
	 * Record the hook priorities the package bootstrap wired.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$bootstrap_wiring = array(
			'rollout' => has_filter( 'jetpack_feature_flag_enabled', array( Wpcom_PayPal_Buttons_Rollout::class, 'rollout_default' ) ),
			'kill'    => has_filter( 'jetpack_feature_flag_enabled_' . self::FLAG, array( Wpcom_PayPal_Buttons_Rollout::class, 'apply_kill_switch' ) ),
		);
	}

	/**
	 * Remember the blog context, which most tests change.
	 */
	public function set_up() {
		parent::set_up();

		$this->original_blog_id = $GLOBALS['blog_id'];
	}

	/**
	 * Reset the global state these tests touch.
	 */
	public function tear_down() {
		Constants::clear_constants();
		$GLOBALS['blog_id'] = $this->original_blog_id;
		delete_option( Wpcom_Feature_Flags::OVERRIDES_OPTION );
		delete_site_option( self::KILL_SWITCH_OPTION );
		Wpcom_Feature_Flags::reset_overrides_cache();
		remove_all_filters( 'wpcom_paypal_buttons_rollout_percent' );
		remove_all_filters( 'wpcom_paypal_buttons_kill_switch' );
		Feature_Flags::reset();
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Register the flag and set up the site.
	 *
	 * @param bool      $registered_default The flag's registered default.
	 * @param int       $blog_id            The current blog.
	 * @param int       $percent            The rollout percent.
	 * @param bool      $atomic             Whether the site is Atomic.
	 * @param bool|null $override           The site's Tools > Feature Flags override, or null for none.
	 * @param bool      $killed             True sets the kill option, false forces the kill switch off.
	 */
	private function given( $registered_default, $blog_id, $percent, $atomic = false, $override = null, $killed = false ) {
		Feature_Flags::register( self::FLAG, array( 'default' => $registered_default ) );
		$GLOBALS['blog_id'] = $blog_id;
		remove_all_filters( 'wpcom_paypal_buttons_rollout_percent' );
		add_filter(
			'wpcom_paypal_buttons_rollout_percent',
			static function () use ( $percent ) {
				return $percent;
			}
		);
		if ( $atomic ) {
			Constants::set_constant( 'IS_ATOMIC', true );
		}
		if ( null !== $override ) {
			update_option( Wpcom_Feature_Flags::OVERRIDES_OPTION, array( self::FLAG => $override ) );
		}
		remove_all_filters( 'wpcom_paypal_buttons_kill_switch' );
		if ( $killed ) {
			update_site_option( self::KILL_SWITCH_OPTION, '1' );
		} else {
			add_filter( 'wpcom_paypal_buttons_kill_switch', '__return_false' );
		}
	}

	/**
	 * Cross each case with both registered defaults, which must give the same answer.
	 *
	 * @param array<string, array> $cases Cases without the registered default.
	 * @return array<string, array>
	 */
	private static function with_both_defaults( array $cases ) {
		$crossed = array();
		foreach ( $cases as $name => $case ) {
			$crossed[ "$name, registered off" ] = array_merge( array( false ), $case );
			$crossed[ "$name, registered on" ]  = array_merge( array( true ), $case );
		}
		return $crossed;
	}

	/**
	 * The default runs before the override, and the kill switch runs last on the flag's own hook.
	 */
	public function test_package_bootstrap_wires_the_rollout() {
		$this->assertSame(
			array(
				'rollout' => 5,
				'kill'    => PHP_INT_MAX,
			),
			self::$bootstrap_wiring
		);
	}

	/**
	 * A Simple site turns on once the percent passes its bucket.
	 * Runs as an administrator, and test_precedence() runs logged out, so a bucket that reads the user id or favors admins fails one of them.
	 *
	 * @dataProvider provide_blog_ids
	 *
	 * @param int $blog_id The current blog.
	 */
	#[DataProvider( 'provide_blog_ids' )]
	public function test_simple_site_turns_on_once_the_percent_passes_its_bucket( $blog_id ) {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'paypal-admin',
					'user_pass'  => 'password',
					'user_email' => 'paypal-admin@example.com',
					'role'       => 'administrator',
				)
			)
		);
		$expected = array();
		$actual   = array();
		for ( $percent = 0; $percent <= 100; $percent++ ) {
			$this->given( false, $blog_id, $percent );
			$expected[ $percent ] = $percent > self::BUCKETS[ $blog_id ];
			$actual[ $percent ]   = Feature_Flags::is_enabled( self::FLAG );
		}

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Data for test_simple_site_turns_on_once_the_percent_passes_its_bucket().
	 *
	 * @return array<string, array{int}>
	 */
	public static function provide_blog_ids() {
		$cases = array();
		foreach ( array_keys( self::BUCKETS ) as $blog_id ) {
			$cases[ "blog $blog_id" ] = array( $blog_id );
		}
		return $cases;
	}

	/**
	 * Each layer of the precedence against the layers below it.
	 *
	 * @dataProvider provide_precedence
	 *
	 * @param bool      $registered_default The flag's registered default.
	 * @param bool      $atomic             Whether the site is Atomic.
	 * @param int       $blog_id            The current blog.
	 * @param int       $percent            The rollout percent.
	 * @param bool|null $override           The site's Tools > Feature Flags override, or null for none.
	 * @param bool      $killed             Whether the kill switch is on.
	 * @param bool      $expected           Whether the flag should be on.
	 * @param string    $merchant_id        The connected PayPal merchant id, or '' for none.
	 */
	#[DataProvider( 'provide_precedence' )]
	public function test_precedence( $registered_default, $atomic, $blog_id, $percent, $override, $killed, $expected, $merchant_id = '' ) {
		if ( $merchant_id ) {
			update_option( 'jetpack_paypal_payment_buttons_merchant_id', $merchant_id );
		}
		$this->given( $registered_default, $blog_id, $percent, $atomic, $override, $killed );

		$this->assertSame( $expected, Feature_Flags::is_enabled( self::FLAG ) );
	}

	/**
	 * Data for test_precedence(). At 50, blog 1 is in the bucket and blog 100 is out.
	 *
	 * @return array<string, array{bool, bool, int, int, bool|null, bool, bool, 7?: string}>
	 */
	public static function provide_precedence() {
		return self::with_both_defaults(
			array(
				'Simple: in bucket'                    => array( false, 1, 50, null, false, true ),
				'Simple: out of bucket'                => array( false, 100, 50, null, false, false ),
				'Simple: Force on beats out of bucket' => array( false, 100, 50, true, false, true ),
				'Simple: kill beats Force on'          => array( false, 1, 100, true, true, false ),
				'Simple: connected seller off at 0'    => array( false, 1, 0, null, false, false, 'MERCHANT123' ),
				'Atomic: off at 99 when in bucket'     => array( true, 1, 99, null, false, false ),
				'Atomic: on at 100'                    => array( true, 1, 100, null, false, true ),
			)
		);
	}

	/**
	 * KILLED or a truthy kill option turns the kill switch on. Subclasses set KILLED, so this passes at any shipped value.
	 *
	 * @dataProvider provide_kill_switch
	 *
	 * @param bool        $killed_constant KILLED.
	 * @param string|null $option          The kill option, or null for unset.
	 * @param bool        $expected        Whether the kill switch should be on.
	 */
	#[DataProvider( 'provide_kill_switch' )]
	public function test_kill_switch_follows_killed_and_the_option( $killed_constant, $option, $expected ) {
		$rollout = $killed_constant
			? new class() extends Wpcom_PayPal_Buttons_Rollout {
				const KILLED = true;
			}
			: new class() extends Wpcom_PayPal_Buttons_Rollout {
				const KILLED = false;
			};
		if ( null !== $option ) {
			update_site_option( self::KILL_SWITCH_OPTION, $option );
		}

		$this->assertSame( $expected, $rollout::is_killed() );
	}

	/**
	 * Data for test_kill_switch_follows_killed_and_the_option().
	 *
	 * @return array<string, array{bool, string|null, bool}>
	 */
	public static function provide_kill_switch() {
		return array(
			'KILLED false, option unset' => array( false, null, false ),
			'KILLED true'                => array( true, null, true ),
			'option "false" reads off'   => array( false, 'false', false ),
		);
	}

	/**
	 * Other flags keep their registered default at 100 and with the kill switch on.
	 *
	 * @dataProvider provide_other_flags
	 *
	 * @param string $flag     Flag name.
	 * @param bool   $default  Its registered default.
	 * @param int    $percent  The rollout percent.
	 * @param bool   $killed   Whether the kill switch is on.
	 * @param bool   $expected Whether it should be on.
	 */
	#[DataProvider( 'provide_other_flags' )]
	public function test_other_flags_keep_their_registered_default( $flag, $default, $percent, $killed, $expected ) {
		$this->given( false, 1, $percent, false, null, $killed );
		Feature_Flags::register( $flag, array( 'default' => $default ) );

		$this->assertSame( $expected, Feature_Flags::is_enabled( $flag ) );
	}

	/**
	 * Data for test_other_flags_keep_their_registered_default().
	 *
	 * @return array<string, array{string, bool, int, bool, bool}>
	 */
	public static function provide_other_flags() {
		return array(
			'sandbox flag off at 100'     => array( 'paypal-payments-sandbox', false, 100, false, false ),
			'sandbox flag on when killed' => array( 'paypal-payments-sandbox', true, 0, true, true ),
		);
	}
}
