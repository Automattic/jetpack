<?php
/**
 * Abstract class for password rules.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Abstract class for password rules.
 */
abstract class Password_Rule {
	/**
	 * Dependency injection for the validation service.
	 *
	 * @var Validation_Service
	 */
	protected $validation_service;

	/**
	 * The ID of the rule.
	 *
	 * @var string
	 */
	public $id;

	/**
	 * The label for the rule.
	 *
	 * @example "Not used recently"
	 *
	 * @var string
	 */
	public $label;

	/**
	 * The description for the rule.
	 *
	 * @example "Reusing old passwords may increase security risks. A fresh password improves protection."
	 *
	 * @var string
	 */
	public $description;

	/**
	 * The error message for the rule.
	 *
	 * @example "<strong>Error:</strong> The password was used recently."
	 *
	 * @var string
	 */
	public $error;

	/**
	 * Constructor for the Password_Rule class.
	 *
	 * @param Validation_Service $validation_service The validation service instance.
	 */
	public function __construct( Validation_Service $validation_service ) {
		$this->validation_service = $validation_service;
		$this->description        = $this->get_description();
		$this->label              = $this->get_label();
		$this->error              = $this->get_error();
	}

	/**
	 * The callback function for the rule.
	 *
	 * @param string $password The password to validate.
	 * @param array  $userdata (Optional) The user data.
	 *
	 * @return bool
	 */
	abstract public function callback( string $password, ?array $userdata = null ): bool;

	/**
	 * Get the description of the rule.
	 *
	 * @return string
	 */
	abstract protected function get_description(): string;

	/**
	 * Get the short label for the rule.
	 *
	 * @return string
	 */
	abstract protected function get_label(): string;

	/**
	 * Get the error message of the rule.
	 *
	 * @return string
	 */
	abstract protected function get_error(): string;
}
