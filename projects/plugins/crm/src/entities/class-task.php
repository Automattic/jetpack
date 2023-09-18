<?php
/**
 * Task Entity.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities;

/**
 * Task class.
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
	public $description = '';

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
	public $is_completed = false;

	/**
	 * Whether task should show in portal.
	 *
	 * @var bool
	 */
	public $show_in_portal = false;

	/**
	 * Whether task should show in calendar.
	 *
	 * @var bool
	 */
	public $show_in_calendar = false;

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
