<?php
/**
 * Interface Trigger
 *
 * @package Automattic\Jetpack\CRM\Automation
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Interface Trigger
 *
 * @package Automattic\Jetpack\CRM\Automation
 */
interface Trigger {

	/**
	 * Get the slug name of the trigger
	 *
	 * @return string
	 */
	public function get_slug(): string;

	/**
	 * Get the title of the trigger
	 *
	 * @return string
	 */
	public function get_title(): string;

	/**
	 * Get the description of the trigger
	 *
	 * @return string
	 */
	public function get_description(): ?string;

	/**
	 * Get the category of the trigger
	 *
	 * @return string
	 */
	public function get_category(): string;

	/**
	 * Init the trigger. Listen to the desired event
	 *
	 * @param Automation_Workflow $workflow The workflow to which the trigger belongs.
	 */
	public function init( Automation_Workflow $workflow );

}
