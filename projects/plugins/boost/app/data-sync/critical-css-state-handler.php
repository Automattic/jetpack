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
			array(
				'callback_passthrough' => Schema::any_json_data()->nullable(),
				'generation_nonce'     => Schema::as_string()->nullable(),
				'proxy_nonce'          => Schema::as_string()->nullable(),
				'providers'            => Schema::as_array(
					Schema::as_assoc_array(
						array(
							'key'           => Schema::as_string(),
							'label'         => Schema::as_string(),
							'urls'          => Schema::as_array( Schema::as_string() ),
							'success_ratio' => Schema::as_float(),
							'status'        => Schema::enum( array( 'success', 'pending', 'error', 'validation-error' ) )->fallback( 'validation-error' ),
							'error_status'  => Schema::enum( array( 'active', 'dismissed' ) )->nullable(),
							'errors'        => Schema::as_array(
								Schema::as_assoc_array(
									array(
										'url'     => Schema::as_string(),
										'message' => Schema::as_string(),
										'type'    => Schema::as_string(),
										'meta'    => Schema::any_json_data()->nullable(),
									)
								)->fallback( array() )
							)->nullable(),
						)
					)
				)->nullable(),
				'status'               => Schema::enum( array( 'not_generated', 'generated', 'pending', 'error' ) )->fallback( 'not_generated' ),
				'updated'              => Schema::as_float()->nullable(),
				'status_error'         => Schema::as_string()->nullable(),
				'created'              => Schema::as_float()->nullable(),
				'viewports'            => Schema::as_array(
					Schema::as_assoc_array(
						array(
							'type'   => Schema::as_string(),
							'width'  => Schema::as_number(),
							'height' => Schema::as_number(),
						)
					)
				)->fallback( array() ),
			)
		)->fallback(
			array(
				'status'               => 'not_generated',
				'providers'            => array(),
				'callback_passthrough' => null,
				'generation_nonce'     => null,
				'proxy_nonce'          => null,
				'viewports'            => array(),
				'created'              => null,
				'updated'              => null,
			)
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
