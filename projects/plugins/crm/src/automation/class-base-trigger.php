<?php
/**
 * Base Trigger implementation
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
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
	 * @param mixed|null $data The data to pass to the workflow.
	 * @param mixed|null $previous_data The previous data to pass to the workflow.
	 *
	 * @throws Workflow_Exception Exception when the workflow is executed.
	 */
	public function execute_workflow( $data = null, $previous_data = null ) {
		// Encapsulate the $data into a Data_Type object.
		$data_type_class = static::get_data_type();

		$data_type = new $data_type_class( $data, $previous_data );

		if ( $this->workflow ) {
			$this->workflow->execute( $this, $data_type );
		}
	}

	/**
	 * Get the trigger as an array.
	 *
	 * The main use-case to get the trigger as an array is to prepare
	 * the items for an API response.
	 *
	 * @since $$next-version$$
	 *
	 * @return array The trigger as an array.
	 */
	public function to_array(): array {
		return array(
			'slug'        => static::get_slug(),
			'title'       => static::get_title(),
			'description' => static::get_description(),
			'category'    => static::get_category(),
		);
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
