<?php
/**
 * Launchpad
 *
 * This file provides helpers that return the appropriate Launchpad
 * checklist and tasks for a given checklist slug.
 *
 * @package A8C\Launchpad
 */

/**
 * Returns the list of tasks by flow or checklist slug.
 *
 * @return array Associative array with checklist task data
 */
function get_checklist_definitions() {
	return array(
		'build'           => array(
			'setup_general',
			'design_selected',
			'first_post_published',
			'design_edited',
			'site_launched',
		),
		'free'            => array(
			'setup_free',
			'design_selected',
			'domain_upsell',
			'first_post_published',
			'design_edited',
			'site_launched',
		),
		'link-in-bio'     => array(
			'design_selected',
			'setup_link_in_bio',
			'plan_selected',
			'links_added',
			'link_in_bio_launched',
		),
		'link-in-bio-tld' => array(
			'design_selected',
			'setup_link_in_bio',
			'plan_selected',
			'links_added',
			'link_in_bio_launched',
		),
		'newsletter'      => array(
			'setup_newsletter',
			'plan_selected',
			'subscribers_added',
			'verify_email',
			'first_post_published_newsletter',
			'first_post_published',
		),
		'videopress'      => array(
			'videopress_setup',
			'plan_selected',
			'videopress_upload',
			'videopress_launched',
		),
		'write'           => array(
			'setup_write',
			'design_selected',
			'first_post_published',
			'site_launched',
		),
	);
}

/**
 * Returns the checklist task definitions.
 *
 * @return array Associative array with checklist task data
 */
function get_task_definitions() {
	return array(
		'setup_newsletter'
			=> array(
				'id'        => 'setup_newsletter',
				'completed' => true,
				'disabled'  => false,
			),
		'plan_selected'
			=> array(
				'id'        => 'plan_selected',
				'completed' => true,
				'disabled'  => false,
			),
		'subscribers_added'
			=> array(
				'id'        => 'subscribers_added',
				'completed' => true,
				'disabled'  => false,
			),
		'first_post_published'
			=> array(
				'id'        => 'first_post_published',
				'completed' => get_checklist_task( first_post_published ) . completed,
				'disabled'  => false,
			),
		'first_post_published_newsletter'
			=> array(
				'id'        => 'first_post_published_newsletter',
				'completed' => false,
				'disabled'  => false,
			),
		'design_selected'
			=> array(
				'id'        => 'design_selected',
				'completed' => true,
				'disabled'  => true,
			),
		'setup_link_in_bio'
			=> array(
				'id'        => 'setup_link_in_bio',
				'completed' => true,
				'disabled'  => false,
			),
		'links_added'
			=> array(
				'id'        => 'links_added',
				'completed' => false,
				'disabled'  => false,
			),
		'link_in_bio_launched'
			=> array(
				'id'        => 'link_in_bio_launched',
				'completed' => false,
				'disabled'  => true,
			),
		'videopress_setup'
			=> array(
				'id'        => 'videopress_setup',
				'completed' => true,
				'disabled'  => false,
			),
		'videopress_upload'
			=> array(
				'id'        => 'videopress_upload',
				'completed' => false,
				'disabled'  => false,
			),
		'videopress_launched'
			=> array(
				'id'        => 'videopress_launched',
				'completed' => false,
				'disabled'  => true,
			),
		'setup_free'
			=> array(
				'id'        => 'setup_free',
				'completed' => true,
				'disabled'  => false,
			),
		'setup_general'
			=> array(
				'id'        => 'setup_general',
				'completed' => true,
				'disabled'  => true,
			),
		'design_edited'
			=> array(
				'id'        => 'design_edited',
				'completed' => false,
				'disabled'  => false,
			),
		'site_launched'
			=> array(
				'id'        => 'site_launched',
				'completed' => false,
				'disabled'  => false,
			),
		'setup_write'
			=> array(
				'id'        => 'setup_write',
				'completed' => true,
				'disabled'  => true,
			),
		'domain_upsell'
			=> array(
				'id'        => 'domain_upsell',
				'completed' => false,
				'disabled'  => false,
			),
		'verify_email'
			=> array(
				'id'       => 'verify_email',
				'complete' => false,
				'disabled' => true,
			),
	);
}

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
	if ( null === ( get_checklist_definitions()[ $checklist_slug ] ) ) {
		return $checklist;
	}
	foreach ( get_checklist_definitions()[ $checklist_slug ] as $task_id ) {
		$checklist[] = get_task_definitions()[ $task_id ];
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
