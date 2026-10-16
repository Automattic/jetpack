<?php
/**
 * Shared AI-output seeding for the AI Launchpad listener tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Seeds the `wpcom_ai_launchpad_ai_output` option that every AI Launchpad listener reads back
 * through wpcom_ai_launchpad_get_ai_task_ids().
 *
 * Only `payload.tasks[].id` and `payload.inferred.goal` are ever read out of that option, so the
 * builder writes just those. The persisted envelope's `version` / `source` / `generated_at` fields
 * are inert here, and six near-identical copies of them were the bulk of the duplication this
 * replaces.
 */
trait AI_Launchpad_Seeds_AI_Output {

	/**
	 * Writes the AI output option so the given task IDs are reported as selected.
	 *
	 * @param string[]    $task_ids Task IDs to seed.
	 * @param string|null $goal     The inferred goal, when the payload carries one.
	 */
	private function seed_ai_output( array $task_ids, $goal = null ) {
		update_option( 'wpcom_ai_launchpad_ai_output', self::ai_output( $task_ids, $goal ), false );
	}

	/**
	 * An AI output option value, for the callers that need the array rather than the write: data
	 * providers, which are static and run before the option store exists.
	 *
	 * @param string[]    $task_ids Task IDs for the payload. An empty list omits the `tasks` key
	 *                              entirely, standing in for a partial write.
	 * @param string|null $goal     The inferred goal, when the payload carries one.
	 * @return array
	 */
	private static function ai_output( array $task_ids, $goal = null ) {
		$payload = array();

		if ( ! empty( $task_ids ) ) {
			$payload['tasks'] = array_map(
				static function ( $id ) {
					return array(
						'id'       => $id,
						'subtitle' => 'Subtitle.',
					);
				},
				$task_ids
			);
		}

		if ( null !== $goal ) {
			$payload['inferred'] = array( 'goal' => $goal );
		}

		return array( 'payload' => $payload );
	}
}
