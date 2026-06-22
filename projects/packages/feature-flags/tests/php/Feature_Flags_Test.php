<?php
/**
 * Tests the Feature Flags package.
 *
 * @package automattic/jetpack-feature-flags
 */

namespace Automattic\Jetpack\Feature_Flags;

use Brain\Monkey;
use Brain\Monkey\Filters;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Tests Feature_Flags.
 *
 * @covers \Automattic\Jetpack\Feature_Flags\Feature_Flags
 */
#[CoversClass( Feature_Flags::class )]
class Feature_Flags_Test extends TestCase {
	use MockeryPHPUnitIntegration;

	/**
	 * Test setup.
	 */
	public function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		Feature_Flags::reset();
	}

	/**
	 * Test teardown.
	 */
	public function tearDown(): void {
		Feature_Flags::reset();
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Tests registering and reading a flag definition.
	 */
	public function test_register_and_get_flag() {
		Feature_Flags::register(
			'my-feature',
			array(
				'default'     => true,
				'description' => 'A test feature.',
				'owner'       => 'tests',
			)
		);

		$this->assertSame(
			array(
				'default'     => true,
				'description' => 'A test feature.',
				'owner'       => 'tests',
				'name'        => 'my-feature',
			),
			Feature_Flags::get( 'my-feature' )
		);
	}

	/**
	 * Tests registering an invalid flag name throws.
	 */
	public function test_register_rejects_invalid_name() {
		$this->expectException( \InvalidArgumentException::class );

		Feature_Flags::register( 'Not A Valid Name!' );
	}

	/**
	 * Tests defaults are used for missing definition fields.
	 */
	public function test_register_uses_definition_defaults() {
		Feature_Flags::register( 'my-feature' );

		$this->assertSame(
			array(
				'default'     => false,
				'description' => '',
				'owner'       => '',
				'name'        => 'my-feature',
			),
			Feature_Flags::get( 'my-feature' )
		);
	}

	/**
	 * Tests all registered flags are returned by name.
	 */
	public function test_all_returns_registered_flags_sorted_by_name() {
		Feature_Flags::register( 'z-feature' );
		Feature_Flags::register( 'a-feature' );

		$this->assertSame( array( 'a-feature', 'z-feature' ), array_keys( Feature_Flags::all() ) );
	}

	/**
	 * Tests checking a flag uses the registered default.
	 */
	public function test_is_enabled_uses_registered_default() {
		Feature_Flags::register( 'my-feature', array( 'default' => true ) );

		Filters\expectApplied( 'jetpack_feature_flag_enabled' )
			->once()
			->with(
				true,
				'my-feature',
				array(
					'default'     => true,
					'description' => '',
					'owner'       => '',
					'name'        => 'my-feature',
				)
			)
			->andReturnFirstArg();

		$this->assertTrue( Feature_Flags::is_enabled( 'my-feature' ) );
	}

	/**
	 * Tests the global filter can override flag state.
	 */
	public function test_is_enabled_applies_global_filter() {
		Feature_Flags::register( 'my-feature', array( 'default' => false ) );

		Filters\expectApplied( 'jetpack_feature_flag_enabled' )
			->once()
			->with(
				false,
				'my-feature',
				array(
					'default'     => false,
					'description' => '',
					'owner'       => '',
					'name'        => 'my-feature',
				)
			)
			->andReturn( true );

		$this->assertTrue( Feature_Flags::is_enabled( 'my-feature' ) );
	}

	/**
	 * Tests unknown flags default to false but still pass through the filter.
	 */
	public function test_unknown_flag_defaults_to_false_and_applies_filter() {
		Filters\expectApplied( 'jetpack_feature_flag_enabled' )
			->once()
			->with(
				false,
				'unknown-feature',
				array(
					'default'     => false,
					'description' => '',
					'owner'       => '',
					'name'        => 'unknown-feature',
				)
			)
			->andReturn( true );

		$this->assertTrue( Feature_Flags::is_enabled( 'unknown-feature' ) );
	}
}
