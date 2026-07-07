<?php
/**
 * AI Launchpad shared helpers used by more than one class.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'wpcom_ai_launchpad_remap_task_id' ) ) {
	/**
	 * Normalizes a persisted task id onto the task the AI Launchpad actually renders.
	 *
	 * Some catalog tasks are broken or meaningless in this context, so their ids are replaced on
	 * read: `woo_launch_site` dead-ends in the WooCommerce onboarding list and never completes when
	 * the guided setup was skipped; `post_sharing_enabled` is born completed (the sharing module is
	 * active by default on wpcom); `design_selected` is born completed and `design_completed` has no
	 * wp-admin completion path, so both consolidate onto the actionable `site_theme_selected` task.
	 * The prompt no longer offers these ids, so this only catches stray AI emissions and outputs
	 * persisted before the replacement.
	 *
	 * @param string $task_id A task id from the persisted AI output.
	 * @return string The task id to render (and listen/skip) instead.
	 */
	function wpcom_ai_launchpad_remap_task_id( $task_id ) {
		$remap = array(
			'woo_launch_site'      => 'site_launched',
			'post_sharing_enabled' => 'connect_social_media',
			'design_selected'      => 'site_theme_selected',
			'design_completed'     => 'site_theme_selected',
		);

		return $remap[ $task_id ] ?? $task_id;
	}
}

if ( ! function_exists( 'wpcom_ai_launchpad_get_ai_task_ids' ) ) {
	/**
	 * The AI-selected task IDs from the `wpcom_ai_launchpad_ai_output` option, remapped
	 * onto the ids the launchpad renders so listeners and skip validation see the same
	 * ids as the task cards.
	 *
	 * @return string[] Task IDs, empty when the option is unset or malformed.
	 */
	function wpcom_ai_launchpad_get_ai_task_ids() {
		$ai_output = get_option( 'wpcom_ai_launchpad_ai_output' );
		if ( ! is_array( $ai_output ) || ! isset( $ai_output['payload'] ) || ! is_array( $ai_output['payload'] ) ) {
			return array();
		}
		$payload = $ai_output['payload'];

		$task_ids = array();
		if ( isset( $payload['tasks'] ) && is_array( $payload['tasks'] ) ) {
			foreach ( $payload['tasks'] as $task ) {
				if ( is_array( $task ) && isset( $task['id'] ) && is_string( $task['id'] ) ) {
					$task_ids[] = wpcom_ai_launchpad_remap_task_id( $task['id'] );
				}
			}
		}

		$task_ids = array_values( array_unique( $task_ids ) );

		// Sell sites always render a Choose-a-theme task (see AI_Launchpad_REST::get_current_tasks), so the
		// switch_theme listener and skip validation must count it even when the AI did not pick one — and
		// even when a partial write left the payload with an inferred goal but no task list.
		$goal = isset( $payload['inferred']['goal'] ) && is_string( $payload['inferred']['goal'] ) ? $payload['inferred']['goal'] : '';
		if ( 'sell' === $goal && ! in_array( 'site_theme_selected', $task_ids, true ) ) {
			$task_ids[] = 'site_theme_selected';
		}

		return $task_ids;
	}
}
