<?php
/**
 * Base Data Type class.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

use Automattic\Jetpack\CRM\Automation\Data_Type_Exception;

/**
 * Abstract Data Type base class.
 *
 * @since 6.2.0
 */
abstract class Data_Type_Base implements Data_Type {

	/**
	 * The data that represents an instance of the data type.
	 *
	 * This could be of any shape: a class, object, array, or a simple value.
	 *
	 * @since 6.2.0
	 * @var mixed
	 */
	protected $data = null;

	/**
	 * The previous data that represents an instance of the data type.
	 * This could be of any shape: a class, object, array, or a simple value.
	 *
	 * @since 6.2.0
	 * @var mixed
	 */
	protected $previous_data = null;

	/**
	 * Constructor.
	 *
	 * @since 6.2.0
	 *
	 * @param mixed $data A data that represents the data type.
	 * @param mixed $previous_data A data that represents the previous data.
	 *
	 * @throws Data_Type_Exception If the data do not look valid.
	 */
	public function __construct( $data, $previous_data = null ) {
		if ( ! $this->validate_data( $data ) || ( $previous_data !== null && ! $this->validate_data( $previous_data ) ) ) {
			throw new Data_Type_Exception(
				sprintf( 'Invalid data for data type: %s', static::class ),
				Data_Type_Exception::INVALID_DATA
			);
		}
		$this->data          = $data;
		$this->previous_data = $previous_data;
	}

	/**
	 * Validate the data.
	 *
	 * This method is meant to validate if the data has the expected inheritance
	 * or structure and will be used to throw a fatal error if not.
	 *
	 * @since 6.2.0
	 *
	 * @param mixed $data The data to validate.
	 * @return bool Whether the data is valid.
	 */
	abstract public function validate_data( $data ): bool;

	/**
	 * Get the data.
	 *
	 * We do not know what shape this takes. It could be a class, object,
	 * or array. We leave it up to the data type to decide.
	 *
	 * @since 6.2.0
	 *
	 * @return mixed
	 */
	public function get_data() {
		return $this->data;
	}

	/**
	 * Get the previous data.
	 *
	 * We do not know what shape this takes. It could be a class, object,
	 * or array. We leave it up to the data type to decide.
	 *
	 * @since 6.2.0
	 *
	 * @return mixed
	 */
	public function get_previous_data() {
		return $this->previous_data;
	}
}
