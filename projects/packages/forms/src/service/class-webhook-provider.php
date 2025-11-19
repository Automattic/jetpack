<?php
/**
 * Abstract Webhook Provider for Jetpack Contact Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

/**
 * Abstract class for webhook providers.
 *
 * Providers handle service-specific setup and data transformation.
 * This allows Post_To_Url to remain generic while supporting different webhook services.
 */
abstract class Webhook_Provider {
	/**
	 * Cached setup configuration
	 *
	 * @var array|false
	 */
	protected $setup;

	/**
	 * Constructor - sets up the provider with form attributes.
	 *
	 * @param array $attributes Form attributes from the contact form.
	 */
	public function __construct( $attributes ) {
		$this->setup = $this->build_setup( $attributes );
	}

	/**
	 * Build the webhook setup configuration.
	 *
	 * @param array $attributes Form attributes from the contact form.
	 * @return array|false Setup array with 'url', 'format', 'enabled', 'verified', or false if invalid/disabled.
	 */
	abstract protected function build_setup( $attributes );

	/**
	 * Get the cached setup configuration.
	 *
	 * @return array|false Setup configuration or false if invalid/disabled.
	 */
	public function get_setup() {
		return $this->setup;
	}

	/**
	 * Check if the webhook is enabled.
	 *
	 * @return bool True if the webhook is enabled and configured.
	 */
	public function is_enabled() {
		return ! empty( $this->setup['enabled'] );
	}

	/**
	 * Transform form data for this specific webhook service.
	 *
	 * Allows providers to add service-specific fields or modify existing data.
	 *
	 * @param array                                              $form_data    Base form data (field id => value pairs).
	 * @param \Automattic\Jetpack\Forms\ContactForm\Contact_Form $form         The Contact_Form instance.
	 * @param array                                              $entry_values The feedback entry values.
	 * @return array Transformed form data ready for posting.
	 */
	abstract public function transform_data( $form_data, $form, $entry_values );
}
