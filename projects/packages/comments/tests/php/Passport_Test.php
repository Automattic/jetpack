<?php
/**
 * Tests for the passport cookie.
 *
 * @package automattic/jetpack-comments
 */

use Automattic\Jetpack\Comments\Passport;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Tests for the passport cookie.
 *
 * @covers \Automattic\Jetpack\Comments\Passport
 */
#[CoversClass( Passport::class )]
class Passport_Test extends BaseTestCase {

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		Jetpack_Options::update_option( 'id', 12345 );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Jetpack_Options::delete_option( 'id' );
		parent::tear_down();
	}

	/**
	 * A passport-shaped identity.
	 *
	 * @param array $overrides Fields to change.
	 * @return array
	 */
	private function identity( array $overrides = array() ) {
		return array_merge(
			array(
				'site_commenter_id' => str_repeat( 'a', 64 ),
				'provider'          => 'wordpress',
				'name'              => 'Ada Lovelace',
				'email'             => 'ada@example.com',
				'avatar'            => 'https://0.gravatar.com/avatar/abc',
				'expires_at'        => time() + DAY_IN_SECONDS,
			),
			$overrides
		);
	}

	/**
	 * What goes in comes back out.
	 */
	public function test_round_trip() {
		$identity = $this->identity();

		$this->assertSame( $identity, Passport::decode( Passport::encode( $identity ) ) );
	}

	/**
	 * A changed payload, a wrong signature, or no signature at all reads as absent.
	 */
	public function test_tampering_reads_as_absent() {
		list( $payload, $signature ) = explode( '.', Passport::encode( $this->identity() ) );

		$forged = rtrim( strtr( base64_encode( wp_json_encode( $this->identity( array( 'name' => 'Mallory' ) ), JSON_UNESCAPED_SLASHES ) ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- the cookie format.

		$this->assertNull( Passport::decode( $forged . '.' . $signature ) );
		$this->assertNull( Passport::decode( $payload . '.' . str_repeat( '0', 64 ) ) );
		$this->assertNull( Passport::decode( $payload ) );
	}

	/**
	 * An expired passport reads as absent.
	 */
	public function test_expired_reads_as_absent() {
		$this->assertNull( Passport::decode( Passport::encode( $this->identity( array( 'expires_at' => time() - 1 ) ) ) ) );
	}

	/**
	 * A passport is refused on any site but the one that issued it.
	 */
	public function test_passport_is_bound_to_the_site() {
		$cookie = Passport::encode( $this->identity() );

		Jetpack_Options::update_option( 'id', 67890 );
		$this->assertNull( Passport::decode( $cookie ) );
	}

	/**
	 * The display cookie carries only what the page may show: no email, no id.
	 */
	public function test_display_cookie_carries_only_provider_name_and_avatar() {
		$shown = json_decode( rawurldecode( Passport::display( $this->identity() ) ), true );

		$this->assertSame(
			array(
				'provider' => 'wordpress',
				'name'     => 'Ada Lovelace',
				'avatar'   => 'https://0.gravatar.com/avatar/abc',
			),
			$shown
		);
	}
}
