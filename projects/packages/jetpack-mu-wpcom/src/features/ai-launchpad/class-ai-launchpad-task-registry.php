<?php
/**
 * Task definitions owned by the AI Launchpad rather than the shared launchpad catalog.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * The AI Launchpad's own task registry.
 *
 * Deliberately NOT merged into wpcom_launchpad_get_task_definitions(): that catalog is shared
 * with the legacy launchpad, and routing foreign definitions through
 * wpcom_launchpad_checklists() would depend on it accepting entries it never registered. These
 * tasks are built here instead, which generalizes what build_gallery_task() already did.
 *
 * Each definition supplies the same fields build_tasks() resolves from the catalog. definitions()
 * is rebuilt on every call, including from has() and task_ids(), which is what decides the shape:
 *
 * - `is_complete` and `draft_id` MUST stay callables. They read an option and run a WP_Query, so
 *   resolving them eagerly would put a database round-trip behind every id check.
 * - The string fields are callables only to match. Deferring __() keeps it off the has() path too,
 *   but a new entry that used plain translated strings there would be correct.
 */
class AI_Launchpad_Task_Registry {

	/**
	 * The registry.
	 *
	 * Keys are task ids. Each definition supports:
	 * - `title`             (callable) the card title.
	 * - `in_progress_title` (callable, optional) the title while a marker draft is unpublished.
	 * - `default_subtitle`  (callable) the subtitle used when the AI supplies none.
	 * - `is_complete`       (callable) whether the task is done.
	 * - `draft_id`          (callable, optional) the in-progress draft's post id, or null.
	 *
	 * @return array
	 */
	private static function definitions() {
		return array(
			'add_gallery_page' => array(
				'title'             => static function () {
					return __( 'Create your first gallery', 'jetpack-mu-wpcom' );
				},
				'in_progress_title' => static function () {
					return __( 'Continue working on your gallery', 'jetpack-mu-wpcom' );
				},
				'default_subtitle'  => static function () {
					return __( 'Show your work in a beautiful photo gallery.', 'jetpack-mu-wpcom' );
				},
				'is_complete'       => static function () {
					$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
					return ! empty( $statuses['add_gallery_page'] );
				},
				'draft_id'          => static function () {
					return AI_Launchpad_Gallery_Page_Listener::get_draft_id();
				},
			),
		);
	}

	/**
	 * The ids this registry defines.
	 *
	 * @return string[]
	 */
	public static function task_ids() {
		return array_keys( self::definitions() );
	}

	/**
	 * Whether this registry owns the given task id.
	 *
	 * @param string $task_id The task id.
	 * @return bool
	 */
	public static function has( $task_id ) {
		return isset( self::definitions()[ $task_id ] );
	}

	/**
	 * Builds a registry task into the card shape build_tasks() emits, or null for an unknown id.
	 *
	 * An unpublished marker draft puts the task in progress: the card reopens that draft and takes
	 * the in-progress title, matching how build_tasks() treats catalog site-editor tasks.
	 *
	 * @param string $task_id  The task id.
	 * @param string $subtitle The AI-written subtitle; falls back to the registry default when empty.
	 * @return array|null
	 */
	public static function build( $task_id, $subtitle ) {
		$definition = self::definitions()[ $task_id ] ?? null;
		if ( null === $definition ) {
			return null;
		}

		$completed = (bool) $definition['is_complete']();

		$in_progress  = false;
		$calypso_path = null;
		if ( ! $completed && isset( $definition['draft_id'] ) ) {
			$draft_id = $definition['draft_id']();
			if ( null !== $draft_id ) {
				$in_progress  = true;
				$calypso_path = admin_url( 'post.php?post=' . $draft_id . '&action=edit' );
			}
		}

		$title = $in_progress && isset( $definition['in_progress_title'] )
			? $definition['in_progress_title']()
			: $definition['title']();

		return array(
			'id'           => $task_id,
			'subtitle'     => '' !== $subtitle ? $subtitle : $definition['default_subtitle'](),
			'title'        => $title,
			'completed'    => $completed,
			'in_progress'  => $in_progress,
			'disabled'     => false,
			'calypso_path' => $calypso_path,
		);
	}
}
