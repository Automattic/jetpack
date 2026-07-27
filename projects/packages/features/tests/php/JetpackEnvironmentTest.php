<?php
// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound -- Stub_Jetpack_Environment + test class in same file as per brief.

use Automattic\Jetpack\Features\Feature;
use Automattic\Jetpack\Features\Jetpack_Environment;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Testable subclass: stub the platform seams so we test only the mapping logic.
 */
final class Stub_Jetpack_Environment extends Jetpack_Environment {
	public $plan   = false;
	public $module = false;
	public $site   = false;
	public $owner  = false;
	// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Required by overridden interface.
	protected function plan_supports( $slug ): bool {
		return $this->plan; }
	protected function module_is_active_on_site( $module ): bool {
		return $this->module; }
	protected function site_is_connected(): bool {
		return $this->site; }
	protected function has_connected_owner(): bool {
		return $this->owner; }
	// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
}

/**
 * @covers \Automattic\Jetpack\Features\Jetpack_Environment
 */
#[CoversClass( Jetpack_Environment::class )]
final class JetpackEnvironmentTest extends PHPUnit\Framework\TestCase {

	public function test_null_entitlement_is_free() {
		$this->assertTrue( ( new Stub_Jetpack_Environment() )->site_is_entitled( null ) );
	}

	public function test_empty_string_entitlement_is_free() {
		$this->assertTrue( ( new Stub_Jetpack_Environment() )->site_is_entitled( '' ) );
	}

	public function test_entitlement_delegates_to_plan() {
		$env       = new Stub_Jetpack_Environment();
		$env->plan = true;
		$this->assertTrue( $env->site_is_entitled( 'field-file' ) );
		$env->plan = false;
		$this->assertFalse( $env->site_is_entitled( 'field-file' ) );
	}

	public function test_connection_none_always_met() {
		$this->assertTrue( ( new Stub_Jetpack_Environment() )->site_has_connection_level( 'none' ) );
	}

	public function test_connection_site_uses_site_seam() {
		$env       = new Stub_Jetpack_Environment();
		$env->site = true;
		$this->assertTrue( $env->site_has_connection_level( 'site' ) );
	}

	public function test_connection_user_uses_owner_seam() {
		$env        = new Stub_Jetpack_Environment();
		$env->owner = true;
		$this->assertTrue( $env->site_has_connection_level( 'user' ) );
		$this->assertFalse( $env->site_has_connection_level( 'site' ) );
	}

	public function test_is_active_uses_module_seam() {
		$env         = new Stub_Jetpack_Environment();
		$env->module = true;
		$this->assertTrue( $env->is_active_on_site( new Feature( 'x', array( 'module' => 'contact-form' ) ) ) );
	}

	public function test_is_active_true_when_no_module() {
		$this->assertTrue( ( new Stub_Jetpack_Environment() )->is_active_on_site( new Feature( 'x' ) ) );
	}

	public function test_callbacks_win() {
		$f           = new Feature(
			'x',
			array(
				'module'        => 'contact-form',
				'is_active'     => function () {
					return false; },
				'is_applicable' => function () {
					return false; },
			)
		);
		$env         = new Stub_Jetpack_Environment();
		$env->module = true;
		$this->assertFalse( $env->is_active_on_site( $f ) );
		$this->assertFalse( $env->applies_to_site( $f ) );
	}
}
