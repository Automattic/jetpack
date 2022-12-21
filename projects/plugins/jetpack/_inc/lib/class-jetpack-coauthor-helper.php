<?php
/**
 * API helper for the CoAuthor blocks.
 *
 * @package automattic/jetpack
 * @since $$next-version$$
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status;

/**
 * Class Jetpack_Coauthor_Helper
 *
 * @since $$next-version$$
 */
class Jetpack_Coauthor_Helper {
	/**
	 * Allow new completion every X seconds. Will return cached result otherwise.
	 *
	 * @var int
	 */
	public $text_completion_cooldown_seconds = 10;

	/**
	 * Cache images for a prompt for a month.
	 *
	 * @var int
	 */
	public $image_generation_cache_timeout = MONTH_IN_SECONDS;

	/**
	 * Checks if a given request is allowed to get AI data from WordPress.com.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return true|WP_Error True if the request has access, WP_Error object otherwise.
	 */
	public static function get_status_permission_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		/*
		 * This may need to be updated
		 * to take into account the different ways we can make requests
		 * (from a WordPress.com site, from a Jetpack site).
		 */
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to access CoAuthor help on this site.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Get the WPCOM or self-hosted site ID.
	 *
	 * @return mixed
	 */
	public static function get_site_id() {
		$is_wpcom = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$site_id  = $is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}
		return (int) $site_id;
	}

	/**
	 * Get text back from WordPress.com based off a starting text.
	 *
	 * @param  string $content The content that's already been typed in the block.
	 * @return mixed
	 */
	public static function get_gpt_completion( $content ) {
		if ( ( new Status() )->is_offline_mode() ) {
			return new WP_Error(
				'dev_mode',
				__( 'CoAuthor is not available in offline mode.', 'jetpack' )
			);
		}

		$site_id = self::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( ! class_exists( 'WPCOM_Coauthor' ) ) {
				\require_lib( 'coauthor' );
			}

			return WPCOM_Coauthor::get_gpt_completion( $content );
		}

		/*
		 * I've taken the example of a request by site
		 * but this may need to be updated
		 * if we want this to be a user thing.
		 */
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/coauthor/completions', $site_id ),
			2,
			array( 'headers' => array( 'content-type' => 'application/json' ) ),
			$content,
			'wpcom'
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ) );

		if ( wp_remote_retrieve_response_code( $response ) >= 400 ) {
			return new WP_Error( $data->code, $data->message, $data->data );
		}

		return $data;
	}

	/**
	 * Get an array of image objects back from WordPress.com based off a prompt.
	 *
	 * @param  string $prompt The prompt to generate images for.
	 * @return mixed
	 */
	public static function get_dalle_generation( $prompt ) {
		if ( ( new Status() )->is_offline_mode() ) {
			return new WP_Error(
				'dev_mode',
				__( 'CoAuthor is not available in offline mode.', 'jetpack' )
			);
		}

		$site_id = self::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( ! class_exists( 'WPCOM_Coauthor' ) ) {
				\require_lib( 'coauthor' );
			}

			return WPCOM_Coauthor::get_dalle_generation( $prompt );
		}

		/*
		 * I've taken the example of a request by site
		 * but this may need to be updated
		 * if we want this to be a user thing.
		 */
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/coauthor/images', $site_id ),
			2,
			array( 'headers' => array( 'content-type' => 'application/json' ) ),
			$prompt,
			'wpcom'
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ) );

		if ( wp_remote_retrieve_response_code( $response ) >= 400 ) {
			return new WP_Error( $data->code, $data->message, $data->data );
		}

		return $data;
	}
}
