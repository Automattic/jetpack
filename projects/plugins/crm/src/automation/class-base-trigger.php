<?php
/**
 * Base Trigger implementation
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Base Trigger implementation.
 *
 * @inheritDoc
 */
abstract class Base_Trigger implements Trigger {

	/** @var Automation_Workflow The workflow to execute by this trigger. */
	protected $workflow = null;

	/**
	 * Set the workflow to execute by this trigger.
	 *
	 * @param Automation_Workflow $workflow The workflow to execute by this trigger.
	 */
	public function set_workflow( Automation_Workflow $workflow ) {
		$this->workflow = $workflow;
	}

	/**
	 * Execute the workflow.
	 *
	 * @param array $data The data to pass to the workflow.
	 * @throws Automation_Exception Throws an exception if no workflow is defined.
	 */
	public function execute_workflow( array $data = null ) {
		if ( $this->workflow ) {
			$this->workflow->execute( $this, $data );
		}
	}

	/**
	 * Initialize the trigger to listen to the desired event.
	 *
	 * @param Automation_Workflow $workflow The workflow to execute by this trigger.
	 */
	public function init( Automation_Workflow $workflow ) {
		$this->workflow = $workflow;
		$this->listen_to_event();
	}

	/**
	 * Get the trigger slug.
	 *
	 * @return string
	 */
	abstract public static function get_slug(): string;

	/**
	 * Get the trigger title.
	 *
	 * @return string
	 */
	abstract public static function get_title(): ?string;

	/**
	 * Get the trigger description.
	 *
	 * @return string|null
	 */
	abstract public static function get_description(): ?string;

	/**
	 * Get the trigger category.
	 *
	 * @return string
	 */
	abstract public static function get_category(): ?string;

	/**
	 * Listen to the desired event. It will be called by init(), it should
	 * call the execute_workflow method when the event happens.
	 */
	abstract protected function listen_to_event();
}
