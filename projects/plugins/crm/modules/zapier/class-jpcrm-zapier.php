<?php
/**
 * 
 * Jetpack CRM Zapier Class
 * 
 */

namespace Automattic\JetpackCRM;

defined( 'ZEROBSCRM_PATH' ) || exit;

class JPCRM_Zapier {

	public function __construct() {
		// nothing at the moment
	}

	/**
	 * Converts array key names to valid options per Zapier schema:
	 * https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#keyschema
	 * 
	 * If we expand use of this, we should consider making it recursive
	 *
	 * @return array
	 */
	public function use_valid_key_names( $input_array ) {

		$new_array = array();
		foreach ( $input_array as $i ) {
			$new_array[] = array_combine( array_map( [$this,'convert_key_name'], array_keys( $i ) ), $i );
		}
		return $new_array;
	}

	private function convert_key_name( $key ) {
		return str_replace( '-', '_', $key );
	}
}