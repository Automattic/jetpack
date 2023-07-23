<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Tests the URL_Secret class.
 *
 * @package automattic/jetpack-identity-crisis
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\IdentityCrisis\URL_Secret;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the URL_Secret class.
 *
 * @package automattic/jetpack-identity-crisis
 */
class Test_URL_Secret extends TestCase {

	/**
	 * Cleanup after each test.
	 *
	 * @after
	 */
	public static function tear_down() {
		Jetpack_Options::delete_option( URL_Secret::OPTION_KEY );
	}

	/**
	 * Test the create secret functionality.
	 *
	 * @return void
	 * @throws IdentityCrisis\Exception Something probably went wrong.
	 */
	public static function test_create() {
		$url_secret = new URL_Secret();

		$is_created = $url_secret->create();
		$does_exist = $url_secret->exists();
		$secret     = $url_secret->get_secret();
		$expires_at = $url_secret->get_expires_at();

		static::assertTrue( $is_created );
		static::assertTrue( $does_exist );
		static::assertMatchesRegularExpression( '/^[a-z0-9]{12}$/i', $secret );
		static::assertIsInt( $expires_at );
		static::assertEquals( strlen( time() ), strlen( $expires_at ) );
	}

	/**
	 * Test fetching existing URL secret.
	 *
	 * @return void
	 */
	public static function test_fetch_success() {
		$secret_data = array(
			'secret'     => 'asdf12345',
			'expires_at' => time() + URL_Secret::LIFESPAN,
		);
		Jetpack_Options::update_option( URL_Secret::OPTION_KEY, $secret_data );

		$url_secret = new URL_Secret();
		$does_exist = $url_secret->exists();
		$secret     = $url_secret->get_secret();
		$expires_at = $url_secret->get_expires_at();

		static::assertTrue( $does_exist );
		static::assertEquals( $secret_data['secret'], $secret );
		static::assertEquals( $secret_data['expires_at'], $expires_at );
	}

	/**
	 * Test fetching and cleaning of an expired secret.
	 *
	 * @return void
	 */
	public static function test_fetch_expired() {
		$secret_data = array(
			'secret'     => 'asdf12345',
			'expires_at' => time() - 1,
		);
		Jetpack_Options::update_option( URL_Secret::OPTION_KEY, $secret_data );

		$url_secret = new URL_Secret();
		$does_exist = $url_secret->exists();
		$secret     = $url_secret->get_secret();
		$expires_at = $url_secret->get_expires_at();
		$secret_db  = Jetpack_Options::get_option( URL_Secret::OPTION_KEY );

		static::assertFalse( $does_exist );
		static::assertNull( $secret );
		static::assertNull( $expires_at );
		static::assertFalse( $secret_db );
	}

	/**
	 * Test the `add_secret_to_url_validation_response()` method.
	 *
	 * @return void
	 */
	public static function test_add_secret_to_url_validation_response() {
		$data = array(
			'key1' => 'value1',
			'key2' => 'value2',
		);

		$data_updated = URL_Secret::add_secret_to_url_validation_response( $data );

		$secret_db          = Jetpack_Options::get_option( URL_Secret::OPTION_KEY );
		$data['url_secret'] = $secret_db['secret'];

		static::assertEquals( $data, $data_updated );
		static::assertArrayNotHasKey( 'url_secret_error', $data_updated );
	}
}
