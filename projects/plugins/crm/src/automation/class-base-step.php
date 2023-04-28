<?php
/**
 * Base Step
 *
 * @package Automattic\Jetpack\CRM\Automation
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Base Step
 *
 * @inheritDoc
 */
abstract class Base_Step implements Step {

	/**
	 * @var string Slug name of the step.
	 */
	protected $name;
	/**
	 * @var string Step type.
	 */
	protected $type;
	/**
	 * @var string Step category.
	 */
	protected $category;
	/**
	 * @var string Step title.
	 */
	protected $title;
	/**
	 * @var string|null Step description.
	 */
	protected $description;
	/**
	 * @var array Step data.
	 */
	protected $data;
	/**
	 * @var Step|null Next linked step.
	 */
	protected $next_step;

	/**
	 * Base_Step constructor.
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		$this->name        = $step_data['name'];
		$this->title       = $step_data['title'];
		$this->type        = $step_data['type'];
		$this->category    = $step_data['category'];
		$this->description = $step_data['description'];
		$this->data        = $step_data['data'];
	}

	/**
	 * Get the slug name of the step
	 *
	 * @return string
	 */
	public function get_name(): string {
		return $this->name;
	}

	/**
	 * Get the title of the step
	 *
	 * @return string
	 */
	public function get_title(): string {
		return $this->title;
	}

	/**
	 * Get the description of the step
	 *
	 * @return string
	 */
	public function get_description(): ?string {
		return $this->description;
	}

	/**
	 * Get the type of the step
	 *
	 * @return string
	 */
	public function get_type(): string {
		return $this->type;
	}

	/**
	 * Get the category of the step
	 *
	 * @return string
	 */
	public function get_category(): string {
		return $this->category;
	}

	/**
	 * Get the data of the step
	 *
	 * @return array
	 */
	public function get_data(): array {
		return $this->data;
	}

	/**
	 * Set the next step
	 *
	 * @param Step $step The next linked step.
	 */
	public function set_next_step( Step $step ) {
		$this->next_step = $step;
	}

	/**
	 * Get the next step
	 *
	 * @return Step|null
	 */
	public function get_next_step(): ?Step {
		return $this->next_step;
	}

	/**
	 * Execute the step
	 *
	 * @param array $data Data passed from the trigger.
	 */
	abstract public function execute( array $data );
}
