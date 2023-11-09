<?php
/**
 * API helper for the AI blocks.
 *
 * @package automattic/jetpack
 * @since 11.8
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Search\Plan as Search_Plan;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Visitor;

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
	public static $text_completion_cooldown_seconds = 15;

	/**
	 * Cache images for a prompt for a month.
	 *
	 * @var int
	 */
	public static $image_generation_cache_timeout = MONTH_IN_SECONDS;

	/**
	 * Cache AI-assistant feature for ten seconds.
	 *
	 * @var int
	 */
	public static $ai_assistant_feature_cache_timeout = 10;

	/**
	 * Stores the number of JetpackAI calls in case we want to mark AI-assisted posts some way.
	 *
	 * @var int
	 */
	public static $post_meta_with_ai_generation_number = '_jetpack_ai_calls';

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
	 * Return true if these features should be active on the current site.
	 * Currently, it's limited to WPCOM Simple and Atomic.
	 */
	public static function is_enabled() {
		$default = false;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$default = true;
		} elseif ( ( new Automattic\Jetpack\Status\Host() )->is_woa_site() ) {
			$default = true;
		}

		/**
		 * Filter whether the AI features are enabled in the Jetpack plugin.
		 *
		 * @since 11.8
		 *
		 * @param bool $default Are AI features enabled? Defaults to false.
		 */
		return apply_filters( 'jetpack_ai_enabled', $default );
	}

	/**
	 * Return true if the AI chat feature should be active on the current site.
	 *
	 * @todo IS_WPCOM (the endpoints need to be updated too).
	 *
	 * @return bool
	 */
	public static function is_ai_chat_enabled() {
		$default = false;

		$connection = new Manager();
		$plan       = new Search_Plan();
		if ( $connection->is_connected() && $plan->supports_search() ) {
			$default = true;
		}

		/**
		 * Filter whether the AI chat feature is enabled in the Jetpack plugin.
		 *
		 * @since 12.6
		 *
		 * @param bool $default Is AI chat enabled? Defaults to false.
		 */
		return apply_filters( 'jetpack_ai_chat_enabled', $default );
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
	 * Get the name of the transient for AI assistance feature. Unique per user.
	 *
	 * @param  int $blog_id - Blog ID to get the transient name for.
	 * @return string
	 */
	public static function transient_name_for_ai_assistance_feature( $blog_id ) {
		return 'jetpack_openai_ai_assistance_feature_' . $blog_id;
	}

	/**
	 * Mark the edited post as "touched" by AI stuff.
	 *
	 * @param  int $post_id Post ID for which the content is being generated.
	 * @return void
	 */
	private static function mark_post_as_ai_assisted( $post_id ) {
		if ( ! $post_id ) {
			return;
		}
		$previous = get_post_meta( $post_id, self::$post_meta_with_ai_generation_number, true );
		if ( ! $previous ) {
			$previous = 0;
		} elseif ( ! is_numeric( $previous ) ) {
			// Data corrupted, nothing to do.
			return;
		}
		$new_value = intval( $previous ) + 1;
		update_post_meta( $post_id, self::$post_meta_with_ai_generation_number, $new_value );
	}

	/**
	 * Get text back from WordPress.com based off a starting text.
	 *
	 * @param  string $content    The content provided to send to the AI.
	 * @param  int    $post_id    Post ID for which the content is being generated.
	 * @param  bool   $skip_cache Skip cache and force a new request.
	 * @return mixed
	 */
	public static function get_gpt_completion( $content, $post_id, $skip_cache = false ) {
		$content = wp_strip_all_tags( $content );
		$cache   = get_transient( self::transient_name_for_completion() );
		if ( $cache && ! $skip_cache ) {
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

			// Set the content for chatGPT endpoint
			$data = array(
				array(
					'role'    => 'user',
					'content' => $content,
				),
			);

			$result = ( new OpenAI( 'openai', array( 'post_id' => $post_id ) ) )->request_chat_completion( $data );

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			$response = $result->choices[0]->message->content;

			// In case of Jetpack we are setting a transient on the WPCOM and not the remote site. I think the 'get_current_user_id' may default for the connection owner at this point but we'll deal with this later.
			set_transient( self::transient_name_for_completion(), $response, self::$text_completion_cooldown_seconds );
			self::mark_post_as_ai_assisted( $post_id );
			return $response;
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

		// Do not cache if it should be skipped.
		if ( ! $skip_cache ) {
			set_transient( self::transient_name_for_completion(), $data, self::$text_completion_cooldown_seconds );
		}
		self::mark_post_as_ai_assisted( $post_id );

		return $data;
	}

	/**
	 * Get an array of image objects back from WordPress.com based off a prompt.
	 *
	 * @param  string $prompt The prompt to generate images for.
	 * @param  int    $post_id Post ID for which the content is being generated.
	 * @return mixed
	 */
	public static function get_dalle_generation( $prompt, $post_id ) {
		$cache = get_transient( self::transient_name_for_image_generation( $prompt ) );
		if ( $cache ) {
			self::mark_post_as_ai_assisted( $post_id );
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

			$result = ( new OpenAI( 'openai', array( 'post_id' => $post_id ) ) )->request_dalle_generation( $prompt );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
			set_transient( self::transient_name_for_image_generation( $prompt ), $result, self::$image_generation_cache_timeout );
			self::mark_post_as_ai_assisted( $post_id );
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
		self::mark_post_as_ai_assisted( $post_id );

		return $data;
	}

	/**
	 * Get an object with useful data about the requests made to the AI.
	 *
	 * @return mixed
	 */
	public static function get_ai_assistance_feature() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		// Try to pick the AI Assistant feature from cache.
		$transient_name = self::transient_name_for_ai_assistance_feature( $blog_id );
		$cache          = get_transient( $transient_name );
		if ( $cache ) {
			return $cache;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$has_ai_assistant_feature = \wpcom_site_has_feature( 'ai-assistant' );
			if ( ! class_exists( 'OpenAI' ) ) {
				\require_lib( 'openai' );
			}

			if ( ! class_exists( 'OpenAI_Limit_Usage' ) ) {
				if ( is_readable( WP_CONTENT_DIR . '/lib/openai/openai-limit-usage.php' ) ) {
					require_once WP_CONTENT_DIR . '/lib/openai/openai-limit-usage.php';
				} else {
					return new WP_Error(
						'openai_limit_usage_not_found',
						__( 'OpenAI_Limit_Usage class not found.', 'jetpack' )
					);
				}
			}

			if ( ! class_exists( 'OpenAI_Request_Count' ) ) {
				if ( is_readable( WP_CONTENT_DIR . '/lib/openai/openai-request-count.php' ) ) {
					require_once WP_CONTENT_DIR . '/lib/openai/openai-request-count.php';
				} else {
					return new WP_Error(
						'openai_request_count_not_found',
						__( 'OpenAI_Request_Count class not found.', 'jetpack' )
					);
				}
			}

			if ( ! class_exists( 'WPCOM\Jetpack_AI\Usage\Helper' ) ) {
				if ( is_readable( WP_CONTENT_DIR . '/lib/jetpack-ai/usage/helper.php' ) ) {
					require_once WP_CONTENT_DIR . '/lib/jetpack-ai/usage/helper.php';
				} else {
					return new WP_Error(
						'jetpack_ai_usage_helper_not_found',
						__( 'WPCOM\Jetpack_AI\Usage\Helper class not found.', 'jetpack' )
					);
				}
			}

			$blog_id        = get_current_blog_id();
			$is_over_limit  = \OpenAI_Limit_Usage::is_blog_over_request_limit( $blog_id );
			$requests_limit = \OpenAI_Limit_Usage::get_free_requests_limit( $blog_id );
			$requests_count = \OpenAI_Request_Count::get_count( $blog_id );

			// Check if the site requires an upgrade.
			$require_upgrade = $is_over_limit && ! $has_ai_assistant_feature;

			// Determine the upgrade type
			$upgrade_type = wpcom_is_vip( $blog_id ) ? 'vip' : 'default';

			return array(
				'has-feature'          => $has_ai_assistant_feature,
				'is-over-limit'        => $is_over_limit,
				'requests-count'       => $requests_count,
				'requests-limit'       => $requests_limit,
				'usage-period'         => WPCOM\Jetpack_AI\Usage\Helper::get_period_data( $blog_id ),
				'site-require-upgrade' => $require_upgrade,
				'upgrade-type'         => $upgrade_type,
				'current-tier'         => WPCOM\Jetpack_AI\Usage\Helper::get_current_tier( $blog_id ),
				'next-tier'            => WPCOM\Jetpack_AI\Usage\Helper::get_next_tier( $blog_id ),
				'tier-plans'           => WPCOM\Jetpack_AI\Usage\Helper::get_tier_plans_list(),
			);
		}

		$request_path = sprintf( '/sites/%d/jetpack-ai/ai-assistant-feature', $blog_id );

		$wpcom_request = Client::wpcom_json_api_request_as_user(
			$request_path,
			'v2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			),
			null,
			'wpcom'
		);

		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 === $response_code ) {
			$ai_assistant_feature_data = json_decode( wp_remote_retrieve_body( $wpcom_request ), true );

			// Cache the AI Assistant feature, for Jetpack sites.
			set_transient( $transient_name, $ai_assistant_feature_data, self::$ai_assistant_feature_cache_timeout );

			return $ai_assistant_feature_data;
		} else {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => $response_code )
			);
		}
	}
}
