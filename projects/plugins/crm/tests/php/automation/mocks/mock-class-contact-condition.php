<?php

namespace Automattic\Jetpack\CRM\Automation\Tests\Mocks;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Base_Condition;

class Contact_Condition extends Base_Condition {

	/** @var Automation_Logger */
	private $logger;

	/** @var string[] Valid contact keys */
	private $valid_contact_keys = array(
		'id',
		'name',
		'email',
		'status',
		'data',
	);

	/** @var string[] Valid operators */
	private $valid_operators = array(
		'is',
		'is_not',
	);

	/** @var string[] Valid condition attributes */
	private $valid_attributes = array(
		'field',
		'operator',
		'value',
	);

	/**
	 * Contact_Condition constructor.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );
		
		$this->logger = Automation_Logger::instance();
	}

	/**
	 * Override set_attributes method to add some checks.
	 * 
	 * @throws Automation_Exception
	 */
	public function set_attributes( array $attributes )
	{
		parent::set_attributes( $attributes );

		if ( ! $this->has_valid_attributes() && ! $this->has_valid_operator() ) {
			throw new Automation_Exception( 'Invalid attributes for contact condition' );
		}
	}

	/**
	 * Validate the contact data
	 *
	 * @param array $contact_data
	 * @return bool
	 */
	private function is_valid_contact_data( array $contact_data ): bool {

		// Check if the contact data has at least the required keys
		if ( ! array_intersect( $this->valid_contact_keys, array_keys( $contact_data ) ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Check if the condition has valid attributes
	 *
	 * @return bool
	 */
	private function has_valid_attributes(): bool {

		if ( ! array_intersect( $this->valid_attributes, array_keys( $this->get_attributes() ) ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Check if it has a valid operator
	 *
	 * @return bool
	 */
	private function has_valid_operator(): bool {

		$operator = $this->get_attributes()['operator'];

		if ( ! in_array( $operator, $this->valid_operators ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Execute the step
	 *
	 * @param array $data
	 * @return void
	 * @throws Automation_Exception
	 */
	public function execute( array $data ) {

		if ( ! $this->is_valid_contact_data( $data ) ) {
			$this->logger->log( 'Invalid contact data', $data );
			$this->condition_met = false;
			return;
		}

		$field    = $this->get_attributes()['field'];
		$operator = $this->get_attributes()['operator'];
		$value    = $this->get_attributes()['value'];

		$this->logger->log( 'Condition: ' . $field . ' ' . $operator . ' ' . $value . ' => ' . $data['data'][ $field ] );

		switch ( $operator ) {
			case 'is':
				$this->condition_met = ( $data['data'][ $field ] === $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );
				return;
			case 'is_not':
				$this->condition_met = ( $data['data'][ $field ] !== $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );
				return;
		}

		$this->condition_met = false;
		$this->logger->log( 'Invalid operator: ' . $operator );

		throw new Automation_Exception( 'Invalid operator: ' . $operator );
	}

	public static function get_slug(): string {
		return 'contact_status';
	}

	public static function get_title(): ?string {
		return 'Contact Status';
	}

	public static function get_description(): ?string {
		return 'Check if a contact has a specific status';
	}

	public static function get_type(): string {
		return 'condition';
	}

	public static function get_category(): ?string {
		return 'testing';
	}

	public static function get_allowed_triggers(): ?array {
		return array( 'jpcrm/contact_created' );
	}
}
