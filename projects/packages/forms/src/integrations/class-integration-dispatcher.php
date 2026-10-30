<?php
/**
 * Hands new form responses to the integrations that asked for them.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Integrations;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Feedback;

/**
 * Calls the `on_submission` callback of every available integration a form has enabled.
 *
 * Integrations could hook `grunion_after_feedback_post_inserted` themselves — Form_Webhooks
 * does. Going through the registry instead means one integration is declared in one place, and
 * that the settings lookup, the spam check and the enabled check happen once, consistently,
 * rather than being re-implemented (and re-got-wrong) by each integration.
 */
class Integration_Dispatcher {

	/**
	 * Start listening for new responses.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'grunion_after_feedback_post_inserted', array( __CLASS__, 'dispatch' ), 10, 4 );
	}

	/**
	 * Notify integrations of a new response.
	 *
	 * @param int   $post_id      Feedback post ID.
	 * @param array $fields       Contact_Form_Field instances for the submission.
	 * @param bool  $is_spam      Whether Akismet flagged the submission as spam.
	 * @param array $entry_values Extra values recorded with the submission.
	 * @return void
	 */
	public static function dispatch( $post_id, $fields, $is_spam, $entry_values ) {
		// Spam is never handed on. An integration that wants spam can hook
		// grunion_after_feedback_post_inserted directly and decide for itself.
		if ( $is_spam ) {
			return;
		}

		$form = self::get_form_from_fields( $fields );

		if ( ! $form ) {
			return;
		}

		Built_In_Integrations::register();

		$feedback = Feedback::get( $post_id );

		if ( ! $feedback ) {
			return;
		}

		foreach ( Integration_Registry::available() as $slug => $args ) {
			if ( empty( $args['on_submission'] ) || ! is_callable( $args['on_submission'] ) ) {
				continue;
			}

			$settings = Integration_Settings::get( $slug, $form->attributes );

			if ( empty( $settings['enabled'] ) ) {
				continue;
			}

			/**
			 * A single associative argument, so that later additions do not change the
			 * signature every registered callback has to match.
			 */
			call_user_func(
				$args['on_submission'],
				array(
					'settings'     => $settings,
					'post_id'      => $post_id,
					'form'         => $form,
					'feedback'     => $feedback,
					'entry_values' => $entry_values,
				)
			);
		}
	}

	/**
	 * Find the form a submission belongs to.
	 *
	 * The form is not passed to the hook, but every field holds a reference to it.
	 *
	 * @param array $fields Contact_Form_Field instances.
	 * @return Contact_Form|null
	 */
	private static function get_form_from_fields( $fields ) {
		if ( ! is_array( $fields ) ) {
			return null;
		}

		foreach ( $fields as $field ) {
			if ( ! empty( $field->form ) && $field->form instanceof Contact_Form ) {
				return $field->form;
			}
		}

		return null;
	}
}
