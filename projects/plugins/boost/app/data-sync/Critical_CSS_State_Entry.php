<?php
namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Generator;

class Critical_CSS_State_Entry implements Entry_Can_Get, Entry_Can_Set {

	private $option_key;

	public function __construct( $option_key ) {
		$this->option_key = $option_key;
	}

	public function get( $fallback_value = false ) {
		// WordPress looks at argument count to figure out if a fallback value was used.
		// Only provide the fallback value if it's not the default ( false ).
		if ( $fallback_value !== false ) {
			$value = get_option( $this->option_key, $fallback_value );
		} else {
			$value = get_option( $this->option_key );
		}

		return array_merge( $value, $this->get_generation_metadata() );
	}

	public function set( $value ) {
		update_option( $this->option_key, array_diff_key( $value, $this->get_generation_metadata() ), false );
	}

	private function get_generation_metadata() {
		$generator = new Generator();
		return $generator->get_generation_metadata();
	}

}
