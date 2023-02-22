<?php
/**
 * The Stats Rest Controller class.
 * Registers the REST routes for Jetpack Forms (taken from stats-admin).
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

use Jetpack_Options;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Server;

/**
 * Handles the REST routes for Form Responses, aka Feedback.
 * Routes are defined on Jetpack Plugin as WPCOM_REST_API_V2_Endpoint_Forms_Responses.
 */
class REST_Controller extends WP_REST_Controller {
	/**
	 * Is WPCOM or not
	 *
	 * @var bool
	 */
	protected $is_wpcom;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;

		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'forms';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the REST routes.
	 *
	 * Odyssey Stats is built from `wp-calypso`, which leverages the `public-api.wordpress.com` API.
	 * The current Site ID is added as part of the route, so that the front end doesn't have to handle the differences.
	 *
	 * @access public
	 */
	public function register_rest_routes() {
		// Stats for single resource type.

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/responses',
			array(
				'methods'           => WP_REST_Server::READABLE,
				'callback'          => array( $this, 'get_responses' ),
				'permissions_check' => array( $this, 'jetpack_form_responses_permission_check' ),
				'args'              => array(
					'limit'   => array(
						'default'           => 20,
						'type'              => 'integer',
						'required'          => false,
						'validate_callback' => __CLASS__ . '::validate_posint',
					),
					'offset'  => array(
						'default'           => 0,
						'type'              => 'integer',
						'required'          => false,
						'validate_callback' => __CLASS__ . '::validate_non_neg_int',
					),
					'form_id' => array(
						'type'              => 'integer',
						'required'          => false,
						'validate_callback' => __CLASS__ . '::validate_posint',
					),
					'search'  => array(
						'type'              => 'text',
						'required'          => false,
						'validate_callback' => __CLASS__ . '::validate_string',
					),
				),
			)
		);
	}

	/**
	 * Validates that the parameter is a positive integer.
	 *
	 * @since 4.3.0
	 *
	 * @param int             $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_posint( $value, $request, $param ) {
		if ( ! is_numeric( $value ) || $value <= 0 ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be a positive integer.', 'jetpack-forms' ),
					$param
				)
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is a non-negative integer (includes 0).
	 *
	 * @since 10.4.0
	 *
	 * @param int             $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_non_neg_int( $value, $request, $param ) {
		if ( ! is_numeric( $value ) || $value < 0 ) {
			return new WP_Error(
				'invalid_param',
				/* translators: %s: The literal parameter name. Should not be translated. */
				sprintf( esc_html__( '%s must be a non-negative integer.', 'jetpack-forms' ), $param )
			);
		}
		return true;
	}

	/**
	 * Validates that the parameter is a string.
	 *
	 * @since 4.3.0
	 *
	 * @param string          $value Value to check.
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @param string          $param Name of the parameter passed to endpoint holding $value.
	 *
	 * @return bool|WP_Error
	 */
	public static function validate_string( $value, $request, $param ) {
		if ( ! is_string( $value ) ) {
			return new WP_Error(
				'invalid_param',
				sprintf(
					/* Translators: Placeholder is a parameter name. */
					esc_html__( '%s must be a string.', 'jetpack-forms' ),
					$param
				)
			);
		}
		return true;
	}

	/**
	 * Returns Jetpack Forms responses.
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return WP_REST_Response A response object containing Jetpack Forms responses.
	 */
	public function get_responses( $request ) {
		$args = array(
			'post_type'   => 'feedback',
			'post_status' => array( 'publish', 'draft' ),
		);

		if ( isset( $request['form_id'] ) ) {
			$args['post_parent'] = $request['form_id'];
		}

		if ( isset( $request['limit'] ) ) {
			$args['posts_per_page'] = $request['limit'];
		}

		if ( isset( $request['offset'] ) ) {
			$args['offset'] = $request['offset'];
		}

		if ( isset( $request['search'] ) ) {
			$args['s'] = $request['search'];
		}

		$query = new \WP_Query( $args );

		$responses = array_map(
			function ( $response ) {
				$data = \Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::parse_fields_from_content( $response->ID );

				return array(
					'id'                      => $response->ID,
					'uid'                     => $data['all_fields']['feedback_id'],
					'date'                    => get_the_date( 'c', $data ),
					'author_name'             => $data['_feedback_author'],
					'author_email'            => $data['_feedback_author_email'],
					'author_url'              => $data['_feedback_author_url'],
					'author_avatar'           => empty( $data['_feedback_author_email'] ) ? '' : get_avatar_url( $data['_feedback_author_email'] ),
					'email_marketing_consent' => $data['all_fields']['email_marketing_consent'],
					'ip'                      => $data['_feedback_ip'],
					'entry_title'             => $data['all_fields']['entry_title'],
					'entry_permalink'         => $data['all_fields']['entry_permalink'],
					'subject'                 => $data['_feedback_subject'],
					'fields'                  => array_diff_key(
						$data['all_fields'],
						array(
							'email_marketing_consent' => '',
							'entry_title'             => '',
							'entry_permalink'         => '',
							'feedback_id'             => '',
						)
					),
				);
			},
			$query->posts
		);

		return rest_ensure_response(
			array(
				'responses' => $responses,
				'total'     => $query->found_posts,
			)
		);
	}

	/**
	 * Verifies that the current user has the requird capability for viewing form responses.
	 *
	 * @return true|WP_Error Returns true if the user has the required capability, else a WP_Error object.
	 */
	public function jetpack_form_responses_permission_check() {
		if ( ! is_user_member_of_blog( get_current_user_id(), $this->get_blog_id() ) ) {
			return new WP_Error(
				'invalid_user_permission_jetpack_form_responses',
				'unauthorized',
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Get blog ID selectively depending on IS_WPCOM or not
	 */
	protected function get_blog_id() {
		return $this->is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( 'Automattic\Jetpack\Forms\REST_Controller' );
}
