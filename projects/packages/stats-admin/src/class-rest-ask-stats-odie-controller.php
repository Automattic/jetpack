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
	 * Initializes the connection manager.
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
	 * Checks the feature, capability, connection, and plan gates.
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
	 * Validates that the message is a non-empty string.
	 *
	 * @param mixed $value Message value.
	 * @return bool
	 */
	public function validate_message( $value ) {
		return is_string( $value ) && '' !== trim( $value );
	}

	/**
	 * Checks the Ask Stats feature gate.
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
	 * Premium and business-class plans are allowed. The `business` class includes
	 * Business and Commerce SKUs in Current_Plan (see jetpack-plans PLAN_DATA).
	 *
	 * @return bool
	 */
	protected function is_plan_eligible() {
		$plan       = Jetpack_Plan::get();
		$plan_class = isset( $plan['class'] ) ? $plan['class'] : '';

		$is_eligible = in_array( $plan_class, array( 'premium', 'business' ), true );

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
	 * Creates the forbidden error response.
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
}
