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
 * tasks are built here instead, and available_task_ids() offers them to the model alongside the
 * catalog's, so an AI Launchpad task is selectable without the catalog knowing it exists.
 *
 * Each definition supplies the same fields build_tasks() resolves from the catalog. definitions()
 * is rebuilt on every call, including from has() and task_ids(), which is what decides the shape:
 *
 * - `is_complete`, `is_visible` and `draft_id` MUST stay callables. They inspect site state — an
 *   option, a WP_Query, an active plugin — so resolving them eagerly would put that work behind
 *   every id check.
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
	 * - `is_visible`        (callable, optional) whether this site can render the task at all; absent means
	 *                        always. This is the registry's equivalent of the catalog's visibility callback:
	 *                        a task whose precondition is missing must never be offered or rendered, since
	 *                        its CTA would lead nowhere. Omit it rather than returning a constant true, so a
	 *                        universally renderable task reads as one.
	 * - `draft_id`          (callable, optional) the in-progress draft's post id, or null.
	 *
	 * @return array
	 */
	private static function definitions() {
		$definitions = array(
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

		/**
		 * Filters the AI Launchpad's own task definitions.
		 *
		 * The registry is otherwise closed, and this is the only seam through which it can hold more than
		 * its shipped entries — which is what makes it testable with a second definition at all. Callbacks
		 * must be cheap: this map is rebuilt on every has() / task_ids() / is_complete() / is_visible() call.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $definitions Task definitions keyed by task id. See the docblock above for the shape.
		 */
		return apply_filters( 'wpcom_ai_launchpad_task_registry_definitions', $definitions );
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
	 * Whether a registry task is already complete. False for an unknown id.
	 *
	 * Separate from build() so a caller that only needs the flag — available_task_ids(), which runs on every
	 * wizard prewarm — pays for the completion check alone. build() additionally resolves the in-progress draft,
	 * a WP_Query whose result that caller would throw away.
	 *
	 * @param string $task_id The task id.
	 * @return bool
	 */
	public static function is_complete( $task_id ) {
		$definition = self::definitions()[ $task_id ] ?? null;
		return null !== $definition && (bool) $definition['is_complete']();
	}

	/**
	 * Whether this site can render a registry task at all. False for an unknown id.
	 *
	 * `is_visible` is optional, so a definition without one is visible everywhere — the shape the gallery
	 * relies on. Same rationale as is_complete() for living outside build(): available_task_ids() needs the
	 * flag alone, on every wizard prewarm.
	 *
	 * @param string $task_id The task id.
	 * @return bool
	 */
	public static function is_visible( $task_id ) {
		$definition = self::definitions()[ $task_id ] ?? null;
		if ( null === $definition ) {
			return false;
		}

		return ! isset( $definition['is_visible'] ) || (bool) $definition['is_visible']();
	}

	/**
	 * Builds a registry task into the card shape build_tasks() emits, or null for an unknown id.
	 *
	 * An unpublished marker draft puts the task in progress: the card reopens that draft and takes
	 * the in-progress title, matching how build_tasks() treats catalog site-editor tasks.
	 *
	 * Visibility is deliberately not checked here, mirroring the catalog: the gate belongs to the callers
	 * that decide whether a task surfaces, since build_tasks() has to be able to bypass it for the
	 * `?all_tasks=1` testing view.
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

		// Via the accessor, not the callable, so the card and the availability menu can never disagree.
		$completed = self::is_complete( $task_id );

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
