<?php
/**
 * VideoPress playlist block.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Server side of the dynamic videopress/playlist block.
 *
 * The block stores only presentation attributes; membership and order live in
 * the videopress-playlists taxonomy and its term meta, so the frontend markup
 * is produced by a render callback at request time. For now this class
 * carries the shared order-resolution helper; registration and the render
 * callback build on it.
 */
class Playlist_Block {

	/**
	 * Reconciles a stored playlist order with the playlist's actual members.
	 *
	 * PHP twin of resolveOrderedIds() in src/client/lib/playlist-order — keep
	 * the semantics in lockstep or the editor preview and the frontend render
	 * will disagree. `vps_playlist_order` term meta is presentation-only and
	 * can drift from the real term relationships: order entries whose ID is no
	 * longer a member are dropped, members absent from the order are appended
	 * in the sequence `$member_ids` arrives in, and duplicates keep their
	 * first position. Entries are cast to int so meta values that round-trip
	 * as numeric strings still match.
	 *
	 * @param array $order      The stored `vps_playlist_order` attachment IDs.
	 * @param array $member_ids IDs of the attachments actually carrying the term.
	 * @return int[] The reconciled, fully-covering ordered ID list.
	 */
	public static function resolve_ordered_ids( array $order, array $member_ids ): array {
		$member_ids = array_map( 'intval', $member_ids );
		$members    = array_fill_keys( $member_ids, true );
		$ordered    = array();

		foreach ( array_merge( array_map( 'intval', $order ), $member_ids ) as $id ) {
			if ( isset( $members[ $id ] ) && ! isset( $ordered[ $id ] ) ) {
				$ordered[ $id ] = $id;
			}
		}

		return array_values( $ordered );
	}
}
