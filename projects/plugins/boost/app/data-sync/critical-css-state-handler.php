<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry_Handler;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;

final class Critical_CSS_State_Handler extends Data_Sync_Entry_Handler {

	/**
	 * @var Schema;
	 */
	private $schema;

	public function __construct() {
		$this->schema = Schema::as_assoc_array(
			[
				'status'    => Schema::enum( [ 'pending', 'success', 'error', 'validation-error' ] ),
				'providers' => Schema::as_array(
					Schema::as_assoc_array(
						[
							'key'           => Schema::as_string(),
							'label'         => Schema::as_string(),
							'urls'          => Schema::as_array( Schema::as_string() ),
							'success_ratio' => Schema::as_float(),
							'status'        => Schema::enum( [ 'pending', 'success', 'error', 'validation-error' ] ),
						]
					) ),
				'created'   => Schema::as_float()->nullable(),
				'updated'   => Schema::as_float()->nullable(),
			]
		);
	}

	// Clean up the data before saving it
	public function sanitize( $value ) {
		return $this->schema->parse( $value );
	}

	// Unpack the data after getting it from the database
	public function transform( $value ) {
		return $this->schema->parse( $value );
	}

}
