<?php
/**
 * Newsletter onboarding checklist skip settings.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Status\Host;
use WP_Error;
use WP_REST_Request;

/**
 * Registers the virtual settings field used to persist skipped onboarding steps.
 */
class Onboarding_Controller {

	/**
	 * Step IDs accepted by the add-only Skip setting.
	 *
	 * @var string[]
	 */
	const STEP_IDS = array( 'subscribe_form', 'subscribers', 'send_newsletter' );

	/**
	 * REST settings field containing the current skipped steps.
	 *
	 * @var string
	 */
	const FIELD_NAME = 'jetpack_newsletter_onboarding_skipped_steps';

	/**
	 * A write error to return after the REST settings controller finishes.
	 *
	 * @var WP_Error|null
	 */
	private static $rest_update_error;

	/**
	 * Register the virtual field on the existing local settings endpoint.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_fields' ) );
	}

	/**
	 * Register the Newsletter onboarding setting on non-Simple sites.
	 *
	 * @return void
	 */
	public static function register_fields() {
		if ( ( new Host() )->is_wpcom_simple() || ! Feature_Flags::is_enabled( Settings::OVERVIEW_FEATURE_FLAG ) ) {
			return;
		}

		register_setting(
			'general',
			self::FIELD_NAME,
			array(
				'type'         => 'array',
				'default'      => array(),
				'show_in_rest' => array(
					'schema' => array(
						'description' => __( 'Newsletter onboarding steps skipped for this site.', 'jetpack-newsletter' ),
						'type'        => 'array',
						'context'     => array( 'view', 'edit' ),
						'items'       => array(
							'type' => 'string',
							'enum' => self::STEP_IDS,
						),
					),
				),
			)
		);

		add_filter( 'rest_pre_get_setting', array( __CLASS__, 'get_rest_setting' ), 10, 3 );
		add_filter( 'rest_pre_update_setting', array( __CLASS__, 'update_rest_setting' ), 10, 4 );
		add_filter( 'rest_request_after_callbacks', array( __CLASS__, 'filter_rest_response' ), 10, 3 );
	}

	/**
	 * Get the projected Skip field value without creating an aggregate option.
	 *
	 * @param mixed  $value Current REST settings value.
	 * @param string $name  Setting name.
	 * @param array  $args  Setting registration arguments.
	 * @return mixed
	 */
	public static function get_rest_setting( $value, $name, $args ) {
		if ( self::FIELD_NAME !== $name || self::FIELD_NAME !== ( $args['option_name'] ?? null ) ) {
			return $value;
		}

		return self::get_skipped_steps();
	}

	/**
	 * Add skipped IDs and prevent the Settings API from writing the virtual field.
	 *
	 * @param bool   $preempt Whether another callback already handled the setting.
	 * @param string $name    Setting name.
	 * @param mixed  $value   Requested value.
	 * @param array  $args    Setting registration arguments.
	 * @return bool
	 */
	public static function update_rest_setting( $preempt, $name, $value, $args ) {
		if ( self::FIELD_NAME !== $name || self::FIELD_NAME !== ( $args['option_name'] ?? null ) ) {
			return $preempt;
		}

		self::$rest_update_error = null;
		$result                  = self::add_skipped_steps( $value );
		if ( is_wp_error( $result ) ) {
			self::$rest_update_error = $result;
		}

		return true;
	}

	/**
	 * Surface any option-write error captured while the Settings API handled a request.
	 *
	 * @param mixed           $response REST response.
	 * @param array           $handler Matched route handler.
	 * @param WP_REST_Request $request Request object.
	 * @return mixed
	 */
	public static function filter_rest_response( $response, $handler, $request ) {
		if ( ! self::$rest_update_error ) {
			return $response;
		}

		$error                   = self::$rest_update_error;
		self::$rest_update_error = null;
		if (
			'/wp/v2/settings' !== $request->get_route() ||
			'POST' !== $request->get_method() ||
			'update_item' !== ( $handler['callback'][1] ?? null )
		) {
			return $response;
		}

		return $error;
	}

	/**
	 * Get skipped step IDs from the site's individual boolean options.
	 *
	 * @return string[]
	 */
	public static function get_skipped_steps() {
		$skipped_steps = array();

		foreach ( self::STEP_IDS as $step_id ) {
			if ( get_option( self::get_option_name( $step_id ), false ) ) {
				$skipped_steps[] = $step_id;
			}
		}

		return $skipped_steps;
	}

	/**
	 * Add skipped step IDs without removing existing skips.
	 *
	 * @param mixed $step_ids Step IDs to add.
	 * @return string[]|WP_Error
	 */
	public static function add_skipped_steps( $step_ids ) {
		if ( ! is_array( $step_ids ) || array_values( $step_ids ) !== $step_ids ) {
			return new WP_Error(
				'rest_invalid_param',
				__( 'Skipped newsletter onboarding steps must be an array of step IDs.', 'jetpack-newsletter' ),
				array( 'status' => 400 )
			);
		}

		foreach ( $step_ids as $step_id ) {
			if ( ! is_string( $step_id ) || ! in_array( $step_id, self::STEP_IDS, true ) ) {
				return new WP_Error(
					'rest_invalid_param',
					__( 'A skipped newsletter onboarding step is invalid.', 'jetpack-newsletter' ),
					array( 'status' => 400 )
				);
			}
		}

		foreach ( self::STEP_IDS as $step_id ) {
			if ( ! in_array( $step_id, $step_ids, true ) ) {
				continue;
			}

			$option_name = self::get_option_name( $step_id );
			if ( add_option( $option_name, true, '', false ) ) {
				continue;
			}

			// A concurrent request may have added the same option first.
			if ( get_option( $option_name, false ) ) {
				continue;
			}

			return new WP_Error(
				'newsletter_onboarding_skip_write_failed',
				sprintf(
					/* translators: %s: Newsletter onboarding step ID. */
					__( 'Could not save the skipped newsletter onboarding step: %s.', 'jetpack-newsletter' ),
					$step_id
				),
				array( 'status' => 500 )
			);
		}

		return self::get_skipped_steps();
	}

	/**
	 * Get the per-site option name for a step.
	 *
	 * @param string $step_id Step ID.
	 * @return string
	 */
	public static function get_option_name( $step_id ) {
		return 'jetpack_newsletter_onboarding_skipped_' . $step_id;
	}
}
