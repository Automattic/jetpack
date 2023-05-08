<?php
/**
 * Base Trigger implementation
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Base Trigger implementation
 *
 * @inheritDoc
 */
abstract class Base_Trigger implements Trigger {

	/** @var mixed|string The trigger name */
	protected $name = '';
	/** @var string The trigger title */
	protected $title = '';
	/** @var string The trigger description */
	protected $description = '';
	/** @var string The trigger category */
	protected $category = '';

	/**
	 * Base_Trigger constructor.
	 *
	 * @param array $trigger_data The trigger data.
	 */
	public function __construct( array $trigger_data ) {
		$this->name        = $trigger_data['name'];
		$this->title       = $trigger_data['title'] ?? '';
		$this->description = $trigger_data['description'] ?? '';
		$this->category    = $trigger_data['category'] ?? '';
	}

	/**
	 * Get the trigger name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return $this->name;
	}

	/**
	 * Get the trigger title
	 *
	 * @return string
	 */
	public function get_title(): string {
		return $this->title;
	}

	/**
	 * Get the trigger description
	 *
	 * @return string|null
	 */
	public function get_description(): ?string {
		return $this->description;
	}

	/**
	 * Get the trigger category
	 *
	 * @return string
	 */
	public function get_category(): string {
		return $this->category;
	}

	/**
	 * Initialize the trigger
	 *
	 * @param Automation_Recipe $recipe The recipe to execute.
	 */
	abstract public function init( Automation_Recipe $recipe );
}
