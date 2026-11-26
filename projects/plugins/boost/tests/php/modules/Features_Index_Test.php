<?php

namespace Automattic\Jetpack_Boost\Tests\Modules;

use Automattic\Jetpack_Boost\Modules\Features_Index;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_Common;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_JS;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;

class Features_Index_Test extends Base_TestCase {

	public function test_features_count() {
		$this->assertCount( 12, Features_Index::FEATURES );
	}

	public function test_sub_features_count() {
		$this->assertCount( 4, Features_Index::SUB_FEATURES );
	}

	public function test_get_sub_features_of() {
		$this->assertEquals( array( Minify_Common::class ), Features_Index::get_sub_features_of( new Minify_JS() ) );
	}
}
