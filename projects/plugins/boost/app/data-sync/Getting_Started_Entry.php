<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\Status;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Getting_Started_Entry implements Entry_Can_Get, Entry_Can_Set {
	private $option_key = 'jb_get_started';
	public function get() {
		return \get_option( $this->option_key, false ) && ! Premium_Features::has_any() && ! ( new Status() )->is_offline_mode();
	}

	public function set( $value ) {
		if ( $value === true ) {
			update_option( $this->option_key, $value, false );
		} else {
			delete_option( $this->option_key );
		}
	}
}
