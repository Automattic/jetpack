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

}
