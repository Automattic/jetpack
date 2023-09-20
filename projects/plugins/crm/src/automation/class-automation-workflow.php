<?php
/**
 * Defines the Jetpack CRM Automation workflow base.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds the Automation_Workflow class.
 *
 * @since $$next-version$$
 */
class Automation_Workflow {

	/**
	 * The workflow id.
	 *
	 * @since $$next-version$$
	 * @var int|string
	 */
	private $id;

	/**
	 * The workflow name.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public $name;

	/**
	 * The workflow description.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public $description;

	/**
	 * The workflow category.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	public $category;

	/**
	 * The workflow triggers.
	 *
	 * @since $$next-version$$
	 * @var string[]
	 */
	public $triggers;

	/**
	 * The workflow initial step id.
	 *
	 * @since $$next-version$$
	 * @var int|string|null
	 */
	public $initial_step_id;

	/**
	 * The workflow steps list
	 *
	 * @since $$next-version$$
	 * @var array
	 */
	public $steps;

	/**
	 * The workflow active status.
	 *
	 * @since $$next-version$$
	 * @var bool
	 */
	public $active;

	/**
	 * The version of the workflow.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	public $version = 1;

	/**
	 * The automation engine.
	 *
	 * @since $$next-version$$
	 * @var Automation_Engine
	 */
	private $automation_engine;

	/**
	 * The automation logger.
	 *
	 * @since $$next-version$$
	 * @var Automation_Logger
	 */
	private $logger;

	/**
	 * Automation_Workflow constructor.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $workflow_data The workflow data to be constructed.
	 */
	public function __construct( array $workflow_data ) {
		$this->id              = $workflow_data['id'] ?? null;
		$this->triggers        = $workflow_data['triggers'] ?? array();
		$this->steps           = $workflow_data['steps'] ?? array();
		$this->initial_step_id = $workflow_data['initial_step'] ?? null;
		$this->name            = $workflow_data['name'];
		$this->description     = $workflow_data['description'] ?? '';
		$this->category        = $workflow_data['category'] ?? '';
		$this->active          = $workflow_data['is_active'] ?? true;
	}

	/**
	 * Get the id of this workflow.
	 *
	 * This will either be a string if the workflow is registered in the codebase,
	 * or an integer if it is a custom workflow stored in the database.
	 *
	 * @since $$next-version$$
	 *
	 * @return int|string The workflow id.
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * Set the triggers within the workflow given an array of triggers.
	 *
	 * @since $$next-version$$
	 *
	 * @param string[] $triggers An array of triggers to be set.
	 */
	public function set_triggers( array $triggers ) {
		$this->triggers = $triggers;
	}

	/**
	 * Get the trigger names of this workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @return string[] The workflow trigger names.
	 */
	public function get_triggers(): array {
		return $this->triggers;
	}

	/**
	 * Instance the triggers of this workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @throws Workflow_Exception Throws an exception if there is an issue initializing the trigger.
	 */
	public function init_triggers() {

		$this->get_logger()->log( 'Initializing Workflow triggers...' );

		if ( ! $this->is_active() ) {
			$this->get_logger()->log( 'The workflow is not active. No triggers loaded.' );
			return;
		}

		foreach ( $this->get_triggers() as $trigger_slug ) {
			try {
				$trigger_class = $this->get_engine()->get_trigger_class( $trigger_slug );

				/** @var Base_Trigger $trigger */
				$trigger = new $trigger_class();
				$trigger->init( $this );

				$this->get_logger()->log( 'Trigger initialized: ' . $trigger_slug );

			} catch ( Automation_Exception $e ) {
				throw new Workflow_Exception(
					/* Translators: %s is the error message to be included in the exception string. */
					sprintf( __( 'An error happened initializing the trigger. %s', 'zero-bs-crm' ), $e->getMessage() ),
					Workflow_Exception::ERROR_INITIALIZING_TRIGGER
				);
			}
		}
	}

	/**
	 * Set initial step of this workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param int|string|null $step_id The initial step id.
	 */
	public function set_initial_step_id( $step_id ) {
		$this->initial_step_id = $step_id;
	}

	/**
	 * Set the step list of this workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $steps The steps of the workflow.
	 */
	public function set_steps( array $steps ) {
		$this->steps = $steps;
	}

