<?php
/**
 * Seam double for the promote flow of WPCOM_REST_API_V2_Endpoint_VideoPress.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Overrides exactly the wpcom-touching promote seams so WorDBless tests can
 * drive the real orchestration in videopress_promote_attachment() — the
 * ordering, error contract, and mutex behavior — none of which is otherwise
 * reachable in CI (IS_WPCOM can't be defined there). Everything not listed
 * here (attachment validation, path check, wp_cache mutex, responses) runs
 * the production code.
 */
class Mock_Promote_Endpoint extends WPCOM_REST_API_V2_Endpoint_VideoPress {

	/**
	 * Scripted promote_is_available() result.
	 *
	 * @var bool
	 */
	public $available = true;

	/**
	 * Scripted promote_site_has_videopress() result.
	 *
	 * @var bool
	 */
	public $has_videopress = true;

	/**
	 * Scripted promote_load_primitives() result.
	 *
	 * @var bool
	 */
	public $primitives_loaded = true;

	/**
	 * Scripted results for successive promote_video_info() calls: the
	 * pre-check read first, then the post-transcode verification read.
	 * Exhausting the list yields false (no live row).
	 *
	 * @var array
	 */
	public $video_infos = array();

	/**
	 * Scripted promote_find_any_guid() result (tombstone detection).
	 *
	 * @var string|null
	 */
	public $any_guid = null;

	/**
	 * Attachment ids promote_transcode() was invoked for.
	 *
	 * @var array
	 */
	public $transcoded = array();

	/**
	 * Skip the parent constructor: no route-registration side effects.
	 */
	public function __construct() {
	}

	/**
	 * Scripted host availability.
	 *
	 * @return bool
	 */
	protected function promote_is_available() {
		return $this->available;
	}

	/**
	 * Scripted plan gate.
	 *
	 * @param int $blog_id The blog id (unused by the double).
	 * @return bool
	 */
	protected function promote_site_has_videopress( $blog_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->has_videopress;
	}

	/**
	 * Scripted primitives availability.
	 *
	 * @return bool
	 */
	protected function promote_load_primitives() {
		return $this->primitives_loaded;
	}

	/**
	 * Scripted live-row reads, consumed in call order.
	 *
	 * @param int $blog_id       The blog id (unused by the double).
	 * @param int $attachment_id The attachment id (unused by the double).
	 * @return object|false
	 */
	protected function promote_video_info( $blog_id, $attachment_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return count( $this->video_infos ) > 0 ? array_shift( $this->video_infos ) : false;
	}

	/**
	 * Scripted tombstone lookup.
	 *
	 * @param int $blog_id       The blog id (unused by the double).
	 * @param int $attachment_id The attachment id (unused by the double).
	 * @return string|null
	 */
	protected function promote_find_any_guid( $blog_id, $attachment_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->any_guid;
	}

	/**
	 * Record the primitive invocation instead of running wpcom code.
	 *
	 * @param int $attachment_id The attachment id.
	 * @return void
	 */
	protected function promote_transcode( $attachment_id ) {
		$this->transcoded[] = $attachment_id;
	}
}
