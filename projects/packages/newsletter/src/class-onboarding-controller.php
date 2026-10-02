<?php
/**
 * Newsletter onboarding checklist skip settings.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use WP_Error;

/**
 * Stores Newsletter onboarding checklist skips as individual site options.
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
	 * Validate a list of skipped step IDs.
	 *
	 * @param mixed $step_ids Step IDs to validate.
	 * @return true|WP_Error
	 */
	public static function validate_skipped_steps( $step_ids ) {
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

		return true;
	}

	/**
	 * Add skipped step IDs without removing existing skips.
	 *
	 * @param mixed $step_ids Step IDs to add.
	 * @return string[]|WP_Error
	 */
	public static function add_skipped_steps( $step_ids ) {
		$validation = self::validate_skipped_steps( $step_ids );
		if ( is_wp_error( $validation ) ) {
			return $validation;
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