	/**
	 * Get the workflow as an array to be stored or send as JSON.
	 *
	 * @since $$next-version$$
	 *
	 * @return array The workflow as an array.
	 */
	public function get_workflow_array(): array {
		return array(
			'name'         => $this->name,
			'description'  => $this->description,
			'category'     => $this->category,
			'is_active'    => $this->active,
			'triggers'     => $this->triggers,
			'initial_step' => $this->initial_step_id,
		);
	}

	/**
	 * Get the initial step data of this workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @return array|null The initial step data of the workflow.
	 */
	public function get_initial_step(): ?array {
		return $this->steps[ $this->initial_step_id ] ?? null;
	}

	/**
	 * Get the initial step of this workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param int|string $id The step id.
	 * @return array|null The step data instance.
	 */
	public function get_step( $id ): ?array {
		if ( $id === null ) {
			return null;
		}

		return $this->steps[ $id ] ?? null;
	}

	/**
	 * Start the workflow execution once a trigger is activated.
	 *
	 * @since $$next-version$$
	 *
	 * @param Trigger $trigger An instance of the Trigger class.
	 * @param array   $data All relevant object data to be passed through the workflow.
	 * @return bool Whether the workflow was executed successfully.
	 *
	 * @throws Workflow_Exception Throws an exception if there is an issue executing the workflow.
	 */
	public function execute( Trigger $trigger, array $data ): bool {
		return $this->get_engine()->execute_workflow( $this, $trigger, $data );
	}

	/**
	 * Turn on the workflow.
	 *
	 * @since $$next-version$$
	 */
	public function turn_on() {
		$this->active = true;
	}

	/**
	 * Turn off the workflow.
	 *
	 * @since $$next-version$$
	 */
	public function turn_off() {
		$this->active = false;
	}

	/**
	 * Check if the workflow is active.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool Whether the workflow is active.
	 */
	public function is_active(): bool {
		return $this->active;
	}

	/**
	 * Add a trigger to this workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $string The name of the trigger to add.
	 */
	public function add_trigger( string $string ) {
		$this->triggers[] = $string;
	}

	/**
	 * Set the automation engine.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Engine $engine An instance of the Automation_Engine class.
	 * @return void
	 * @throws Workflow_Exception|Automation_Exception Exception if there is an issue with the Engine.
	 */
	public function set_engine( Automation_Engine $engine ): void {
		$this->automation_engine = $engine;

		// Process and check the steps when the engine is set.
		$this->process_steps();
	}

	/**
	 * Get the automation engine.
	 *
	 * @since $$next-version$$
	 *
	 * @return Automation_Engine Return an instance of the Automation_Engine class.
	 *
	 * @throws Workflow_Exception Throws an exception if there is no engine instance.
	 */
	protected function get_engine(): Automation_Engine {
		if ( ! $this->automation_engine instanceof Automation_Engine ) {
			throw new Workflow_Exception(
				/* Translators: %s The ID of the workflow. */
				sprintf( '[%s] Cannot run workflow logic without an engine instance', $this->get_id() ),
				Workflow_Exception::MISSING_ENGINE_INSTANCE
			);
		}

		return $this->automation_engine;
	}

	/**
	 * Set Logger.
	 *
	 * @since $$next-version$$
	 *
	 * @param Automation_Logger $logger An instance of the Automation_Logger class.
	 * @return void
	 */
	public function set_logger( Automation_Logger $logger ) {
		$this->logger = $logger;
	}

	/**
	 * Get Logger.
	 *
	 * @since $$next-version$$
	 *
	 * @return Automation_Logger Return an instance of the Automation_Logger class.
	 */
	public function get_logger(): Automation_Logger {
		return $this->logger ?? Automation_Logger::instance();
	}

	/**
	 * Process the steps of the workflow.
	 *
	 * @throws Workflow_Exception|Automation_Exception Exception if there is an issue processing the steps.
	 * @since $$next-version$$
	 */
	private function process_steps() {
		foreach ( $this->steps as $step_data ) {
			if ( ! isset( $step_data['class_name'] ) ) {
				$step_data['class_name'] = $this->get_engine()->get_step_class( $step_data['slug'] );
			}
		}
	}
}
