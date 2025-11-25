<?php
/**
 * Generic Webhook Provider for Jetpack Contact Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

/**
 * Generic webhook provider for standard webhook integrations.
 *
 * This provider handles the standard postToUrl attribute configuration
 * without any service-specific modifications.
 */
class Generic_Webhook_Provider extends Webhook_Provider {
	/**
	 * Build setup from postToUrl attribute.
	 *
	 * @param array $attributes Form attributes.
	 * @return array|false Setup configuration or false if invalid/disabled.
	 */
	protected function build_setup( $attributes ) {
		$defaults = array(
			'url'      => '',
			'verified' => false,
			'format'   => 'json',
			'enabled'  => false,
		);

		$setup = wp_parse_args(
			! empty( $attributes['postToUrl'] ) ? $attributes['postToUrl'] : array(),
			$defaults
		);

		if ( empty( $setup['enabled'] ) || empty( $setup['url'] ) ) {
			return false;
		}

		if ( ! in_array( $setup['format'], array( 'urlencoded', 'json' ), true ) ) {
			return false;
		}

		return $setup;
	}

	/**
	 * No transformation needed for generic webhooks.
	 *
	 * Generic webhooks receive the data as-is from the form.
	 *
	 * @param array                                              $form_data    Base form data.
	 * @param \Automattic\Jetpack\Forms\ContactForm\Contact_Form $form         The Contact_Form instance.
	 * @param array                                              $entry_values The feedback entry values.
	 * @return array Unmodified form data.
	 */
	public function transform_data( $form_data, $form, $entry_values ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $form_data;
	}
}
