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
 * Represents the submitted form data of an invividual field.
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
	 * Get the value of the field for rendering.
	 *
	 * @return string
	 */
	public function get_render_value() {
		if ( $this->is_file_field() ) {
			$files = array();
			foreach ( $this->value['files'] as &$file ) {
				if ( ! isset( $file['size'] ) || ! isset( $file['file_id'] ) ) {
					// this shouldn't happen, todo: log this
					continue;
				}
				$file_name = isset( $file['name'] ) ? $file['name'] : __( 'Attached file', 'jetpack-forms' );
				$file_size = isset( $file['size'] ) ? size_format( $file['size'] ) : '';
				$files[]   = $file_name . ' (' . $file_size . ')';
			}
			$this->value = $files;
			// If the value is a file field, we can return it as a JSON string
		}
		if ( is_array( $this->value ) ) {
			// If the value is an array, we can return it as a JSON string.
			return implode( ', ', $this->value );
		}
		// This method is deprecated, use render_value instead.
		return $this->value;
	}

	/**
	 * Get the value of the field for the API.
	 *
	 * @return string
	 */
	public function get_render_api_value() {

		if ( $this->is_file_field() ) {
			$files = array();
			foreach ( $this->value['files'] as &$file ) {
				if ( ! isset( $file['size'] ) || ! isset( $file['file_id'] ) ) {
					// this shouldn't happen, todo: log this
					continue;
				}
				$file_id                = absint( $file['file_id'] );
				$file['file_id']        = $file_id;
				$file['size']           = size_format( $file['size'] );
				$file['url']            = apply_filters( 'jetpack_unauth_file_download_url', '', $file_id );
				$file['is_previewable'] = $this->is_previewable_file( $file );
				$files[]                = $file;
			}
			$this->value['files'] = $files;
			return $this->value;
		}

		if ( is_array( $this->value ) ) {
			// If the value is an array, we can return it as a JSON string.
			return implode( ', ', $this->value );
		}
		// This method is deprecated, use render_value instead.
		return $this->value;
	}

	/**
	 * Check if the field is a file field.
	 *
	 * @return bool
	 */
	public function is_file_field() {
		if ( 'file' === $this->type ) {
			return true;
		}
		if ( 'basic' === $this->type ) {
			// If the type is basic, we can check if the value is an array and contains files.
			if ( is_array( $this->value ) && isset( $this->value['files'] ) && is_array( $this->value['files'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if the field has a file
	 *
	 * @return bool
	 */
	public function has_file() {
		if ( $this->is_file_field() ) {
			return count( $this->value['files'] ) > 0;
		}

		return false;
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
	 * @param string|null $meta_key The key of the meta to retrieve. If null, returns all meta.
	 *
	 * @return string
	 */
	public function get_meta( $meta_key = null ) {

		if ( $meta_key ) {
			if ( isset( $this->meta[ $meta_key ] ) ) {
				return $this->meta[ $meta_key ];
			}
			return null;
		}
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

	/**
	 * Checks if the file is previewable based on its type or extension.
	 *
	 * @param array $file File data.
	 * @return bool True if the file is previewable, false otherwise.
	 */
	private function is_previewable_file( $file ) {
		$file_type = strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) );
		// Check if the file is previewable based on its type or extension.
		// Note: This is a simplified check and does not match if the file is allowed to be uploaded by the server.
		$previewable_types = array( 'jpg', 'jpeg', 'png', 'gif', 'webp' );
		return in_array( $file_type, $previewable_types, true );
	}
}
