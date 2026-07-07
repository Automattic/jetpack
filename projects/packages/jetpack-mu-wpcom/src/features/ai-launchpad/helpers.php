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
	 * active by default on wpcom), so the connection task is the meaningful version of that intent.
	 * The prompt no longer offers either id, so this only catches stray AI emissions and outputs
	 * persisted before the replacement.
	 *
	 * @param string $task_id A task id from the persisted AI output.
	 * @return string The task id to render (and listen/skip) instead.
	 */
	function wpcom_ai_launchpad_remap_task_id( $task_id ) {
		$remap = array(
			'woo_launch_site'      => 'site_launched',
			'post_sharing_enabled' => 'connect_social_media',
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
		if ( ! is_array( $ai_output ) || ! isset( $ai_output['payload']['tasks'] ) || ! is_array( $ai_output['payload']['tasks'] ) ) {
			return array();
		}

		$task_ids = array();
		foreach ( $ai_output['payload']['tasks'] as $task ) {
			if ( is_array( $task ) && isset( $task['id'] ) && is_string( $task['id'] ) ) {
				$task_ids[] = wpcom_ai_launchpad_remap_task_id( $task['id'] );
			}
		}

		return array_values( array_unique( $task_ids ) );
	}
}
