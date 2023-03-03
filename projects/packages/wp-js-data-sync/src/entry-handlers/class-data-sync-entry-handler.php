<?php
/**
 * Every data sync entry should extend this class
 * and implement the methods that are necessary.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamComment
// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamName
// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamTag
// phpcs:disable Squiz.Commenting.FunctionComment.MissingReturn
// phpcs:disable Generic.Commenting.DocComment.MissingShort
// phpcs:disable Squiz.Commenting.FunctionComment.Missing
// phpcs:disable Squiz.Commenting.ClassComment.Missing
// phpcs:disable Squiz.Commenting.FileComment.Missing

namespace Automattic\Jetpack\WP_JS_Data_Sync;

abstract class Data_Sync_Entry_Handler {

	/**
	 * Array of error messages that may occur
	 * during validation, sanitization, etc.
	 *
	 * @var string[]
	 */
	private $errors = array();

	/**
	 * On get,
	 * Transform the value after it's retrieved from storage.
	 *
	 * @param mixed $value Value to transform.
	 *
	 * @return mixed
	 */
	public function transform( $value ) {
		return $value;
	}

	/**
	 * On set - Step 1:
	 * Parse the value before it's validated.
	 *
	 * This can be used for things like `json_decode` or casting types.
	 *
	 * @param mixed $value Value to parse.
	 * @see add_error - Use this method to provide feedback if the value can't be parsed.
	 *
	 * @return mixed
	 */
	public function parse( $value ) {
		return $value;
	}

	/**
	 * On set - Step 2:
	 * Validate the value before it's sanitized.
	 *
	 * Use this method to provide feedback if the value isn't valid.
	 * Using `$this->add_error()` will prevent the value from being stored.
	 *
	 * @param mixed $value Value to validate.
	 * @see add_error - Use this method to provide feedback if the value is not valid.
	 *
	 * @return bool true on success, false on failure.
	 */
	public function validate( $value ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return ! $this->has_errors();
	}

	/**
	 * On set - Step 3:
	 * Sanitize the value before saving it storage.
	 *
	 * This method assumes that the value has already been parsed and validated
	 * and shouldn't throw any errors.
	 *
	 * This method is required method for all entry handlers,
	 * because values shouldn't be stored unsanitized.
	 * Wash your values, friends.
	 *
	 * @param mixed $value Value to sanitize.
	 *
	 * @return mixed
	 */
	abstract public function sanitize( $value );

	/**
	 * Get the default value if a value is not found.
	 * Default: false.
	 *
	 * @return bool
	 */
	public function get_default_value() {
		return false;
	}

	public function has_errors() {
		return ! empty( $this->errors );
	}

	public function get_errors() {
		return implode( "\n", $this->errors );
	}

	/**
	 * During `set`:
	 * If a value isn't valid in some way, an error should be added.
	 * If the errors array is not empty, the value will not be stored.
	 *
	 * This is handled by Endpoint::handle_post().
	 *
	 * @see Endpoint::handle_post()
	 *
	 * @param string $message Error message.
	 */
	protected function add_error( $message ) {
		$this->errors[] = $message;
	}
}
