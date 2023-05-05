<?php

namespace Automattic\Jetpack\CRM\Automation;

abstract class Base_Condition extends Base_Step implements Condition {
	
	protected $next_step_true  = null;
	protected $next_step_false = null;
	protected $condition_met   = false;
	
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
	 * Get the next step
	 *
	 * @return array|null
	 */
	public function get_next_step(): ?array {
		return $this->condition_met ? $this->next_step_true : $this->next_step_false;
	}
	
	/**
	 *  Met the condition?
	 * 
	 * @return bool
	 */
	public function condition_met(): bool {
		return $this->condition_met;
	}
}
