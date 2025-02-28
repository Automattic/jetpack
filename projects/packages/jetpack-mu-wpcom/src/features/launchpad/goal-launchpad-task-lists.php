<?php
/**
 * Functions pertaining to Launchpad task lists, where the tasks depend
 * on a site's goals; as choosen by the user during onboarding.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Launchpad;

/**
 * Checklist slug to use when the user chose no goals, or the chosen goals
 * don't have a corresponding checklist.
 *
 * @return string
 */
function get_goals_default_checklist_slug() {
	return 'build';
}

/**
 * Given a set of goals, which checklist is best for the user. The checklist
 * slugs are those returned by the wpcom_launchpad_get_task_list_definitions()
 * function in launchpad.php.
 *
 * The algorithm in this function shouldn't be considered final: expect it to
 * change over time as we receive feedback and analytics on which checklists
 * are successful for which goals.
 *
 * @param array $goals Array of goal slugs.
 * @param array $enable_checklist_for_goals Used by the client to signal to Jetpack which launchpad goals have been enabled (e.g. via feature flags)'.
 *
 * @return string
 */
function get_checklist_slug_by_goals( $goals, $enable_checklist_for_goals ) {
	if ( empty( $goals ) ) {
		return get_goals_default_checklist_slug();
	}

	if ( count( $goals ) >= 3 ) {
		// If the user chooses too many goals we're not as confident we know
		// exactly what they think is most important. A general checklist
		// could be best.
		return get_goals_default_checklist_slug();
	}

	if ( in_array( 'courses', $enable_checklist_for_goals, true ) ) {
		if ( in_array( 'courses', $goals, true ) ) {
			return 'create-course-goal';
		}
	}

	if ( in_array( 'newsletter', $enable_checklist_for_goals, true ) ) {
		if ( in_array( 'newsletter', $goals, true ) ) {
			return 'intent-newsletter-goal';
		}
	}

	if ( contains_any( $goals, 'sell', 'sell-digital', 'sell-physical' ) ) {
		return 'sell';
	}

	if ( in_array( 'promote', $goals, true ) ) {
		return 'build';
	}

	if ( in_array( 'write', $goals, true ) ) {
		return 'write';
	}

	return get_goals_default_checklist_slug();
}

/**
 * The string_list must contain any of the provided strings.
 *
 * @param array  $string_list The list of strings to check.
 * @param string ...$strings_to_check The strings to check for.
 * @return bool
 */
function contains_any( $string_list, ...$strings_to_check ) {
	foreach ( $strings_to_check as $s ) {
		if ( in_array( $s, $string_list, true ) ) {
			return true;
		}
	}
	return false;
}
