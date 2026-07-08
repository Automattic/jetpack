<?php
/**
 * AI Launchpad shared helpers used by more than one class.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'wpcom_ai_launchpad_get_ai_task_ids' ) ) {
	/**
	 * The AI-selected task IDs from the `wpcom_ai_launchpad_ai_output` option.
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
				$task_ids[] = $task['id'];
			}
		}

		return $task_ids;
	}
}
