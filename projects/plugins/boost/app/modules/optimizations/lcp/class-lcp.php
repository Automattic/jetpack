<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_After_Activation;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Needs_To_Be_Ready;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Lib\Output_Filter;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Always_Available_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Update_LCP;

class Lcp implements Feature, Changes_Output_After_Activation, Optimization, Has_Activate, Needs_To_Be_Ready, Has_Data_Sync, Has_Always_Available_Endpoints {
	/** LCP type for background images. */
	const TYPE_BACKGROUND_IMAGE = 'background-image';

	/** LCP type for standard images. */
	const TYPE_IMAGE = 'img';

	/**
	 * LCP storage class instance.
	 *
	 * @var LCP_Storage
	 */
	protected $storage;

	/**
	 * Utility class that supports output filtering.
	 *
	 * @var Output_Filter
	 */
	private $output_filter = null;

	public function __construct() {
		$this->storage = new LCP_Storage();
	}

	/**
	 * @since 3.13.1
	 */
	public function setup() {
		$this->output_filter = new Output_Filter();

		add_action( 'template_redirect', array( $this, 'start_output_filtering' ), -999999 );
		add_action( 'jetpack_boost_lcp_invalidated', array( $this, 'handle_lcp_invalidated' ) );
		add_action( 'wp_head', array( $this, 'add_preload_links_to_head' ) );

		LCP_Invalidator::init();
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
		if ( defined( 'JETPACK_BOOST_ALPHA_FEATURES' ) && JETPACK_BOOST_ALPHA_FEATURES ) {
			return true;
		}

		return false;
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
	 * @since 3.13.1
	 */
	public function start_output_filtering() {
		if ( LCP_Optimizer::should_skip_optimization() ) {
			return;
		}

		$this->output_filter->add_callback( array( $this, 'optimize' ) );
	}

	/**
	 * Adds preload links for LCP background images to the <head>.
	 *
	 * @since $$next-version$$
	 */
	public function add_preload_links_to_head() {
		if ( LCP_Optimizer::should_skip_optimization() ) {
			return;
		}

		$lcp_storage = $this->storage->get_current_request_lcp();

		if ( empty( $lcp_storage ) ) {
			return;
		}

		$images_to_preload = array();
		foreach ( $lcp_storage as $lcp_data ) {
			$image_to_preload = ( new LCP_Optimizer( $lcp_data ) )->get_image_to_preload();
			if ( ! empty( $image_to_preload ) ) {
				$images_to_preload[] = $image_to_preload;
			}
		}

		if ( empty( $images_to_preload ) ) {
			return;
		}

		// Ensure each image URL is unique.
		$images_to_preload = array_unique( $images_to_preload );
		foreach ( $images_to_preload as $image_url ) {
			printf(
				'<link rel="preload" href="%s" as="image" fetchpriority="high" />' . "\n",
				esc_url( $image_url )
			);
		}
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
	public function optimize( $buffer_start, $buffer_end ) {
		$lcp_storage = $this->storage->get_current_request_lcp();
		if ( empty( $lcp_storage ) ) {
			return array( $buffer_start, $buffer_end );
		}

		// Combine the buffers for processing
		$combined_buffer = $buffer_start . $buffer_end;

		foreach ( $lcp_storage as $lcp_data ) {
			$combined_buffer = ( new LCP_Optimizer( $lcp_data ) )->optimize_buffer( $combined_buffer );
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
	 * Handle the LCP invalidated action.
	 */
	public function handle_lcp_invalidated() {
		( new LCP_Analyzer() )->start();
	}
}
