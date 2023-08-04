<?php
/**
 * Base Condition implementation
 *
 * @package automattic/jetpack-crm
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
	 * @var array|null Next step data if it meets the condition.
	 */
	protected $next_step_true = null;
	/**
	 * @var array|null Next step data if it does not meet the condition.
	 */
	protected $next_step_false = null;
	/**
	 * @var bool If the condition is met or not.
	 */
	protected $condition_met = false;

	/**
	 * Base_Condition constructor.
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		$this->next_step_true  = $step_data['next_step_true'] ?? null;
		$this->next_step_false = $step_data['next_step_false'] ?? null;
	}

	/**
	 * Get the next step.
	 *
	 * @return array|null The next step data.
	 */
	public function get_next_step(): ?array {
		return ( $this->condition_met ? $this->next_step_true : $this->next_step_false );
	}

	/**
	 *  Met the condition?
	 *
	 * @return bool If the condition is met or not.
	 */
	public function condition_met(): bool {
		return $this->condition_met;
	}
}
