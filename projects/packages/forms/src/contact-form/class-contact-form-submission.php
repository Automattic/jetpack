<?php
/**
 * Contact_Form_Submission class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Stores data from a form submission.
 */
class Contact_Form_Submission {
	/**
	 * The form ID.
	 *
	 * @var int
	 */
	private $id;

	/**
	 * The form hash.
	 *
	 * @var string
	 */
	private $hash;

	/**
	 * Form validation errors.
	 *
	 * Keyed by the field id.
	 *
	 * @var \WP_Error
	 */
	private $errors;

	/**
	 * Form values.
	 *
	 * Keyed by the field id.
	 *
	 * @var array
	 */
	private $values;

	/**
	 * Constructor.
	 *
	 * @param string $form_id The form ID.
	 * @param string $form_hash The form hash.
	 */
	public function __construct( $form_id, $form_hash ) {
		$this->id     = $form_id;
		$this->hash   = $form_hash;
		$this->errors = new \WP_Error();
		$this->values = array();
	}

	/**
	 * Add an error to the submission.
	 *
	 * @param string $hash The form hash.
	 * @param string $field_id The field ID.
	 * @param string $error The error message.
	 */
	public function add_error( $hash, $field_id, $error ) {
		if ( $hash !== $this->hash ) {
			return;
		}

		$this->errors->add( $field_id, $error );
	}

	/**
	 * Get the errors for a form.
	 *
	 * @return \WP_Error
	 */
	public function get_errors() {
		return $this->errors;
	}

	/**
	 * Whether the submission has errors.
	 *
	 * @return bool
	 */
	public function has_errors() {
		return $this->errors->has_errors();
	}

	/**
	 * Add a value to the submission.
	 *
	 * @param string $hash The form hash.
	 * @param string $field_id The field ID.
	 * @param mixed  $value The value to add.
	 */
	public function add_value( $hash, $field_id, $value ) {
		if ( $hash !== $this->hash ) {
			return;
		}

		$this->values[ $field_id ] = $value;
	}

	/**
	 * Get the values for a form.
	 *
	 * @return array
	 */
	public function get_values() {
		return $this->values;
	}

	/**
	 * Process the submission.
	 */
	public function process() {
	}
}
