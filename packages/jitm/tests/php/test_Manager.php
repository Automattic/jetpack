<?php

use Automattic\Jetpack\JITM\Manager as Jetpack_JITM;
use PHPUnit\Framework\TestCase;

class Test_Jetpack_JITM extends TestCase {
	public function test_jitm_disabled_by_filter() {
		add_filter( 'jetpack_just_in_time_msgs', '__return_false', 50 );
		$this->assertFalse( Jetpack_JITM::init() );
	}

	public function test_jitm_enabled_by_default() {
		$this->assertTrue( ! ! Jetpack_JITM::init() );
	}
}
