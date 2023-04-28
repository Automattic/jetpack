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
	
	/** @var Trigger[] */
	public $triggers;
	
	/** @var Step */
	public $initial_step;
	
	/** @var bool */
	public $active;
	
	/** @var Automation_Engine */
	private $automation_engine;
	
	public function __construct( array $recipe_data ) {
		$this->triggers     = $recipe_data['triggers']; //$this->createTriggers(  );
		$this->initial_step = $recipe_data['initial_step'];
		$this->name         = $recipe_data['name'];
		$this->description  = $recipe_data['description'];
		$this->category     = $recipe_data['category'];
		$this->active       = false;
		
		$this->automation_engine = Automation_Engine::instance();
	}

	public function set_triggers( array $triggers ) {
		$this->triggers = $triggers;
	}

	/**
	 * Get the triggers of this recipe
	 * 
	 * @return Trigger[]
	 */
	public function get_triggers(): array {
		return $this->triggers;
	}

	/**
	 * Instance the triggers of this recipe
	 * @throws Recipe_Exception
	 */
	public function init_triggers() {
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
	 * @param Step $step
	 */
	public function set_initial_step( Step $step ) {
		$this->initial_step = $step;
	}

	static public function get_plain_step( Step $step ): array {

		$plain_step = array(
			'class' => get_class( $step ),
			'name' => $step->get_name(),
			'description' => $step->get_description(),
			'params' => $step->get_params(),
		);

		if( $step->has_next_step_true() ) {
			$plain_step['next_step_true'] = self::get_plain_step( $step->next_step_true() );
		}

		if( $step->has_next_step_false() ) {
			$plain_step['next_step_false'] = self::get_plain_step( $step->next_step_false() );
		}

		return $plain_step;
	}

	static public function build_step( array $plain_step ): Step {
		$class = $plain_step['class'];
		$name = $plain_step['name'];
		$description = $plain_step['description'];

		if( !class_exists( $class ) ) {
			throw new Step_Exception('Step class doesn\'t exists', Step_Exception::STEP_CLASS_DOES_NOT_EXIST );
		}

		/** @var Step $step */
		$step = new $class();
		$step->set_name( $name );
		$step->set_description( $description );

		//todo: process next_step_if_true
		//todo: process next_step_if_false

		return $step;
	}

	/**
	 * Get the initial step of this recipe
	 * @return Step
	 */
	public function get_initial_step(): Step {
		return $this->initial_step;
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
			'triggers'      => $this->triggers,
			'initial_step'  => $this->initial_step->get_name(),
		);

		return $recipe;
	}
	
	/**
	 * Start the recipe execution once a trigger is activated
	 * @param array $trigger_data
	 * @throws Automation_Exception
	 */
	public function execute( Trigger $trigger, array $data ) {
		
		Automation_Logger::log( 'Executing recipe: ' . $this->name );
		Automation_Logger::log( 'Trigger: ' . $trigger->get_name() );
		
		$step_data = $this->initial_step;
		
		while ( $step_data ) {
			try {
					$step_name = $step_data['name'];
					$step_type = $step_data['type'];

					Automation_Logger::log( 'Executing step: ' . $step_name . ' - Type: ' . $step_type );
					
					$step_class = $this->automation_engine->get_step_class( $step_name, $step_type );
				
					$step = new $step_class( $step_data );
					$step->execute( $data );
					$step_data = $step->get_next_step( $data );
					
					Automation_Logger::log( 'Step executed: ' . $step_name );
					
				if ( ! $step_data ) {
					Automation_Logger::log( 'Recipe execution finished: No more steps found.' );
					break;
				}
			} catch ( Automation_Exception $automation_exception ) {
				
				Automation_Logger::log( 'Error executing the recipe on step: ' . $step_name . ' - ' . $automation_exception->getMessage() );
				
				throw $automation_exception;
			}
		}
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
}