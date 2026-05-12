<?php
/**
 * Test-only subclass of Protect_Abilities that overrides the protected
 * seams so happy-path and idempotency tests can exercise the full
 * callback logic without hitting WordPress.com or a Jetpack token fixture.
 *
 * @package automattic/jetpack-protect-plugin
 */

use Automattic\Jetpack\Protect\Abilities\Protect_Abilities;

/**
 * Test-only subclass that overrides Protect_Abilities's protected seams:
 *
 * - fetch_status() returns the seeded Status_Model-like object (or null).
 * - has_required_plan() returns the seeded boolean.
 * - fetch_account_protection_settings() returns the seeded array.
 * - account_protection() returns the seeded fake.
 */
class Protect_Abilities_Test_Stub extends Protect_Abilities {

	/**
	 * Seeded status payload returned by fetch_status().
	 *
	 * @var object|null
	 */
	public static $status = null;

	/**
	 * Seeded plan flag returned by has_required_plan().
	 *
	 * @var bool
	 */
	public static $has_plan = true;

	/**
	 * Seeded account-protection settings array.
	 *
	 * @var array
	 */
	public static $account_protection_settings = array(
		'isEnabled'   => false,
		'isSupported' => true,
	);

	/**
	 * Seeded fake Account_Protection-like object.
	 *
	 * @var object|null
	 */
	public static $account_protection_fake = null;

	/**
	 * Reset all stubs to a clean default.
	 */
	public static function reset(): void {
		self::$status                      = null;
		self::$has_plan                    = true;
		self::$account_protection_settings = array(
			'isEnabled'   => false,
			'isSupported' => true,
		);
		self::$account_protection_fake     = null;
	}

	/**
	 * Return the seeded Status_Model-like object.
	 */
	protected static function fetch_status() {
		return self::$status;
	}

	/**
	 * Return the seeded plan flag.
	 */
	protected static function has_required_plan(): bool {
		return self::$has_plan;
	}

	/**
	 * Return the seeded Account Protection settings.
	 */
	protected static function fetch_account_protection_settings(): array {
		return self::$account_protection_settings;
	}

	/**
	 * Return the seeded Account Protection fake.
	 *
	 * Tests pass a real Account_Protection instance constructed with a
	 * mocked Modules dependency, so we satisfy the parent return type
	 * without duck-typing.
	 */
	protected static function account_protection(): \Automattic\Jetpack\Account_Protection\Account_Protection {
		return self::$account_protection_fake;
	}
}
