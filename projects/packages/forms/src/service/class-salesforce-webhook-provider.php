<?php
/**
 * Salesforce Webhook Provider for Jetpack Contact Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

/**
 * Salesforce-specific webhook provider.
 *
 * Handles Salesforce Web-to-Lead integration with service-specific
 * configuration and data transformation.
 */
class Salesforce_Webhook_Provider extends Webhook_Provider {
	/**
	 * Build Salesforce Web-to-Lead setup.
	 *
	 * @param array $attributes Form attributes.
	 * @return array|false Salesforce setup configuration or false if salesforceData is not present.
	 */
	protected function build_setup( $attributes ) {
		// Only handle if salesforceData is present
		if ( empty( $attributes['salesforceData'] ) || empty( $attributes['salesforceData']['organizationId'] ) ) {
			return false;
		}

		return array(
			'url'      => 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8',
			'format'   => 'urlencoded',
			'enabled'  => true,
			'verified' => true,
		);
	}

	/**
	 * Add Salesforce-specific fields to form data.
	 *
	 * Adds the organization ID (oid) and lead source fields required
	 * by Salesforce Web-to-Lead.
	 *
	 * @param array                                              $form_data    Base form data.
	 * @param \Automattic\Jetpack\Forms\ContactForm\Contact_Form $form         The Contact_Form instance.
	 * @param array                                              $entry_values The feedback entry values.
	 * @return array Form data with Salesforce-specific fields added.
	 */
	public function transform_data( $form_data, $form, $entry_values ) {
		if ( ! empty( $form->attributes['salesforceData']['organizationId'] ) ) {
			$form_data['oid']         = sanitize_text_field( $form->attributes['salesforceData']['organizationId'] );
			$form_data['lead_source'] = $entry_values['entry_permalink'] ?? '';
		}

		return $form_data;
	}
}
