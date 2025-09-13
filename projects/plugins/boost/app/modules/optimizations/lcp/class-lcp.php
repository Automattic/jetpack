<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_After_Activation;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Needs_To_Be_Ready;
use Automattic\Jetpack_Boost\Contracts\Needs_Website_To_Be_Public;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Lib\Output_Filter;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Always_Available_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Update_LCP;

class Lcp implements Feature, Changes_Output_After_Activation, Optimization, Has_Activate, Needs_To_Be_Ready, Has_Data_Sync, Has_Always_Available_Endpoints, Needs_Website_To_Be_Public {
	/** LCP type for background images. */
	const TYPE_BACKGROUND_IMAGE = 'background-image';

	/** LCP type for standard images. */
	const TYPE_IMAGE = 'img';

	/**
	 * The LCP data of the current request.
	 *
	 * @var array|false
	 */
	private $lcp_data;

	public function setup() {
		add_action( 'wp', array( $this, 'on_wp_load' ), 1 );
		add_action( 'template_redirect', array( $this, 'add_output_filter' ), -999999 );

		add_action( 'jetpack_boost_lcp_invalidated', array( $this, 'handle_lcp_invalidated' ) );

		LCP_Invalidator::init();
	}

	public function on_wp_load() {
		$this->lcp_data = ( new LCP_Storage() )->get_current_request_lcp();

		LCP_Optimize_Bg_Image::init( $this->lcp_data );
	}

	public function add_output_filter() {
		if ( LCP_Optimization_Util::should_skip_optimization() ) {
			return;
		}

		$output_filter = new Output_Filter();
		$output_filter->add_callback( array( $this, 'optimize_lcp_img_tag' ) );
	}

	/**
	 * Optimize the HTML content by finding the LCP image and adding required attributes.
	 *
	 * @param string $buffer_start First part of the buffer.
	 * @param string $buffer_end   Second part of the buffer.
	 *
	 * @return array Parts of the buffer.
	 *
	 * @since 3.13.1
	 */
	public function optimize_lcp_img_tag( $buffer_start, $buffer_end ) {
		if ( empty( $this->lcp_data ) ) {
			return array( $buffer_start, $buffer_end );
		}

		// Combine the buffers for processing
		$combined_buffer = $buffer_start . $buffer_end;

		foreach ( $this->lcp_data as $lcp_element ) {
			$optimizer = new LCP_Optimize_Img_Tag( $lcp_element );

			$combined_buffer = $optimizer->optimize_buffer( $combined_buffer );
		}

		// Split the modified buffer back into two parts
		$buffer_start_length = strlen( $buffer_start );
		$new_buffer_start    = substr( $combined_buffer, 0, $buffer_start_length );
		$new_buffer_end      = substr( $combined_buffer, $buffer_start_length );

		// Check for successful split
		if ( false === $new_buffer_start || false === $new_buffer_end ) {
			// If splitting failed, return the original buffers
			return array( $buffer_start, $buffer_end );
		}

		return array( $new_buffer_start, $new_buffer_end );
	}

	/**
	 * @since 3.13.1
	 */
	public static function activate() {
		( new LCP_Analyzer() )->start();
	}

	/**
	 * @since 3.13.1
	 */
	public static function get_slug() {
		return 'lcp';
	}

	public function get_always_available_endpoints() {
		return array(
			new Update_LCP(),
		);
	}

	/**
	 * @since 3.13.1
	 */
	public static function is_available() {
		return true;
	}

	/**
	 * Check if the module is ready and already serving optimized pages.
	 *
	 * @return bool
	 */
	public function is_ready() {
		return ( new LCP_State() )->is_analyzed();
	}

	/**
	 * Get the action names that will be triggered when the module is ready.
	 *
	 * @return string[]
	 */
	public static function get_change_output_action_names() {
		return array( 'jetpack_boost_lcp_invalidated', 'jetpack_boost_lcp_analyzed' );
	}

	/**
	 * Register data sync actions.
	 *
	 * @param Data_Sync $instance The Data_Sync object.
	 */
	public function register_data_sync( $instance ) {
		$instance->register(
			'lcp_state',
			Schema::as_assoc_array(
				array(
					'pages'        => Schema::as_array(
						Schema::as_assoc_array(
							array(
								'key'    => Schema::as_string(),
								'url'    => Schema::as_string(),
								'status' => Schema::as_string(),
								'errors' => Schema::as_array(
									Schema::as_assoc_array(
										array(
											'type' => Schema::as_string(),
											'meta' => Schema::as_assoc_array(
												array(
													'code' => Schema::as_number()->nullable(),
													'selector' => Schema::as_string()->nullable(),
												)
											)->nullable(),
										)
									)
								)->nullable(),
							)
						)
					),
					'status'       => Schema::enum( array( 'not_analyzed', 'analyzed', 'pending', 'error' ) )->fallback( 'not_analyzed' ),
					'created'      => Schema::as_float()->nullable(),
					'updated'      => Schema::as_float()->nullable(),
					'status_error' => Schema::as_string()->nullable(),
				)
			)->fallback(
				array(
					'pages'   => array(),
					'status'  => 'not_analyzed',
					'created' => null,
					'updated' => null,
				)
			)
		);

		$instance->register_action( 'lcp_state', 'request-analyze', Schema::as_void(), new Optimize_LCP_Endpoint() );
	}

	/**
	 * Handle the LCP invalidated action.
	 */
	public function handle_lcp_invalidated() {
		( new LCP_Analyzer() )->start();
	}
}
