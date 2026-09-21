<?php
/**
 * Tests for Automattic\Jetpack\Feature_Policy.
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack;

use Brain\Monkey;
use Brain\Monkey\Filters;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Feature_Policy test suite.
 *
 * @covers \Automattic\Jetpack\Feature_Policy
 */
#[CoversClass( Feature_Policy::class )]
class Feature_Policy_Test extends TestCase {

	/**
	 * Test setup.
	 */
	public function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Test teardown.
	 */
	public function tearDown(): void {
		Feature_Policy::reset();
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Stubs the policy filter's return value.
	 *
	 * @param mixed $policy The policy a host would return.
	 */
	private function set_policy( $policy ) {
		Filters\expectApplied( Feature_Policy::FILTER )->andReturn( $policy );
	}

	/**
	 * Unknown values and malformed entries are dropped rather than guessed at.
	 */
	public function test_get_policy_keeps_only_valid_values() {
		$this->set_policy(
			array(
				'stats'   => array(
					'activation' => 'forced-on',
					'visibility' => 'hidden',
				),
				'monitor' => array(
					'activation' => 'always',
					'visibility' => 'visible',
				),
				'search'  => 'hidden',
				0         => array( 'activation' => 'forced-off' ),
			)
		);

		$this->assertSame(
			array(
				'stats'   => array(
					'activation' => 'forced-on',
					'visibility' => 'hidden',
				),
				'monitor' => array(
					'activation' => null,
					'visibility' => 'visible',
				),
			),
			Feature_Policy::get_policy()
		);
	}

	/**
	 * A filter returning something other than a map yields no policy.
	 */
	public function test_get_policy_ignores_non_array_return() {
		$this->set_policy( false );

		$this->assertSame( array(), Feature_Policy::get_policy() );
	}

	/**
	 * Forced states change the active list; default states don't.
	 */
	public function test_filter_active_modules_applies_forced_states_only() {
		$this->set_policy(
			array(
				'stats'         => array( 'activation' => 'forced-on' ),
				'contact-form'  => array( 'activation' => 'forced-off' ),
				'related-posts' => array( 'activation' => 'default-on' ),
				'sso'           => array( 'activation' => 'default-off' ),
			)
		);

		$this->assertSame(
			array( 'sso', 'stats' ),
			Feature_Policy::filter_active_modules( array( 'contact-form', 'sso' ) )
		);
	}

	/**
	 * Default-on only adds modules the caller could activate, and default-off removes.
	 */
	public function test_filter_default_modules_respects_availability() {
		$this->set_policy(
			array(
				'related-posts' => array( 'activation' => 'default-on' ),
				'not-available' => array( 'activation' => 'default-on' ),
				'sso'           => array( 'activation' => 'default-off' ),
				'stats'         => array( 'activation' => 'forced-off' ),
			)
		);
		Filters\expectApplied( 'jetpack_get_available_standalone_modules' )
			->with( array(), false, null )
			->andReturn( array( 'related-posts', 'sso', 'stats' ) );

		$this->assertSame(
			array( 'stats', 'related-posts' ),
			Feature_Policy::filter_default_modules( array( 'sso', 'stats' ), false, false, false, null )
		);
	}

	/**
	 * Visibility from the policy overrides the incoming map, and unset slugs are left alone.
	 */
	public function test_filter_visibility_sets_policy_states() {
		$this->set_policy(
			array(
				'search' => array( 'visibility' => 'hidden' ),
				'boost'  => array( 'visibility' => 'visible' ),
				'stats'  => array( 'activation' => 'forced-on' ),
			)
		);

		$this->assertSame(
			array(
				'boost'  => 'visible',
				'backup' => 'hidden',
				'search' => 'hidden',
			),
			Feature_Policy::filter_visibility(
				array(
					'boost'  => 'hidden',
					'backup' => 'hidden',
				)
			)
		);
	}

	/**
	 * The bridge stays off until something registers a policy.
	 */
	public function test_ensure_hooks_waits_for_a_policy() {
		Feature_Policy::ensure_hooks();
		$this->assertFalse( Filters\has( 'jetpack_active_modules', array( Feature_Policy::class, 'filter_active_modules' ) ) );

		add_filter( Feature_Policy::FILTER, '__return_empty_array' );
		Feature_Policy::ensure_hooks();

		$this->assertSame( PHP_INT_MAX, Filters\has( 'jetpack_active_modules', array( Feature_Policy::class, 'filter_active_modules' ) ) );
		$this->assertSame( PHP_INT_MAX, Filters\has( 'jetpack_get_default_modules', array( Feature_Policy::class, 'filter_default_modules' ) ) );
		$this->assertSame( PHP_INT_MAX, Filters\has( 'jetpack_my_jetpack_feature_visibility', array( Feature_Policy::class, 'filter_visibility' ) ) );
	}
}
