<?php
/**
 * Jetpack CRM Automation New_Contact action.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Base_Action;

/**
 * Adds the New_Contact class.
 *
 * @since $$next-version$$
 */
class New_Contact extends Base_Action {

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/new_contact';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The title of the step.
	 */
	public static function get_title(): ?string {
		return 'New Contact Action';
	}

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The description of the step.
	 */
	public static function get_description(): ?string {
		return 'Action to add the new contact';
	}

	/**
	 * Get the type of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type of the step.
	 */
	public static function get_type(): string {
		return 'contacts';
	}

	/**
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The category of the step.
	 */
	public static function get_category(): ?string {
		return 'actions';
	}

	/**
	 * Get the allowed triggers.
	 *
	 * @since $$next-version$$
	 *
	 * @return string[]|null The allowed triggers.
	 */
	public static function get_allowed_triggers(): ?array {
		return array();
	}

	/**
	 * Add the new contact to the DAL.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $contact_data The contact data to be added.
	 */
	public function execute( array $contact_data = array() ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $zbs;

		$zbs->DAL->contacts->addUpdateContact( $this->attributes ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

}
