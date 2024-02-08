<?php
namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Generator;

class Critical_CSS_Meta_Entry implements Entry_Can_Get {
	public function get( $_fallback = false ) {
		$generator = new Generator();
		return $generator->get_generation_metadata();
	}
}
