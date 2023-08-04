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
 * @since $$next-version$$
 * {@inheritDoc}
 */
abstract class Base_Trigger implements Trigger {

	/**
	 * The workflow to execute by this trigger.
	 *
	 * @since $$next-version$$
	 * @var Automation_Workflow
	 */
	protected $workflow = null;

	/**
	 * Set the workflow to execute by this trigger.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Workflow $workflow The workflow to execute by this trigger.
	 */
	public function set_workflow( Automation_Workflow $workflow ) {
		$this->workflow = $workflow;
	}

	/**
	 * Execute the workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param array|null $data The data to pass to the workflow.
	 *
	 * @throws Automation_Exception Exception when the workflow is executed.
	 */
	public function execute_workflow( array $data = null ) {
		if ( $this->workflow ) {
			$this->workflow->execute( $this, $data );
		}
	}

	/**
	 * Initialize the trigger to listen to the desired event.
	 *
	 * @since $$next-version$$
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
	 * @since $$next-version$$
	 *
	 * @return string The trigger slug.
	 */
	abstract public static function get_slug(): string;

	/**
	 * Get the trigger title.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The trigger title.
	 */
	abstract public static function get_title(): ?string;

	/**
	 * Get the trigger description.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The trigger description.
	 */
	abstract public static function get_description(): ?string;

	/**
	 * Get the trigger category.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The trigger category.
	 */
	abstract public static function get_category(): ?string;

	/**
	 * Listen to the desired event. It will be called by init(), it should
	 * call the execute_workflow method when the event happens.
	 *
	 * @since $$next-version$$
	 */
	abstract protected function listen_to_event();
}
