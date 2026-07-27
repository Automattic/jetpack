<?php

use Automattic\Jetpack\Features\Feature;
use Automattic\Jetpack\Features\Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use function Automattic\Jetpack\Features\register_feature;

/**
 * @covers \Automattic\Jetpack\Features\Registry
 */
#[CoversClass( Registry::class )]
final class RegistryTest extends PHPUnit\Framework\TestCase {

	protected function setUp(): void {
		parent::setUp();
		Registry::instance()->clear();
	}

	public function test_register_and_get() {
		Registry::instance()->register( new Feature( 'a', array( 'title' => 'A' ) ) );
		$this->assertSame( 'A', Registry::instance()->get( 'a' )->title() );
		$this->assertNull( Registry::instance()->get( 'missing' ) );
	}

	public function test_all_is_slug_keyed() {
		Registry::instance()->register( new Feature( 'a' ) );
		Registry::instance()->register( new Feature( 'b' ) );
		$this->assertSame( array( 'a', 'b' ), array_keys( Registry::instance()->all() ) );
	}

	public function test_later_registration_overrides() {
		Registry::instance()->register( new Feature( 'a', array( 'title' => 'first' ) ) );
		Registry::instance()->register( new Feature( 'a', array( 'title' => 'second' ) ) );
		$this->assertCount( 1, Registry::instance()->all() );
		$this->assertSame( 'second', Registry::instance()->get( 'a' )->title() );
	}

	public function test_namespaced_register_feature_delegates() {
		register_feature( 'c', array( 'title' => 'C' ) );
		$this->assertSame( 'C', Registry::instance()->get( 'c' )->title() );
	}
}
