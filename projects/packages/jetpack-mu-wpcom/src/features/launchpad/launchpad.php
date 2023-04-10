<?php
/**
 * Launchpad
 *
 * @package A8C\Launchpad
 */

namespace A8C\Launchpad;

const TASKS = array(
	array(
		'id'        => 'setup_newsletter',
		'completed' => true,
		'disabled'  => false,
	),
	array(
		'id'        => 'plan_selected',
		'completed' => true,
		'disabled'  => false,
	),
	array(
		'id'        => 'subscribers_added',
		'completed' => true,
		'disabled'  => false,
	),
	array(
		'id'        => 'first_post_published',
		'completed' => 'get_checklist_task( first_post_published ).completed',
		'disabled'  => false,
	),
	array(
		'id'        => 'first_post_published_newsletter',
		'completed' => false,
		'disabled'  => false,
	),
	array(
		'id'        => 'design_selected',
		'completed' => true,
		'disabled'  => true,
	),
	array(
		'id'        => 'setup_link_in_bio',
		'completed' => true,
		'disabled'  => false,
	),
	array(
		'id'        => 'links_added',
		'completed' => false,
		'disabled'  => false,
	),
	array(
		'id'        => 'link_in_bio_launched',
		'completed' => false,
		'disabled'  => true,
	),
	array(
		'id'        => 'videopress_setup',
		'completed' => true,
		'disabled'  => false,
	),
	array(
		'id'        => 'videopress_upload',
		'completed' => false,
		'disabled'  => false,
	),
	array(
		'id'        => 'videopress_launched',
		'completed' => false,
		'disabled'  => true,
	),
	array(
		'id'        => 'setup_free',
		'completed' => true,
		'disabled'  => false,
	),
	array(
		'id'        => 'setup_general',
		'completed' => true,
		'disabled'  => true,
	),
	array(
		'id'        => 'design_edited',
		'completed' => false,
		'disabled'  => false,
	),
	array(
		'id'        => 'site_launched',
		'completed' => false,
		'disabled'  => false,
	),
	array(
		'id'        => 'setup_write',
		'completed' => true,
		'disabled'  => true,
	),
	array(
		'id'        => 'domain_upsell',
		'completed' => false,
		'disabled'  => false,
	),
	array(
		'id'       => 'verify_email',
		'complete' => false,
		'disabled' => true,
	),
);

const CHECKLIST_DEFINITIONS = array(
	'newsletter' => array(
		'setup_newsletter',
		'plan_selected',
		'subscribers_added',
		'verify_email',
		'first_post_published_newsletter',
		'first_post_published',
	),
);

/**
 * Returns launchpad checklist task by task id.
 *
 * @param string $task Task id.
 *
 * @return array Associative array with task data
 *               or false if task id is not found.
 */
function get_checklist_task( $task ) {
	$launchpad_checklist_tasks_statuses_option = get_option( 'launchpad_checklist_tasks_statuses' );
	if ( is_array( $launchpad_checklist_tasks_statuses_option ) && isset( $launchpad_checklist_tasks_statuses_option[ $task ] ) ) {
			return $launchpad_checklist_tasks_statuses_option[ $task ];
	}

	return false;
}

/**
 * Returns launchpad checklist by checklist slug.
 *
 * @param string $checklist_slug Checklist slug.
 *
 * @return array Associative array with checklist task
 *               or empty array if checklist slug is not found.
 */
function build_checklist( $checklist_slug ) {
	$checklist = array();
	if ( ! isset( CHECKLIST_DEFINITIONS[ $checklist_slug ] ) ) {
		return $checklist;
	}
	foreach ( CHECKLIST_DEFINITIONS[ $checklist_slug ] as $task_id ) {
		$checklist[] = TASKS[ $task_id ];
	}
	return $checklist;
}

/**
 * Returns launchpad checklist by checklist slug.
 *
 * @param string $checklist_slug Checklist slug.
 *
 * @return array Associative array with checklist task data
 */
function get_launchpad_checklist_by_checklist_slug( $checklist_slug ) {
	if ( ! $checklist_slug ) {
		return array();
	}
	return build_checklist( $checklist_slug );
}
