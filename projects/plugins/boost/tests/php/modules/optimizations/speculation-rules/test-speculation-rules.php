<?php

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Speculation_Rules;

use Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules\Speculation_Rules;
use Automattic\Jetpack_Boost\Tests\Base_Test_Case;

class Test_Speculation_Rules extends Base_Test_Case {
	private $speculation_rules;

	public function set_up() {
		parent::set_up();
		$this->speculation_rules = new Speculation_Rules();
	}

	public function test_is_available() {
		$this->assertTrue( Speculation_Rules::is_available() );
	}

	public function test_get_slug() {
		$this->assertEquals( 'speculation_rules', Speculation_Rules::get_slug() );
	}

	public function test_is_ready() {
		$this->assertTrue( $this->speculation_rules->is_ready() );
	}

	public function test_setup() {
		// Test that setup runs without errors
		$this->speculation_rules->setup();
		$this->assertTrue( true );
	}
}
