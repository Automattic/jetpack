<?php
/**
 * API helper for the AI blocks.
 *
 * @package automattic/jetpack
 * @since 11.8
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Status;

/**
 * Class Jetpack_AI_Helper
 *
 * @since 11.8
 */
class Jetpack_AI_Helper {
	/**
	 * Allow new completion every X seconds. Will return cached result otherwise.
	 *
	 * @var int
	 */
	public static $text_completion_cooldown_seconds = 60;

	/**
	 * Cache images for a prompt for a month.
	 *
	 * @var int
	 */
	public static $image_generation_cache_timeout = MONTH_IN_SECONDS;

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
				__( 'Sorry, you are not allowed to access Jetpack AI help on this site.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Get the name of the transient for image generation. Unique per prompt and allows for reuse of results for the same prompt across entire WPCOM.
	 * I expext "puppy" to always be from cache.
	 *
	 * @param  string $prompt - Supplied prompt.
	 */
	public static function transient_name_for_image_generation( $prompt ) {
		return 'jetpack_openai_image_' . md5( $prompt );
	}

	/**
	 * Get the name of the transient for text completion. Unique per user, but not per text. Serves more as a cooldown.
	 */
	public static function transient_name_for_completion() {
		return 'jetpack_openai_completion_' . get_current_user_id(); // Cache for each user, so that other users dont get weird cached version from somebody else.
	}

	/**
	 * Get text back from WordPress.com based off a starting text.
	 *
	 * @param  string $content The content that's already been typed in the block.
	 * @return mixed
	 */
	public static function get_gpt_completion( $content ) {
		$content = wp_strip_all_tags( $content );
		$cache   = get_transient( self::transient_name_for_completion() );
		if ( $cache ) {
			return $cache;
		}

		if ( ( new Status() )->is_offline_mode() ) {
			return new WP_Error(
				'dev_mode',
				__( 'Jetpack AI is not available in offline mode.', 'jetpack' )
			);
		}

		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( ! class_exists( 'OpenAI' ) ) {
				\require_lib( 'openai' );
			}

			$result = ( new OpenAI( 'openai' ) )->request_gpt_completion( $content );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
			// In case of Jetpack we are setting a transient on the WPCOM and not the remote site. I think the 'get_current_user_id' may default for the connection owner at this point but we'll deal with this later.
			set_transient( self::transient_name_for_completion(), $result, self::$text_completion_cooldown_seconds );
			return $result;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/jetpack-ai/completions', $site_id ),
			2,
			array(
				'method'  => 'post',
				'headers' => array( 'content-type' => 'application/json' ),
			),
			wp_json_encode(
				array(
					'content' => $content,
				)
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ) );

		if ( wp_remote_retrieve_response_code( $response ) >= 400 ) {
			return new WP_Error( $data->code, $data->message, $data->data );
		}
		set_transient( self::transient_name_for_completion(), $data, self::$text_completion_cooldown_seconds );

		return $data;
	}

	/**
	 * Get an array of image objects back from WordPress.com based off a prompt.
	 *
	 * @param  string $prompt The prompt to generate images for.
	 * @return mixed
	 */
	public static function get_dalle_generation( $prompt ) {
		$cache = get_transient( self::transient_name_for_image_generation( $prompt ) );
		if ( $cache ) {
			return $cache;
		}

		if ( ( new Status() )->is_offline_mode() ) {
			return new WP_Error(
				'dev_mode',
				__( 'Jetpack AI is not available in offline mode.', 'jetpack' )
			);
		}

		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( ! class_exists( 'OpenAI' ) ) {
				\require_lib( 'openai' );
			}

			$result = ( new OpenAI( 'openai' ) )->request_dalle_generation( $prompt );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
			set_transient( self::transient_name_for_image_generation( $prompt ), $result, self::$image_generation_cache_timeout );
			return $result;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/jetpack-ai/images/generations', $site_id ),
			2,
			array(
				'method'  => 'post',
				'headers' => array( 'content-type' => 'application/json' ),
			),
			wp_json_encode(
				array(
					'prompt' => $prompt,
				)
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ) );

		if ( wp_remote_retrieve_response_code( $response ) >= 400 ) {
			return new WP_Error( $data->code, $data->message, $data->data );
		}
		set_transient( self::transient_name_for_image_generation( $prompt ), $data, self::$image_generation_cache_timeout );

		return $data;
	}
}
