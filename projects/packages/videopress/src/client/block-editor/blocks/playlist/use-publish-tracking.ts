/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef } from '@wordpress/element';

type PublishTrackingProps = {
	clientId: string;
	layout: string;
	videoCount: number;
};

type EditorSelectors = {
	isPublishingPost?: () => boolean;
	getCurrentPostType?: () => string;
	getBlocksByName?: ( name: string ) => string[];
};

/**
 * Record a Tracks event when a post or page is published containing the
 * playlist block. The first playlist block in the post is the designated
 * reporter, so multi-playlist posts still record exactly one event per
 * publish.
 *
 * @param props            - Hook props.
 * @param props.clientId   - This block instance's client id.
 * @param props.layout     - The block's current layout.
 * @param props.videoCount - Number of videos in this playlist.
 */
export default function usePublishTracking( {
	clientId,
	layout,
	videoCount,
}: PublishTrackingProps ) {
	const { isPublishing, postType, playlistClientIds } = useSelect( select => {
		const editorSelectors = select( editorStore ) as EditorSelectors;
		const blockEditorSelectors = select( blockEditorStore ) as EditorSelectors;

		return {
			isPublishing: editorSelectors?.isPublishingPost?.() ?? false,
			postType: editorSelectors?.getCurrentPostType?.() ?? '',
			playlistClientIds: blockEditorSelectors?.getBlocksByName?.( 'videopress/playlist' ) ?? [],
		};
	}, [] );

	const publishTracked = useRef( false );

	useEffect( () => {
		if ( ! isPublishing ) {
			publishTracked.current = false;
			return;
		}
		if (
			publishTracked.current ||
			( playlistClientIds.length > 0 && playlistClientIds[ 0 ] !== clientId )
		) {
			return;
		}
		publishTracked.current = true;

		jetpackAnalytics.tracks.recordEvent( 'jetpack_videopress_playlist_block_published', {
			post_type: postType,
			layout,
			video_count: videoCount,
			playlist_count: Math.max( 1, playlistClientIds.length ),
		} );
	}, [ isPublishing, playlistClientIds, clientId, postType, layout, videoCount ] );
}
