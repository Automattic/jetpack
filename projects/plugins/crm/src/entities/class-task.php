<?php
/**
 * Task Entity.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities;

/**
 * Task class.
 *
 * Note that DAL and the database currently use the legacy term `event` instead
 * of `task`, but to match the UI and to prevent confusion with the Automations
 * Event Manager, we'll be using `task` here.
 */
class Task {
	/**
	 * The ID of the task as found in the database.
	 *
	 * @var int
	 */
	public $id = -1;

	/**
	 * The WP user ID for the user that owns the task.
	 *
	 * @var int
	 */
	public $owner = -1;

	/**
	 * The task tags.
	 *
	 * @var array
	 */
	public $tags = array();

	/**
	 * The task title.
	 *
	 * @var string
	 */
	public $title = '';

	/**
	 * The task description.
	 *
	 * @var string
	 */
	public $desc = '';

	/**
	 * Unix timestamp of task start.
	 *
	 * @var int|null
	 */
	public $start = null;

	/**
	 * Unix timestamp of task end.
	 *
	 * @var int|null
	 */
	public $end = null;

	/**
	 * Whether task has been completed or not.
	 *
	 * @var bool
	 */
	public $complete = false;

	/**
	 * Whether task should show in portal.
	 *
	 * @var bool
	 */
	public $show_on_portal = false;

	/**
	 * Whether task should show in calendar.
	 *
	 * @var bool
	 */
	public $show_on_calendar = false;

	/**
	 * Unix timestamp of task creation.
	 *
	 * @var int|null
	 */
	public $created = null;

	/**
	 * Unix timestamp of task last update.
	 *
	 * @var int|null
	 */
	public $lastupdated = null;
}
