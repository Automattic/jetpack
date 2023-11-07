<?php

namespace Automattic\Jetpack\CRM\Automation\Tests\Mocks;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Base_Condition;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Entities\Contact;
use Automattic\Jetpack\CRM\Entities\Factories\Contact_Factory;

class Contact_Condition extends Base_Condition {

	/** @var string[] Valid contact keys */
	private $valid_contact_keys = array(
		'id',
		'name',
		'email',
		'status',
		'data',
	);

	/** @var string[] Valid operators */
	protected $valid_operators = array(
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
	 * Override set_attributes method to add some checks.
	 *
	 * @throws Automation_Exception
	 */
	public function set_attributes( array $attributes ) {
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

		if ( ! in_array( $operator, $this->valid_operators, true ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Execute the step
	 *
	 * @param Data_Type $data_type Data passed from the trigger.
	 * @return void
	 *
	 * @throws Automation_Exception
	 */
	public function execute( Data_Type $data_type ): void { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		if ( ! $data_type instanceof Contact_Data ) {
			$this->logger->log( 'Invalid data type' );
			$this->condition_met = false;
			return;
		}

		/** @var Contact $contact */
		$contact = $data_type->get_data();

		$data = Contact_Factory::tidy_data( $contact );

		if ( ! $this->is_valid_contact_data( $data ) ) {
			$this->logger->log( 'Invalid contact data' );
			$this->condition_met = false;
			return;
		}

		$field    = $this->get_attributes()['field'];
		$operator = $this->get_attributes()['operator'];
		$value    = $this->get_attributes()['value'];

		$this->logger->log( 'Condition: ' . $field . ' ' . $operator . ' ' . $value . ' => ' . $data[ $field ] );

		switch ( $operator ) {
			case 'is':
				$this->condition_met = ( $data[ $field ] === $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );
				return;
			case 'is_not':
				$this->condition_met = ( $data[ $field ] !== $value );
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

	public static function get_data_type(): string {
		return Contact_Data::class;
	}

	public static function get_category(): ?string {
		return 'testing';
	}
}
