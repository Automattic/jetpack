<?php
/**
 * Storage contract for viewer history.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * One row per site, viewer and GUID. Rows carry progress, merged played intervals, the
 * automatic completion, the viewer's manual override and the reset generation. A deleted
 * record stays as a short-lived tombstone so a delayed event cannot recreate it.
 *
 * Rows are arrays with: user_id, guid, position_ms, duration_ms, watched_ms, intervals
 * ( list of [start, end] ms ), completed, manual ( '', 'watched', 'unwatched' ), legacy_seen,
 * generation, session, seq, deleted, updated ( unix time ).
 */
interface History_Store {

	/**
	 * A viewer's row for a video, tombstones included.
	 *
	 * @param int    $user_id Viewer.
	 * @param string $guid    VideoPress GUID.
	 * @return array|null
	 */
	public function get( $user_id, $guid );

	/**
	 * Rows for several videos, keyed by GUID; tombstones left out.
	 *
	 * @param int      $user_id Viewer.
	 * @param string[] $guids   GUIDs.
	 * @return array<string, array>
	 */
	public function get_many( $user_id, array $guids );

	/**
	 * Insert or replace a row.
	 *
	 * @param array $row Row.
	 * @return bool
	 */
	public function save( array $row );

	/**
	 * A viewer's rows, most recent activity first, then by GUID; tombstones left out.
	 *
	 * @param int        $user_id Viewer.
	 * @param int        $limit   Most rows.
	 * @param array|null $after   Cursor: array( updated, guid ) of the last row of the previous page.
	 * @return array[]
	 */
	public function list_recent( $user_id, $limit, $after = null );

	/**
	 * Delete every row of a viewer.
	 *
	 * @param int $user_id Viewer.
	 * @return int Rows deleted.
	 */
	public function delete_all( $user_id );

	/**
	 * Delete rows last active before a time, and tombstones older than another.
	 *
	 * @param int $before           Unix time for rows.
	 * @param int $tombstone_before Unix time for tombstones.
	 * @return int Rows deleted.
	 */
	public function purge( $before, $tombstone_before );
}
