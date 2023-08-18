<?php
/**
 * Transaction Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

use Automattic\Jetpack\CRM\Automation\Data_Type_Exception;

/**
 * Transaction Data Type.
 *
 * @since $$next-version$$
 */
class Data_Type_Transaction extends Data_Type_Base {

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return 'transaction';
	}

	/**
	 * Constructor.
	 *
	 * We process the entity data before passing it to validation.
	 * You can learn more in the "unify_data" method.
	 *
	 * @see self::unify_data()
	 *
	 * @param mixed $entity The contact entity data.
	 * @return void
	 *
	 * @throws Data_Type_Exception If the entity is not valid.
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
	 * Validate entity data.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity Transaction entity data to validate.
	 * @return bool Whether the entity is valid or not.
	 */
	public function validate_entity( $entity ): bool {
		// We do not have a model/object class for transactions, so as the very
		// minimum we need to make sure we received an array since that's the
		// response the CRM DAL returns.
		if ( ! is_array( $entity ) ) {
			return false;
		}

		// We could look for even more fields, but this should ensure we have
		// received a data array that looks valid enough.
		$required_fields = array(
			'id',
			'status',
			'type',
			'title',
			'currency',
			'tax',
			'total',
			'lineitems',
		);

		foreach ( $required_fields as $field ) {
			if ( ! isset( $entity[ $field ] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Unify how CRM transaction data is formatted.
	 *
	 * zbsDAL_transactions::getTransaction() formats the data when it returns results
	 * but some hooks like "transaction.update" passes an older, raw, formatting which
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

		if ( ! isset( $entity['data'] ) ) {
			return $entity;
		}

		// The only current example of different data just requires us to flatten the format.
		$new_entity       = $entity['data'];
		$new_entity['id'] = $entity['id'];

		return $new_entity;
	}

}
