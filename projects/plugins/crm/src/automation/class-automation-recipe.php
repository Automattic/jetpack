<?php

namespace Automattic\Jetpack\CRM\Automation;

class Automation_Recipe {
	
	/** @var int */
	private $id;
	
	/** @var string */
	public $name;
	
	/** @var string */
	public $description;
	
	/** @var string */
	public $category;
	
	/** @var array */
	public $triggers;
	
	/** @var array */
	public $initial_step;
	
	/** @var bool */
	public $active;
	
	/** @var Automation_Engine */
	private $automation_engine;
	
	/** @var Automation_Logger */
	private $logger;
	
	public function __construct( array $recipe_data ) {
		$this->id           = $recipe_data['id'] ?? null;
		$this->triggers     = $recipe_data['triggers'] ?? array();
		$this->initial_step = $recipe_data['initial_step'] ?? array();
		$this->name         = $recipe_data['name'];
		$this->description  = $recipe_data['description'] ?? '';
		$this->category     = $recipe_data['category'] ?? '';
		$this->active       = $recipe_data['is_active'] ?? true;
		
		$this->automation_engine = Automation_Engine::instance();
		$this->logger            = Automation_Logger::instance();
	}
	
	/**
	 * Get the id of this recipe
	 * 
	 * @return int
	 */
	public function get_id(): int {
		return $this->id;
	}

	public function set_triggers( array $triggers ) {
		$this->triggers = $triggers;
	}

	/**
	 * Get the trigger names of this recipe
	 * 
	 * @return array
	 */
	public function get_triggers(): array {
		return $this->triggers;
	}

	/**
	 * Instance the triggers of this recipe
	 * @throws Recipe_Exception
	 */
	public function init_triggers() {
		
		if ( ! $this->is_active() ) {
			return;
		}
		
		foreach ( $this->get_triggers() as $trigger_name ) {
			try {
				$class_name = $this->automation_engine->get_trigger_class( $trigger_name );
				
				/** @var Trigger $trigger */
				$trigger = new $class_name();
				$trigger->init( $this );
				
			} catch ( Automation_Exception $e ) {
				throw new Recipe_Exception( sprintf( __( 'An error happened initializing the trigger. %s', 'zero-bs-crm' ),  $e->getMessage() ) );
			}
		}
	}
	
	/** 
	 * Set initial step of this recipe
	 * @param array $step_data
	 */
	public function set_initial_step( array $step_data ) {
		$this->initial_step = $step_data;
	}

	/**
	 * Get the recipe as an array
	 * @return array
	 */
	public function get_recipe_array() {
		
		$recipe = array(
			'name'          => $this->name,
			'description'   => $this->description,
			'category'      => $this->category,
			'is_active'     => $this->active,
			'triggers'      => $this->triggers,
			'initial_step'  => $this->initial_step,
		);

		return $recipe;
	}

	/**
	 * Get the initial step of this recipe
	 * 
	 * @return array
	 */
	public function get_initial_step(): array {
		return $this->initial_step;
	}
	
	/**
	 * Start the recipe execution once a trigger is activated
	 * 
	 * @param Trigger $trigger
	 * @param array $data
	 * @return bool
	 * @throws Automation_Exception
	 */
	public function execute( Trigger $trigger, array $data ): bool {
		$this->logger->log( 'Trigger activated: ' . $trigger->get_name() );
		$this->logger->log( 'Executing recipe: ' . $this->name );
		
		$step_data = $this->initial_step;
		
		while ( $step_data ) {
			try {
					$step_name = $step_data['name'];
					
					$step_class = $step_data['class_name'] ?? $this->automation_engine->get_step_class( $step_name );
					
					if ( ! class_exists( $step_class ) ) {
						throw new Automation_Exception( sprintf( __( 'The step class %s does not exist.', 'zero-bs-crm' ), $step_class ), Automation_Exception::STEP_CLASS_NOT_FOUND );
					}
				
					/** @var Step $step */
					$step = new $step_class( $step_data );
	
					$this->logger->log( 'Executing step: ' . $step->get_name() . ' - Type: ' . $step->get_type() );
					
					$step->execute( $data );
					$step_data = $step->get_next_step();

					$this->logger->log( 'Step executed.' );
					
				if ( ! $step_data ) {
					$this->logger->log( 'Recipe execution finished: No more steps found.' );
					return true;
				}
			} catch ( Automation_Exception $automation_exception ) {

				$this->logger->log( 'Error executing the recipe on step: ' . $step_name . ' - ' . $automation_exception->getMessage() );
				
				throw $automation_exception;
			}
		}
		
		return false;
	}
	
	/**
	 * Get the step classname based on the step type
	 * @param array $step_data
	 * @return string
	 * @throws Automation_Exception
	 */
	private function get_step_class( array $step_data ): string {
		$step_type  = $step_data['type'];
		
		return $this->automation_engine->get_step_class( $step_type );
	}
	
	/**
	 * Turn on the recipe
	 */
	public function turn_on() {
		$this->active = true;
	}
	
	/**
	 * Turn off the recipe
	 */
	public function turn_off() {
		$this->active = false;
	}
	
	/**
	 * Check if the recipe is active
	 * @return bool
	 */
	public function is_active(): bool {
		return $this->active;
	}

	/**
	 * Add a trigger to this recipe
	 * @param string $string
	 */
	public function add_trigger( string $string ) {
		$this->triggers[] = $string;
	}
	
	/**
	 * Set Automation Logger
	 * @param Automation_Logger $logger
	 */
	public function set_logger( Automation_Logger $logger ) {
		$this->logger = $logger;
	}
	
	/**
	 * Set Automation Engine
	 * @param Automation_Engine $automation_engine
	 */
	public function set_automation_engine( Automation_Engine $automation_engine ) {
		$this->automation_engine = $automation_engine;
	}
}