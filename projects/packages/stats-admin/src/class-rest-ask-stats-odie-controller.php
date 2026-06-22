<?php
/**
 * The Ask Stats Odie REST Controller class.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Registers the REST route that forwards Ask Stats chat messages to Odie.
 */
class REST_Ask_Stats_Odie_Controller {
	const DEFAULT_BOT_SLUG = 'wpcom-agent-ask_stats';

	const DEFAULT_MAX_MESSAGE_LENGTH = 400;

	const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 20;

	const DEFAULT_RATE_LIMIT_WINDOW = HOUR_IN_SECONDS;

	const RATE_LIMIT_TRANSIENT_PREFIX = 'STATS_ASK_STATS_RL_';

	/**
	 * Namespace for the REST API.
	 *
	 * @var string
	 */
	public static $namespace = 'jetpack/v4/stats-app';

	/**
	 * Connection manager used for access checks.
	 *
	 * @var Connection_Manager
	 */
	protected $connection_manager;

	/**
	 * Constructor.
	 *
	 * @param Connection_Manager|null $connection_manager Connection manager.
	 */
	public function __construct( $connection_manager = null ) {
		$this->connection_manager = $connection_manager
			? $connection_manager
			: new Connection_Manager( 'jetpack' );
	}

	/**
	 * Registers the REST route for Ask Stats.
	 */
	public function register_rest_routes() {
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/ai/chat', Jetpack_Options::get_option( 'id' ) ),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'send_chat_message' ),
				'permission_callback' => array( $this, 'can_user_ask_stats_callback' ),
				'args'                => array(
					'message' => array(
						'description'       => __( 'The message to send to Ask Stats.', 'jetpack-stats-admin' ),
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => array( $this, 'validate_message' ),
					),
					'chat_id' => array(
						'description' => __( 'The Odie chat ID to continue.', 'jetpack-stats-admin' ),
						'type'        => 'integer',
						'required'    => false,
						'minimum'     => 1,
					),
				),
			)
		);
	}

	/**
	 * Checks access to Ask Stats.
	 *
	 * @return bool|WP_Error True when access is allowed, WP_Error otherwise.
	 */
	public function can_user_ask_stats_callback() {
		if ( ! $this->is_feature_enabled() ) {
			return $this->get_forbidden_error();
		}

		if ( ! ( current_user_can( 'manage_options' ) || current_user_can( 'view_stats' ) ) ) {
			return $this->get_forbidden_error();
		}

		if (
			! $this->connection_manager->is_connected()
			|| ! $this->connection_manager->is_user_connected()
		) {
			return $this->get_forbidden_error();
		}

		if ( ! $this->is_plan_eligible() ) {
			return $this->get_forbidden_error();
		}

		return true;
	}

	/**
	 * Forwards a chat message to the configured Odie bot.
	 *
	 * Only the message and server-derived site context are forwarded; the client
	 * cannot inject the bot slug or other context values.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array|WP_Error
	 */
	public function send_chat_message( WP_REST_Request $req ) {
		$bot_slug = $this->get_bot_slug();
		if ( '' === $bot_slug ) {
			return new WP_Error(
				'jetpack_stats_ask_stats_not_configured',
				esc_html__( 'Ask Stats is not configured.', 'jetpack-stats-admin' ),
				array( 'status' => 503 )
			);
		}

		$allowance_result = $this->consume_rate_limit_allowance();
		if ( is_wp_error( $allowance_result ) ) {
			return $allowance_result;
		}

		$chat_id = absint( $req->get_param( 'chat_id' ) );
		$path    = '/odie/chat/' . rawurlencode( $bot_slug );
		if ( $chat_id > 0 ) {
			$path .= '/' . $chat_id;
		}

		$body = array(
			'message' => $req->get_param( 'message' ),
			'context' => array(
				'blog_id' => (int) Jetpack_Options::get_option( 'id' ),
			),
		);

		return WPCOM_Client::request_as_user(
			$path,
			'2',
			array(
				'method'  => 'POST',
				'timeout' => 60,
			),
			$body,
			'wpcom'
		);
	}

	/**
	 * Validates the message argument.
	 *
	 * @param mixed $value Message value.
	 * @return bool
	 */
	public function validate_message( $value ) {
		if ( ! is_string( $value ) || '' === trim( $value ) ) {
			return false;
		}

		$max_length = $this->get_max_message_length();

		return mb_strlen( $value, 'UTF-8' ) <= $max_length;
	}

	/**
	 * Checks the Ask Stats feature flag.
	 *
	 * @return bool
	 */
	protected function is_feature_enabled() {
		/**
		 * Filters whether the Ask Stats REST endpoint is enabled.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Whether the endpoint is enabled.
		 */
		return (bool) apply_filters( 'jetpack_stats_ask_stats_enabled', false );
	}

	/**
	 * Gets the configured bot slug.
	 *
	 * @return string
	 */
	protected function get_bot_slug() {
		/**
		 * Filters the Odie bot slug used by Ask Stats.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $bot_slug Odie bot slug.
		 */
		return trim(
			(string) apply_filters(
				'jetpack_stats_ask_stats_bot_slug',
				self::DEFAULT_BOT_SLUG
			)
		);
	}

	/**
	 * Checks the current site plan class.
	 *
	 * Premium, business, and complete-class plans are allowed. The `business`
	 * class includes Business and Commerce SKUs; the `complete` class includes
	 * Jetpack Complete and VIP.
	 *
	 * @return bool
	 */
	protected function is_plan_eligible() {
		$plan       = Jetpack_Plan::get();
		$plan_class = isset( $plan['class'] ) ? $plan['class'] : '';

		$is_eligible = in_array( $plan_class, array( 'premium', 'business', 'complete' ), true );

		/**
		 * Filters whether the current site plan is eligible for Ask Stats.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool  $is_eligible Whether the current site plan is eligible.
		 * @param array $plan        Current site plan data.
		 */
		return (bool) apply_filters( 'jetpack_stats_ask_stats_is_plan_eligible', $is_eligible, $plan );
	}

	/**
	 * Return a WP_Error object with a forbidden error.
	 */
	protected function get_forbidden_error() {
		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-stats-admin'
		);

		return new WP_Error(
			'rest_forbidden',
			$error_msg,
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Gets the maximum Ask Stats message length.
	 *
	 * @return int
	 */
	protected function get_max_message_length() {
		/**
		 * Filters the maximum Ask Stats message length.
		 *
		 * @since $$next-version$$
		 *
		 * @param int $max_length Maximum length in characters.
		 */
		$max_length = (int) apply_filters(
			'jetpack_stats_ask_stats_max_message_length',
			self::DEFAULT_MAX_MESSAGE_LENGTH
		);

		if ( $max_length < 1 ) {
			return self::DEFAULT_MAX_MESSAGE_LENGTH;
		}

		return $max_length;
	}

	/**
	 * Gets the request-time rate-limit configuration.
	 *
	 * The `window` value is the sliding inactivity window, in seconds.
	 *
	 * @param int $blog_id Connected site ID.
	 * @param int $user_id Current user ID.
	 * @return array{enabled: bool, max_requests: int, window: int}
	 */
	protected function get_rate_limit_config( $blog_id, $user_id ) {
		$default_config = array(
			'enabled'      => true,
			'max_requests' => self::DEFAULT_RATE_LIMIT_MAX_REQUESTS,
			'window'       => self::DEFAULT_RATE_LIMIT_WINDOW,
		);

		/**
		 * Filters the local Ask Stats rate limit.
		 *
		 * Supports `enabled`, `max_requests`, and `window`. Invalid values use defaults.
		 *
		 * @since $$next-version$$
		 *
		 * @param array{enabled?: bool, max_requests?: int, window?: int} $config  Rate limit configuration.
		 * @param int $blog_id Connected site ID.
		 * @param int $user_id Current user ID.
		 */
		$filtered_config = apply_filters( 'jetpack_stats_ask_stats_rate_limit', $default_config, $blog_id, $user_id );

		if ( ! is_array( $filtered_config ) ) {
			return $default_config;
		}

		// max_requests below 1 blocks every request; a window below 1 makes the transient
		// never expire or expire instantly, breaking the guard. Fall back to the default.
		$max_requests   = (int) ( $filtered_config['max_requests'] ?? 0 );
		$window_seconds = (int) ( $filtered_config['window'] ?? 0 );

		return array(
			'enabled'      => (bool) ( $filtered_config['enabled'] ?? $default_config['enabled'] ),
			'max_requests' => $max_requests >= 1 ? $max_requests : $default_config['max_requests'],
			'window'       => $window_seconds >= 1 ? $window_seconds : $default_config['window'],
		);
	}

	/**
	 * Builds the rate-limit transient key.
	 *
	 * @param int $blog_id Connected site ID.
	 * @param int $user_id Current user ID.
	 * @return string
	 */
	protected function get_rate_limit_transient_key( $blog_id, $user_id ) {
		return self::RATE_LIMIT_TRANSIENT_PREFIX . (int) $blog_id . '_' . (int) $user_id;
	}

	/**
	 * Consumes one local rate-limit allowance for the current user.
	 *
	 * Allowed requests increment the transient counter and refresh its TTL.
	 * Blocked requests leave the counter and TTL unchanged.
	 *
	 * @return true|WP_Error
	 */
	protected function consume_rate_limit_allowance() {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		$user_id = get_current_user_id();
		$config  = $this->get_rate_limit_config( $blog_id, $user_id );

		if ( ! $config['enabled'] ) {
			return true;
		}

		$key   = $this->get_rate_limit_transient_key( $blog_id, $user_id );
		$count = get_transient( $key );
		if ( false === $count ) {
			$count = 0;
		}

		if ( (int) $count >= $config['max_requests'] ) {
			return new WP_Error(
				'jetpack_stats_ask_stats_rate_limited',
				esc_html__( 'Too many Ask Stats requests. Please try again later.', 'jetpack-stats-admin' ),
				array( 'status' => 429 )
			);
		}

		// Odie failures may still incur cost, so allowance is consumed before forwarding.
		set_transient( $key, (int) $count + 1, $config['window'] );

		return true;
	}
}
