<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;

final class Data_Sync_Readonly implements Entry_Can_Get {
	private $callback;
	public function __construct( $callback ) {
		$this->callback = $callback;
	}

	public function get( $fallback_value = false ) {
		$result = call_user_func( $this->callback );
		if ( false !== $fallback_value && empty( $result ) ) {
			return $fallback_value;
		}
		return $result;
	}
}
