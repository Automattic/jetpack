<?php
/**
 * Defines the Jetpack CRM Automation workflow base.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;

/**
 * Adds the Automation_Workflow class.
 *
 * @since 6.2.0
 */
class Automation_Workflow {

	/**
	 * The workflow id.
	 *
	 * @since 6.2.0
	 * @var int|string
	 */
	protected $id;

	/**
	 * The CRM site ID the workflow belongs to.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	protected $zbs_site;

	/**
	 * The WP User who created the workflow.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	protected $zbs_owner;

	/**
	 * The workflow name.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	public $name;

	/**
	 * The workflow description.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	public $description;

	/**
	 * The workflow category.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	public $category;

	/**
	 * The workflow triggers.
	 *
	 * @since 6.2.0
	 * @var string[]
	 */
	public $triggers;

	/**
	 * The workflow initial step id.
	 *
	 * @since 6.2.0
	 * @var int|string|null
	 */
	public $initial_step;

	/**
	 * The workflow steps list
	 *
	 * @since 6.2.0
	 * @var array
	 */
	public $steps;

	/**
	 * The workflow active status.
	 *
	 * @since 6.2.0
	 * @var bool
	 */
	public $active;

	/**
	 * The version of the workflow.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	protected $version;

	/**
	 * A timestamp that reflects when the workflow was created.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	protected $created_at;

	/**
	 * A timestamp that reflects when the workflow was last updated.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	protected $updated_at;

	/**
	 * The automation engine.
	 *
	 * @since 6.2.0
	 * @var Automation_Engine
	 */
	protected $automation_engine;

	/**
	 * The automation logger.
	 *
	 * @since 6.2.0
	 * @var Automation_Logger
	 */
	protected $logger;

	/**
	 * Automation_Workflow constructor.
	 *
	 * @since 6.2.0
	 *
	 * @param array $workflow_data The workflow data to be constructed.
	 */
	public function __construct( array $workflow_data ) {
		$this->id           = $workflow_data['id'] ?? null;
		$this->zbs_site     = $workflow_data['zbs_site'] ?? -1;
		$this->zbs_owner    = $workflow_data['zbs_owner'] ?? -1;
		$this->triggers     = $workflow_data['triggers'] ?? array();
		$this->steps        = $workflow_data['steps'] ?? array();
		$this->initial_step = $workflow_data['initial_step'] ?? '';
		$this->name         = $workflow_data['name'] ?? '';
		$this->description  = $workflow_data['description'] ?? '';
		$this->category     = $workflow_data['category'] ?? '';
		$this->active       = $workflow_data['active'] ?? false;
		$this->version      = $workflow_data['version'] ?? 1;
		$this->created_at   = $workflow_data['created_at'] ?? null;
		$this->updated_at   = $workflow_data['updated_at'] ?? null;
	}

	/**
	 * Get the id of this workflow.
	 *
	 * This will either be a string if the workflow is registered in the codebase,
	 * or an integer if it is a custom workflow stored in the database.
	 *
	 * @since 6.2.0
	 *
	 * @return int|string The workflow id.
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * Get the CRM site the workflow should run on.
	 *
	 * @since 6.2.0
	 *
	 * @return int
	 */
	public function get_zbs_site(): int {
		return $this->zbs_site;
	}

	/**
	 * Set the CRM site teh workflow should run on.
	 *
	 * @since 6.2.0
	 *
	 * @param int $site The CRM site the workflow should run on.
	 * @return void
	 */
	public function set_zbs_site( int $site ): void {
		$this->zbs_site = $site;
	}

	/**
	 * Get the CRM owner/creator of the workflow.
	 *
	 * @since 6.2.0
	 *
	 * @return int
	 */
	public function get_zbs_owner(): int {
		return $this->zbs_owner;
	}

	/**
	 * Set the CRM owner/creator of the workflow.
	 *
	 * @since 6.2.0
	 *
	 * @param int $owner The CRM owner/creator of the workflow.
	 * @return void
	 */
	public function set_zbs_owner( int $owner ): void {
		$this->zbs_owner = $owner;
	}

	/**
	 * Get name.
	 *
	 * @since 6.2.0
	 *
	 * @return string
	 */
	public function get_name(): string {
		return $this->name;
	}

	/**
	 * Set name.
	 *
	 * @since 6.2.0
	 *
	 * @param string $name The workflow name.
	 * @return void
	 */
	public function set_name( string $name ): void {
		$this->name = $name;
	}

	/**
	 * Get description.
	 *
	 * @since 6.2.0
	 *
	 * @return string
	 */
	public function get_description(): string {
		return $this->description;
	}

	/**
	 * Set description.
	 *
	 * @since 6.2.0
	 *
	 * @param string $description The workflow description.
	 * @return void
	 */
	public function set_description( string $description ): void {
		$this->description = $description;
	}

	/**
	 * Get category.
	 *
	 * @since 6.2.0
	 *
	 * @return string
	 */
	public function get_category(): string {
		return $this->category;
	}

	/**
	 * Set category.
	 *
	 * @since 6.2.0
	 *
	 * @param string $category The workflow category.
	 * @return void
	 */
	public function set_category( string $category ): void {
		$this->category = $category;
	}

	/**
	 * Get the database schema version.
	 *
	 * @since 6.2.0
	 *
	 * @return int
	 */
	public function get_version(): int {
		return $this->version;
	}

	/**
	 * Get the timestamp for when the workflow was created.
	 *
	 * @since 6.2.0
	 *
	 * @return int|null
	 */
	public function get_created_at(): ?int {
		return $this->created_at;
	}

	/**
	 * Get the timestamp for when the workflow was last updated.
	 *
	 * @since 6.2.0
	 *
	 * @return int|null
	 */
	public function get_updated_at(): ?int {
		return $this->updated_at;
	}

