<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Contracts;

interface Entry_Can_Merge extends Entry_Can_Set {

	public function merge( $previous_value, $partial_value );

}
