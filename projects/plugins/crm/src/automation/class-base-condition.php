<?php
/**
 * Base Condition implementation
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Base Condition Step.
 *
 * @since $$next-version$$
 * {@inheritDoc}
 */
abstract class Base_Condition extends Base_Step implements Condition {

	/**
	 * The Automation logger.
	 *
	 * @since $$next-version$$
	 * @var Automation_Logger $logger The Automation logger.
	 */
	protected $logger;

	/**
	 * The next step if the condition is met.
	 *
	 * @since $$next-version$$
	 * @var array|null
	 */
	protected $next_step_true = null;

	/**
	 * The next step if the condition is not met.
	 *
	 * @since $$next-version$$
	 * @var array|null
	 */
	protected $next_step_false = null;

	/**
	 * If the condition is met or not.
	 *
	 * @since $$next-version$$
	 * @var bool If the condition is met or not.
	 */
	protected $condition_met = false;

	/**
	 * All valid operators for this condition.
	 *
	 * @since $$next-version$$
	 * @var string[] $valid_operators Valid operators.
	 */
	protected $valid_operators = array();

	/**
	 * Base_Condition constructor.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		$this->next_step_true  = $step_data['next_step_true'] ?? null;
		$this->next_step_false = $step_data['next_step_false'] ?? null;
		$this->logger          = Automation_Logger::instance();
	}

	/**
	 * Get the next step.
	 *
	 * @since $$next-version$$
	 *
	 * @return array|null The next step data.
	 */
	public function get_next_step(): ?array {
		return ( $this->condition_met ? $this->next_step_true : $this->next_step_false );
	}

	/**
	 *  Met the condition?
	 *
	 * @since $$next-version$$
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
	 * @since $$next-version$$
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
