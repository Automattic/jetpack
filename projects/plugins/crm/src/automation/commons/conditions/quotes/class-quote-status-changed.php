<?php
/**
 * Jetpack CRM Automation Quote_Status_Changed condition.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Conditions;

use Automattic\Jetpack\CRM\Automation\Attribute_Definition;
use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Base_Condition;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Automation\Data_Types\Quote_Data;
use Automattic\Jetpack\CRM\Entities\Quote;

/**
 * Quote_Status_Changed condition class.
 *
 * @since 6.2.0
 */
class Quote_Status_Changed extends Base_Condition {

	/**
	 * Quote_Status_Changed constructor.
	 *
	 * @since 6.2.0
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		$this->valid_operators = array(
			'is'     => __( 'Is', 'zero-bs-crm' ),
			'is_not' => __( 'Is not', 'zero-bs-crm' ),
		);

		$this->set_attribute_definitions(
			array(
				new Attribute_Definition( 'operator', __( 'Operator', 'zero-bs-crm' ), __( 'Determines how the status is compared to the specified value.', 'zero-bs-crm' ), Attribute_Definition::SELECT, $this->valid_operators ),
				new Attribute_Definition( 'value', __( 'Value', 'zero-bs-crm' ), __( 'Value to compare with the status.', 'zero-bs-crm' ), Attribute_Definition::TEXT ),
			)
		);
	}

	/**
	 * Executes the condition. If the condition is met, the value stored in the
	 * attribute $condition_met is set to true; otherwise, it is set to false.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data The data this condition has to evaluate.
	 * @return void
	 *
	 * @throws Automation_Exception If an invalid operator is encountered.
	 */
	protected function execute( Data_Type $data ) {
		/** @var Quote $quote */
		$quote = $data->get_data();

		$status_value = ( $quote->accepted > 0 ) ? 'accepted' : ( $quote->template > 0 ? 'published' : 'draft' );
		$operator     = $this->get_attributes()['operator'];
		$value        = $this->get_attributes()['value'];

		$this->check_for_valid_operator( $operator );
		$this->logger->log( 'Condition: quote status ' . $operator . ' ' . $value . ' => ' . $status_value );

		switch ( $operator ) {
			case 'is':
				$this->condition_met = ( $status_value === $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			case 'is_not':
				$this->condition_met = ( $status_value !== $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			default:
				$this->condition_met = false;
				throw new Automation_Exception(
					/* Translators: %s is the unimplemented operator. */
					sprintf( __( 'Valid but unimplemented operator: %s', 'zero-bs-crm' ), $operator ),
					Automation_Exception::CONDITION_OPERATOR_NOT_IMPLEMENTED
				);
		}
	}

	/**
	 * Get the title for the quote status changed condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The title 'Quote Status Changed'.
	 */
	public static function get_title(): string {
		return __( 'Quote Status Changed', 'zero-bs-crm' );
	}

	/**
	 * Get the slug for the quote status changed condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug 'quote_status_changed'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/quote_status_changed';
	}

	/**
	 * Get the description for the quote status changed condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if a quote status change matches an expected value', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @since 6.2.0
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Quote_Data::class;
	}

	/**
	 * Get the category of the quote status changed condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The category 'jpcrm/quote_condition'.
	 */
	public static function get_category(): string {
		return __( 'Quote', 'zero-bs-crm' );
	}
}
