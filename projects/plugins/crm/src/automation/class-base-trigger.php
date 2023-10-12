<?php
/**
 * Base Trigger implementation
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Base Trigger implementation.
 *
 * @since 6.2.0
 * {@inheritDoc}
 */
abstract class Base_Trigger implements Trigger {

	/**
	 * The workflow to execute by this trigger.
	 *
	 * @since 6.2.0
	 * @var Automation_Workflow
	 */
	protected $workflow = null;

	/**
	 * Set the workflow to execute by this trigger.
	 *
	 * @since 6.2.0
	 *
	 * @param Automation_Workflow $workflow The workflow to execute by this trigger.
	 */
	public function set_workflow( Automation_Workflow $workflow ) {
		$this->workflow = $workflow;
	}

	/**
	 * Execute the workflow.
	 *
	 * @since 6.2.0
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
	 * Initialize the trigger to listen to the desired event.
	 *
	 * @since 6.2.0
	 *
	 * @param Automation_Workflow $workflow The workflow to execute by this trigger.
	 */
	public function init( Automation_Workflow $workflow ) {
		$this->workflow = $workflow;
		$this->listen_to_event();
	}

	/**
	 * Listen to the desired WP hook action.
	 *
	 * @param string $hook_name     The hook name to listen to.
	 * @param int    $priority      The priority of the action.
	 * @param int    $accepted_args The number of arguments the action accepts.
	 * @since 6.2.0
	 *
	 */
	protected function listen_to_wp_action( string $hook_name, int $priority = 10, int $accepted_args = 1 ): void {
		add_action( $hook_name, array( $this, 'execute_workflow' ), $priority, $accepted_args );
	}

	/**
	 * Get the trigger slug.
	 *
	 * @since 6.2.0
	 *
	 * @return string The trigger slug.
	 */
	abstract public static function get_slug(): string;

	/**
	 * Get the trigger title.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The trigger title.
	 */
	abstract public static function get_title(): ?string;

	/**
	 * Get the trigger description.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The trigger description.
	 */
	abstract public static function get_description(): ?string;

	/**
	 * Get the trigger category.
	 *
	 * @since 6.2.0
	 *
	 * @return string|null The trigger category.
	 */
	abstract public static function get_category(): ?string;

	/**
	 * Listen to the desired event. It will be called by init(), it should
	 * call the execute_workflow method when the event happens.
	 *
	 * @since 6.2.0
	 *
	 * @return void
	 */
	abstract protected function listen_to_event(): void;

	/**
	 * Get the trigger as an array.
	 *
	 * The main use-case to get the trigger as an array is to prepare
	 * the items for an API response.
	 *
	 * @since 6.2.0
	 *
	 * @return array The trigger as an array.
	 */
	public static function to_array(): array {
		return array(
			'slug'        => static::get_slug(),
			'title'       => static::get_title(),
			'description' => static::get_description(),
			'category'    => static::get_category(),
		);
	}
}
