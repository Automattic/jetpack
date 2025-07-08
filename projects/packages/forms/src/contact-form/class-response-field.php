<?php
/**
 * Response_Field class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Handles the
 *
 * Form_Response objects are there to help us interact with the form response data.
 */
class Response_Field {

	/**
	 * The key of the field.
	 *
	 * @var string
	 */
	private $key;

	/**
	 * The lable of the field.
	 *
	 * @var string
	 */
	private $label;

	/**
	 * The value of the field.
	 *
	 * @var mixed
	 */
	private $value;

	/**
	 * The type of the field.
	 *
	 * @var string
	 */
	private $type;

	/**
	 * Additional metadata for the field.
	 *
	 * @var array
	 */
	private $meta;

	/**
	 * Constructor.
	 *
	 * @param string $key   The key of the field.
	 * @param string $label The label of the field.
	 * @param mixed  $value The value of the field.
	 * @param string $type  The type of the field (default is 'basic').
	 * @param array  $meta  Additional metadata for the field (default is an empty array).
	 */
	public function __construct( $key, $label, $value, $type = 'basic', $meta = array() ) {
		$this->key   = $key;
		$this->label = $label;
		$this->value = $value;
		$this->type  = $type;
		$this->meta  = $meta;
	}

	/**
	 * Get the value of the field.
	 *
	 * @return string
	 */
	public function get_key() {
		return $this->key;
	}

	/**
	 * Get the label of the field.
	 *
	 * @return string
	 */
	public function get_label() {
		return $this->label;
	}

	/**
	 * Get the value of the field.
	 *
	 * @return mixed
	 */
	public function get_value() {
		return $this->value;
	}

	/**
	 * Get the value of the field.
	 *
	 * @return mixed
	 */
	public function render_value() {
		return $this->value;
	}

	/**
	 * Get the type of the field.
	 *
	 * @return string
	 */
	public function get_type() {
		return $this->type;
	}

	/**
	 * Get the meta of the field.
	 *
	 * @return string
	 */
	public function get_meta() {
		return $this->meta;
	}

	/**
	 * Get the serialized representation of the field.
	 *
	 * @return array
	 */
	public function serialize() {
		return array(
			'key'   => $this->get_key(),
			'label' => $this->get_label(),
			'value' => $this->get_value(),
			'type'  => $this->get_type(),
			'meta'  => $this->get_meta(),
		);
	}
	/**
	 * Create a Response_Field object from serialized data.
	 *
	 * @param array $data The serialized data.
	 *
	 * @return Response_Field|null Returns a Response_Field object or null if the data is invalid.
	 */
	public static function from_serialized( $data ) {
		if ( ! is_array( $data ) || ! isset( $data['key'] ) || ! isset( $data['value'] ) || ! isset( $data['label'] ) ) {
			return null;
		}

		return new self(
			$data['key'],
			$data['label'],
			$data['value'],
			isset( $data['type'] ) ? $data['type'] : 'basic',
			isset( $data['meta'] ) ? $data['meta'] : array()
		);
	}
}
