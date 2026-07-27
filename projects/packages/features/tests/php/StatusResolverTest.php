<?php
// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound -- Fake_Environment + test class in same file as per brief.

use Automattic\Jetpack\Features\Feature;
use Automattic\Jetpack\Features\Feature_Environment;
use Automattic\Jetpack\Features\Status_Resolver;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Configurable fake environment for exercising the resolver.
 */
final class Fake_Environment implements Feature_Environment {
	public $applicable     = true;
	public $entitled       = true;
	public $connection_met = true;
	public $active         = true;

	// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Required by interface.
	public function applies_to_site( Feature $_f ): bool {
		return $this->applicable; }
	public function site_is_entitled( ?string $_slug ): bool {
		return $this->entitled; }
	public function site_has_connection_level( string $_level ): bool {
		return $this->connection_met; }
	public function is_active_on_site( Feature $_f ): bool {
		return $this->active; }
	// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
}

/**
 * @covers \Automattic\Jetpack\Features\Status_Resolver
 */
#[CoversClass( Status_Resolver::class )]
final class StatusResolverTest extends PHPUnit\Framework\TestCase {

	private function resolve( Fake_Environment $env, array $args = array() ) {
		return ( new Status_Resolver() )->resolve( new Feature( 'x', $args ), $env );
	}

	public function test_active_when_all_satisfied() {
		$r = $this->resolve( new Fake_Environment() );
		$this->assertSame( Status_Resolver::STATUS_ACTIVE, $r['status'] );
		$this->assertTrue( $r['facets']['is_registered'] );
		$this->assertTrue( $r['facets']['is_active_on_site'] );
	}

	public function test_available_off_when_not_active() {
		$env         = new Fake_Environment();
		$env->active = false;
		$this->assertSame( Status_Resolver::STATUS_AVAILABLE_OFF, $this->resolve( $env )['status'] );
	}

	public function test_needs_upgrade_when_not_entitled() {
		$env           = new Fake_Environment();
		$env->entitled = false;
		$env->active   = false;
		$this->assertSame( Status_Resolver::STATUS_NEEDS_UPGRADE, $this->resolve( $env )['status'] );
	}

	public function test_needs_connection_wins_over_upgrade() {
		$env                 = new Fake_Environment();
		$env->connection_met = false;
		$env->entitled       = false;
		$this->assertSame( Status_Resolver::STATUS_NEEDS_CONNECTION, $this->resolve( $env, array( 'connection' => 'site' ) )['status'] );
	}

	public function test_unsupported_wins_over_everything() {
		$env                 = new Fake_Environment();
		$env->applicable     = false;
		$env->connection_met = false;
		$env->entitled       = false;
		$this->assertSame( Status_Resolver::STATUS_UNSUPPORTED, $this->resolve( $env )['status'] );
	}

	public function test_facets_reported() {
		$env                 = new Fake_Environment();
		$env->connection_met = false;
		$env->entitled       = false;
		$env->applicable     = true;
		$env->active         = false;
		$r                   = $this->resolve(
			$env,
			array(
				'connection'  => 'user',
				'entitlement' => 'field-file',
			)
		);
		$this->assertSame( 'user', $r['facets']['required_connection'] );
		$this->assertFalse( $r['facets']['connection_satisfied'] );
		$this->assertSame( 'connection_missing', $r['reason'] );
		$this->assertFalse( $r['facets']['is_entitled_on_site'] );
		$this->assertTrue( $r['facets']['applies_to_site'] );
		$this->assertFalse( $r['facets']['is_active_on_site'] );
	}
}
