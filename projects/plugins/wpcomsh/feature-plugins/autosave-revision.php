<?php
/**
 * Auto-save revisions file.
 *
 * @package wpcomsh
 */

/**
 * Compare the proposed update with the last stored revision verifying that
 * they are different, unless a plugin tells us to always save regardless.
 *
 * TODO: this function is extracted from Core's wp_save_post_revision function. Submit it as
 *       a Core patch and then delete if from here after it's merged.
 *
 * @param int     $post_id The ID of the post to save as a revision.
 * @param WP_Post $post    The proposed post update.
 * @return bool Whether the proposed update is different from the last saved revision.
 */
function wpcom_post_has_changed_since_last_revision( $post_id, $post ) {
	$revisions = wp_get_post_revisions( $post_id );
	// If no previous revisions, save one
	if ( ! $revisions ) {
		return true;
	}

	// grab the last revision, but not an autosave
	foreach ( $revisions as $revision ) {
		if ( false !== strpos( $revision->post_name, "{$revision->post_parent}-revision" ) ) {
			$last_revision = $revision;
			break;
		}
	}

	if ( ! isset( $last_revision ) ) {
		return true;
	}

	/**
	 * Filters whether the post has changed since the last revision.
	 *
	 * By default a revision is saved only if one of the revisioned fields has changed.
	 * This filter can override that so a revision is saved even if nothing has changed.
	 *
	 * @since 3.6.0
	 *
	 * @param bool    $check_for_changes Whether to check for changes before saving a new revision.
	 *                                   Default true.
	 * @param WP_Post $last_revision     The last revision post object.
	 * @param WP_Post $post              The post object.
	 */
	if ( ! apply_filters( 'wp_save_post_revision_check_for_changes', $check_for_changes = true, $last_revision, $post ) ) { // phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition
		return true;
	}

	$post_has_changed = false;

	foreach ( array_keys( _wp_post_revision_fields( $post ) ) as $field ) {
		if ( normalize_whitespace( $post->$field ) != normalize_whitespace( $last_revision->$field ) ) { // phpcs:ignore WordPress.PHP.StrictComparisons
			$post_has_changed = true;
			break;
		}
	}

	/**
	 * Filters whether a post has changed.
	 *
	 * By default a revision is saved only if one of the revisioned fields has changed.
	 * This filter allows for additional checks to determine if there were changes.
	 *
	 * @since 4.1.0
	 *
	 * @param bool    $post_has_changed Whether the post has changed.
	 * @param WP_Post $last_revision    The last revision post object.
	 * @param WP_Post $post             The post object.
	 */
	$post_has_changed = (bool) apply_filters( 'wp_save_post_revision_post_has_changed', $post_has_changed, $last_revision, $post );

	return $post_has_changed;
}

/**
 * Determine if the two versions (autosave revisions) of a post are different enough to warrant
 * saving the old autosave as a separate post revision.
 *
 * @param WP_Post $post_before Post from before this edit.
 * @param WP_Post $post_after  Post with the current edit.
 *
 * @return bool
 */
function wpcom_is_big_edit( $post_before, $post_after ) {
	// TODO: make the criteria more reasonable, maybe even make a text diff and look at its +-.
	$before_len = strlen( $post_before->post_content );
	$after_len  = strlen( $post_after->post_content );
	$size_diff  = absint( $after_len - $before_len );

	/*
	 * Depends on size: Starts at 50 chars (approx one line) for smallest posts, and ends up
	 * being at least 250 chars for 1000 chars posts and bigger.
	 */
	$size_threshold = 50 + min( $before_len, 1000 ) / 5;

	return $size_diff > $size_threshold;
}

/**
 * When a post is autosaved, we don't create a post revision for that save. On multiple
 * consecutive autosaves, we overwrite the old autosave (i.e., the post itself in case of drafts or
 * an autosave revision in case of published posts) and its content is lost forever.
 *
 * This function will compare the old and new autosave, determine if they are significantly
 * from each other and if they are, saves the old autosave as a separate post revision.
 * This prevents losing valuable unsaved content in case an autosave goes awry, e.g., it empties
 * the post content due to an editor bug or unwanted edit.
 *
 * @param int     $post_ID     Post ID.
 * @param WP_Post $post_after  Post with the current edit.
 * @param WP_Post $post_before Post from before this edit.
 */
function wpcom_create_autosave_revision( $post_ID, $post_after, $post_before ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
	// We are only interested in post changes done during autosave.
	if ( ! defined( 'DOING_AUTOSAVE' ) || ! DOING_AUTOSAVE ) {
		return;
	}

	/*
	 * Get the actual post whose revision is to be saved: we might need to reach out for the parent
	 * post if the update is for autosave revision. It's simply the $post_before for draft autosave.
	 */
	$revision_post = $post_before;

	if ( $post_before->post_type === 'revision' ) {
		if ( strpos( $post_before->post_name, "{$post_before->post_parent}-autosave" ) === false ) {
			// Update of a non-autosave revision: we're not interested in this kind of update.
			return;
		}

		// It's an update of autosave revision, retrieve the parent post.
		$revision_post = get_post( $post_before->post_parent );
	}

	// Bail out if the post type doesn't support revisions.
	if ( ! wp_revisions_enabled( $revision_post ) ) {
		return;
	}

	/*
	 * The autosave revision can either have fresh content, if it's newer than the saved post, or
	 * be stale: we don't delete the autosave revision when saving the post. We'll reuse it later
	 * on the next autosave instead of creating a new one.
	 * If the autosave is indeed fresh, update the parent post with its content and timestamp before
	 * saving it as revision.
	 */
	if ( $post_before->post_modified > $revision_post->post_modified ) {
		foreach ( array_keys( _wp_post_revision_fields( $revision_post ) ) as $field ) {
			$revision_post->$field = $post_before->$field;
		}
		$revision_post->post_modified     = $post_before->post_modified;
		$revision_post->post_modified_gmt = $post_before->post_modified_gmt;
	}

	// Don't save a revision if it would be identical to the last saved revision.
	if ( ! wpcom_post_has_changed_since_last_revision( $revision_post->ID, $revision_post ) ) {
		return;
	}

	/*
	 * We'll save a post revision only if the difference between the old and new autosave is big.
	 * then the old autosave is worth preserving: it would be overwritten and lost otherwise.
	 */
	if ( ! wpcom_is_big_edit( $revision_post, $post_after ) ) {
		return;
	}

	_wp_put_post_revision( $revision_post );
}
add_action( 'post_updated', 'wpcom_create_autosave_revision', 10, 3 );
