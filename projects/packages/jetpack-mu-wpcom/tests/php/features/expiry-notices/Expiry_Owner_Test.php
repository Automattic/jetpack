<?php
/**
 * Expiry_Owner Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/class-expiry-owner.php';

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Owner
 */
#[CoversClass( Expiry_Owner::class )]
class Expiry_Owner_Test extends \WorDBless\BaseTestCase {

	const STATE = array(
		'subscription_id' => '26532009',
		'product_slug'    => 'business-bundle',
	);

	/**
	 * @var int
	 */
	private $admin_id;

	public function set_up() {
		parent::set_up();
		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'owner_test_admin',
				'user_pass'  => 'pass',
				'user_email' => 'owner_test_admin@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );
		delete_transient( Expiry_Owner::cache_key( self::STATE ) );
	}

	public function tear_down() {
		delete_transient( Expiry_Owner::cache_key( self::STATE ) );
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * An entry in the shape `/upgrades?site=` returns.
	 *
	 * @param array<string,mixed> $fields Fields to set.
	 */
	private function upgrade( array $fields ): object {
		return (object) array_merge(
			array(
				'ID'           => '26532009',
				'product_slug' => 'business-bundle',
				'user_id'      => 777,
			),
			$fields
		);
	}

	public function test_picks_the_owner_by_subscription_id_or_by_slug_without_one(): void {
		$upgrades = array(
			$this->upgrade(
				array(
					'ID'           => '111',
					'product_slug' => 'jetpack-backup-yearly',
					'user_id'      => 1,
				)
			),
			$this->upgrade(
				array(
					'ID'      => 26532009,
					'user_id' => 777,
				)
			),
		);
		$this->assertSame( 777, Expiry_Owner::pick_owner_id( $upgrades, '26532009', 'business-bundle' ) );
		$this->assertSame( 777, Expiry_Owner::pick_owner_id( $upgrades, '', 'business-bundle' ) );
	}

	public function test_says_nothing_when_the_subscription_is_not_listed_or_names_no_owner(): void {
		// The slug is only a fallback: a listed slug under the wrong ID is not it.
		$this->assertNull( Expiry_Owner::pick_owner_id( array( $this->upgrade( array( 'ID' => '111' ) ) ), '26532009', 'business-bundle' ) );
		$this->assertNull( Expiry_Owner::pick_owner_id( array(), '', 'business-bundle' ) );
		$this->assertNull( Expiry_Owner::pick_owner_id( array( 'not an object' ), '', 'business-bundle' ) );
		$this->assertNull( Expiry_Owner::pick_owner_id( array( $this->upgrade( array( 'user_id' => 0 ) ) ), '26532009', '' ) );
		$this->assertNull( Expiry_Owner::pick_owner_id( array( $this->upgrade( array( 'user_id' => null ) ) ), '26532009', '' ) );
	}

	public function test_on_simple_the_viewer_is_the_current_user(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->assertSame( $this->admin_id, Expiry_Owner::current_user_wpcom_id() );
	}

	public function test_on_atomic_the_viewer_is_the_signed_in_wpcom_account(): void {
		update_user_meta( $this->admin_id, 'wpcom_user_id', '777' );
		$this->assertSame( 777, Expiry_Owner::current_user_wpcom_id() );
	}

	public function test_on_atomic_a_connection_token_names_the_viewer(): void {
		\Jetpack_Options::update_option( 'user_tokens', array( $this->admin_id => "token.secret.{$this->admin_id}" ) );
		set_transient( "jetpack_connected_user_data_{$this->admin_id}", array( 'ID' => 777 ), HOUR_IN_SECONDS );

		try {
			$this->assertSame( 777, Expiry_Owner::current_user_wpcom_id() );
		} finally {
			delete_transient( "jetpack_connected_user_data_{$this->admin_id}" );
			\Jetpack_Options::delete_option( 'user_tokens' );
		}
	}

	public function test_a_local_only_user_is_never_the_owner(): void {
		set_transient( Expiry_Owner::cache_key( self::STATE ), 777, HOUR_IN_SECONDS );
		$this->assertNull( Expiry_Owner::current_user_wpcom_id() );
		$this->assertFalse( Expiry_Owner::current_user_is_owner( self::STATE ) );

		wp_set_current_user( 0 );
		$this->assertNull( Expiry_Owner::current_user_wpcom_id() );
	}

	public function test_the_remembered_owner_decides_and_an_unknown_one_reads_as_the_viewer(): void {
		update_user_meta( $this->admin_id, 'wpcom_user_id', '777' );

		set_transient( Expiry_Owner::cache_key( self::STATE ), 777, HOUR_IN_SECONDS );
		$this->assertTrue( Expiry_Owner::current_user_is_owner( self::STATE ) );

		set_transient( Expiry_Owner::cache_key( self::STATE ), 778, HOUR_IN_SECONDS );
		$this->assertFalse( Expiry_Owner::current_user_is_owner( self::STATE ) );

		set_transient( Expiry_Owner::cache_key( self::STATE ), Expiry_Wpcom::NONE, HOUR_IN_SECONDS );
		$this->assertTrue( Expiry_Owner::current_user_is_owner( self::STATE ) );
	}

	public function test_a_failed_lookup_is_remembered_only_briefly(): void {
		// No connected site id on Atomic and no store on Simple: the paths an outage takes.
		foreach ( array( false, true ) as $is_wpcom ) {
			Constants::set_constant( 'IS_WPCOM', $is_wpcom );
			delete_transient( Expiry_Owner::cache_key( self::STATE ) );

			$this->assertNull( Expiry_Owner::owner_id( self::STATE ) );

			$cache_key  = Expiry_Owner::cache_key( self::STATE );
			$expires_in = (int) get_option( '_transient_timeout_' . $cache_key ) - time();
			$this->assertSame( Expiry_Wpcom::NONE, get_transient( $cache_key ) );
			$this->assertGreaterThan( 0, $expires_in );
			$this->assertLessThanOrEqual( Expiry_Wpcom::FAILURE_TTL, $expires_in );
		}
	}

	public function test_on_atomic_the_owner_comes_from_wordpress_com_and_is_remembered(): void {
		\Jetpack_Options::update_option( 'id', 12345 );
		\Jetpack_Options::update_option( 'blog_token', 'blog.token' );
		Connection_Utils::init_default_constants();
		$answer = static function () {
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => '[{"ID":"111","user_id":1},{"ID":"26532009","user_id":777}]',
			);
		};
		add_filter( 'pre_http_request', $answer );

		try {
			$this->assertSame( 777, Expiry_Owner::owner_id( self::STATE ) );
			$this->assertSame( 777, (int) get_transient( Expiry_Owner::cache_key( self::STATE ) ) );
		} finally {
			remove_filter( 'pre_http_request', $answer );
			\Jetpack_Options::delete_option( 'id' );
			\Jetpack_Options::delete_option( 'blog_token' );
		}
	}
}