	/**
	 * Set the triggers within the workflow given an array of triggers.
	 *
	 * @since 6.2.0
	 *
	 * @param string[] $triggers An array of triggers to be set.
	 * @return void
	 */
	public function set_triggers( array $triggers ): void {
		$this->triggers = $triggers;
	}

	/**
	 * Get the trigger names of this workflow.
	 *
	 * @since 6.2.0
	 *
	 * @return string[] The workflow trigger names.
	 */
	public function get_triggers(): array {
		return $this->triggers;
	}

	/**
	 * Instance the triggers of this workflow.
	 *
	 * @since 6.2.0
	 *
	 * @throws Workflow_Exception Throws an exception if there is an issue initializing the trigger.
	 * @return void
	 */
	public function init_triggers(): void {

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
	 * @since 6.2.0
	 *
	 * @param int|string|null $step_id The initial step id.
	 * @return void
	 */
	public function set_initial_step( $step_id ): void {
		$this->initial_step = $step_id;
	}

	/**
	 * Set the step list of this workflow.
	 *
	 * @since 6.2.0
	 *
	 * @param array $steps The steps of the workflow.
	 */
	public function set_steps( array $steps ) {
		$this->steps = $steps;
	}

	/**
	 * Get the workflow as an array.
	 *
	 * The main use-case to get the workflow as an array is to be stored
	 * in the database or if it is being shared via API.
	 *
	 * @since 6.2.0
	 *
	 * @return array The workflow as an array.
	 */
	public function to_array(): array {
		return array(
			'id'           => $this->get_id(),
			'zbs_site'     => $this->get_zbs_site(),
			'zbs_owner'    => $this->get_zbs_owner(),
			'name'         => $this->get_name(),
			'description'  => $this->get_description(),
			'category'     => $this->get_category(),
			'triggers'     => $this->get_triggers(),
			'steps'        => $this->get_steps(),
			'initial_step' => $this->get_initial_step_index(),
			'active'       => $this->is_active(),
			'version'      => $this->get_version(),
			'created_at'   => $this->get_created_at(),
			'updated_at'   => $this->get_updated_at(),
		);
	}

	/**
	 * Get the initial step data of this workflow.
	 *
	 * @since 6.2.0
	 *
	 * @return array|null The initial step data of the workflow.
	 */
	public function get_initial_step(): ?array {
		return $this->steps[ $this->get_initial_step_index() ] ?? null;
	}

	/**
	 * Get the initial step index of this workflow.
	 *
	 * @since 6.2.0
	 *
	 * @return int|string|null The index key for the next step of the workflow.
	 */
	public function get_initial_step_index() {
		return $this->initial_step;
	}

	/**
	 * Get the steps of this workflow.
	 *
	 * @since 6.2.0
	 *
	 * @return array The steps of the workflow.
	 */
	public function get_steps(): array {
		return $this->steps;
	}

	/**
	 * Get the initial step of this workflow.
	 *
	 * @since 6.2.0
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
	 * @since 6.2.0
	 *
	 * @param Trigger        $trigger An instance of the Trigger class.
	 * @param Data_Type|null $data All relevant object data to be passed through the workflow.
	 * @return bool Whether the workflow was executed successfully.
	 *
	 * @throws Automation_Exception|Workflow_Exception Throws an exception if there is an issue executing the workflow.
	 * @throws Data_Transformer_Exception Throws an exception if there is an issue transforming the data.
	 */
	public function execute( Trigger $trigger, Data_Type $data = null ): bool {
		return $this->get_engine()->execute_workflow( $this, $trigger, $data );
	}

	/**
	 * Turn on the workflow.
	 *
	 * @since 6.2.0
	 *
	 * @return void
	 */
	public function turn_on(): void {
		$this->active = true;
	}

	/**
	 * Turn off the workflow.
	 *
	 * @since 6.2.0
	 *
	 * @return void
	 */
	public function turn_off(): void {
		$this->active = false;
	}

	/**
	 * Check if the workflow is active.
	 *
	 * @since 6.2.0
	 *
	 * @return bool Whether the workflow is active.
	 */
	public function is_active(): bool {
		return $this->active;
	}

	/**
	 * Add a trigger to this workflow.
	 *
	 * @since 6.2.0
	 *
	 * @param string $string The name of the trigger to add.
	 * @return void
	 */
	public function add_trigger( string $string ): void {
		$this->triggers[] = $string;
	}

	/**
	 * Set the automation engine.
	 *
	 * @since 6.2.0
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
	 * @since 6.2.0
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
	 * @since 6.2.0
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
	 * @since 6.2.0
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
	 * @since 6.2.0
	 */
	private function process_steps() {
		foreach ( $this->steps as $step_data ) {
			if ( ! isset( $step_data['class_name'] ) ) {
				$step_data['class_name'] = $this->get_engine()->get_step_class( $step_data['slug'] );
			}
		}
	}

	/**
	 * Set the timestamp for when the workflow was created.
	 *
	 * @since 6.2.0
	 *
	 * @param int $time The timestamp for when the workflow was created.
	 * @return void
	 */
	public function set_created_at( int $time ): void {
		$this->created_at = $time;
	}

	/**
	 * Set the timestamp for when the workflow was last updated.
	 *
	 * @since 6.2.0
	 *
	 * @param int $time The timestamp for when the workflow was last updated.
	 * @return void
	 */
	public function set_updated_at( int $time ): void {
		$this->updated_at = $time;
	}

	/**
	 * Set the id of the workflow.
	 *
	 * @since 6.2.0
	 *
	 * @param int|string $id The workflow id.
	 * @return void
	 */
	public function set_id( $id ): void {
		$this->id = $id;
	}
}
