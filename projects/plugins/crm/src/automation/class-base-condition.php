<?php
/**
 * Base Condition implementation
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Base Condition Step.
 *
 * @since 6.2.0
 * {@inheritDoc}
 */
abstract class Base_Condition extends Base_Step implements Condition {

	/**
	 * The Automation logger.
	 *
	 * @since 6.2.0
	 * @var Automation_Logger $logger The Automation logger.
	 */
	protected $logger;

	/**
	 * If the condition is met or not.
	 *
	 * @since 6.2.0
	 * @var bool If the condition is met or not.
	 */
	protected $condition_met = false;

	/**
	 * All valid operators for this condition.
	 *
	 * @since 6.2.0
	 * @var string[] $valid_operators Valid operators.
	 */
	protected $valid_operators = array();

	/**
	 * Base_Condition constructor.
	 *
	 * @since 6.2.0
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		$this->logger = Automation_Logger::instance();
	}

	/**
	 * Get the next step.
	 *
	 * @since 6.2.0
	 *
	 * @return string|int|null The next step data.
	 */
	public function get_next_step_id() {
		return ( $this->condition_met ? $this->next_step_true : $this->next_step_false );
	}

	/**
	 *  Met the condition?
	 *
	 * @since 6.2.0
	 *
	 * @return bool If the condition is met or not.
	 */
	public function condition_met(): bool {
		return $this->condition_met;
	}

	/**
	 * Checks if this is a valid operator for this condition and throws an
	 * exception if the operator is invalid.
	 *
	 * @since 6.2.0
	 *
	 * @param string $operator The operator.
	 * @return void
	 *
	 * @throws Automation_Exception If the operator is invalid for this condition.
	 */
	protected function check_for_valid_operator( string $operator ): void {
		if ( ! array_key_exists( $operator, $this->valid_operators ) ) {
			$this->condition_met = false;
			$this->logger->log( 'Invalid operator: ' . $operator );
			throw new Automation_Exception(
				/* Translators: %s is the invalid operator. */
				sprintf( __( 'Invalid condition operator: %s', 'zero-bs-crm' ), $operator ),
				Automation_Exception::CONDITION_INVALID_OPERATOR
			);
		}
	}
}
