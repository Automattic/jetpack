<?php
/**
 * Contact Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

/**
 * Contact Data Type
 *
 * @package Automattic\Jetpack\CRM
 * @since $$next-version$$
 */
class Data_Type_Contact extends Data_Type_Base {

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return 'contact';
	}

	/**
	 * Constructor.
	 *
	 * We process the entity data before passing it to validation.
	 * You can learn more in the "unify_contact_data" method.
	 *
	 * @see Data_Type_Contact::unify_data()
	 *
	 * @param mixed $entity The contact entity data.
	 * @return void
	 *
	 * @throws \Automattic\Jetpack\CRM\Automation\Data_Type_Exception If the entity is not valid.
	 */
	public function __construct( $entity ) {
		$entity = $this->unify_data( $entity );

		parent::__construct( $entity );
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_id() {
		return $this->entity['id'];
	}

	/**
	 * Validate the contact entity data.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity Contact entity data to validate.
	 * @return bool Whether the entity is valid or not.
	 */
	public function validate_entity( $entity ): bool {
		// We do not have a model/object class for contacts, so as the very
		// minimum we need to make sure we received an array since that's
		// the response the CRM DAL returns.
		if ( ! is_array( $entity ) ) {
			return false;
		}

		// We could look for even more fields, but this should ensure we have
		// received a data array that looks valid enough.
		$required_fields = array(
			'id',
			'email',
			'status',
			'fname',
			'lname',
		);

		foreach ( $required_fields as $field ) {
			if ( ! isset( $entity[ $field ] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Unify how CRM contact data is formatted.
	 *
	 * zbsDAL_contacts::getContact() formats the data when it returns results
	 * but some hooks like "contact.new" passes an older, raw, formatting which
	 * means we have two different types of formats being passed around.
	 * This method attempts to unify the formatting, so we only have to work
	 * with a single version of the formatting (the most recent one).
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity The data we want to potentially prepare.
	 * @return array The unified data.
	 */
	public function unify_data( $entity ): array {
		if ( ! is_array( $entity ) ) {
			return $entity;
		}

		if ( ! isset( $entity['customerMeta'] ) ) {
			return $entity;
		}

		$new_entity       = $entity['customerMeta'];
		$new_entity['ID'] = $entity['id'];

		$contacts_dal = new \zbsDAL_contacts();
		return $contacts_dal->tidy_contact( (object) $new_entity );
	}

}
