/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useRegistry } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';

type PublishTrackingProps = {
	clientId: string;
	layout: string;
	videoCount: number;
	blockName?: string;
	eventName?: string;
};

type EditorSelectors = {
	isSavingPost?: () => boolean;
	isPublishingPost?: () => boolean;
	isAutosavingPost?: () => boolean;
	isPreviewingPost?: () => boolean;
	didPostSaveRequestSucceed?: () => boolean;
	getCurrentPostId?: () => number | string | null;
	getCurrentPostType?: () => string;
	getCurrentPostAttribute?: ( name: string ) => unknown;
};

type BlockEditorSelectors = {
	getBlocksByName?: ( name: string ) => string[];
};

type PendingPublication = {
	postId: number | string;
	properties: {
		post_type: string;
		layout: string;
		video_count: number;
		playlist_count: number;
	};
};

/**
 * Record one event per playlist type after an observed publication save succeeds.
 *
 * @param props            - Hook props.
 * @param props.clientId   - This block instance's client id.
 * @param props.layout     - The block's current layout.
 * @param props.videoCount - Number of videos in this playlist.
 * @param props.blockName  - Block type the reporter is elected among.
 * @param props.eventName  - Tracks event to record.
 */
export default function usePublishTracking( {
	clientId,
	layout,
	videoCount,
	blockName = 'videopress/playlist',
	eventName = 'jetpack_videopress_playlist_block_published',
}: PublishTrackingProps ) {
	const registry = useRegistry();

	useEffect( () => {
		const editor = registry.select( editorStore ) as EditorSelectors;
		let wasSaving = editor?.isSavingPost?.() ?? false;
		let pending: PendingPublication | undefined;
		let detached = false;

		// Store notifications preserve save transitions that React can batch into one render.
		const unsubscribe = registry.subscribe( () => {
			const isSaving = editor?.isSavingPost?.() ?? false;
			const started = isSaving && ! wasSaving;
			wasSaving = isSaving;
			if ( ! pending && ( ! started || detached ) ) {
				return;
			}

			if ( pending ) {
				const samePost =
					pending.postId === editor?.getCurrentPostId?.() &&
					pending.properties.post_type === editor?.getCurrentPostType?.();
				if ( ! isSaving || ! samePost ) {
					const publication = pending;
					pending = undefined;
					if ( detached ) {
						unsubscribe();
					}
					if (
						samePost &&
						! isSaving &&
						editor?.didPostSaveRequestSucceed?.() === true &&
						editor?.getCurrentPostAttribute?.( 'status' ) === 'publish'
					) {
						jetpackAnalytics.tracks.recordEvent( eventName, publication.properties );
					}
				}
				return;
			}

			if (
				! editor?.isPublishingPost?.() ||
				editor?.isAutosavingPost?.() !== false ||
				editor?.isPreviewingPost?.() !== false
			) {
				return;
			}

			const blocks = registry.select( blockEditorStore ) as BlockEditorSelectors;
			const playlistClientIds = blocks?.getBlocksByName?.( blockName ) ?? [];
			if ( playlistClientIds[ 0 ] !== clientId ) {
				return;
			}

			const postId = editor?.getCurrentPostId?.();
			const postType = editor?.getCurrentPostType?.();
			if ( postId == null || ! postType ) {
				return;
			}

			pending = {
				postId,
				properties: {
					post_type: postType,
					layout,
					video_count: videoCount,
					playlist_count: playlistClientIds.length,
				},
			};
		} );

		return () => {
			// A captured save can finish after the block unmounts or its props change.
			detached = true;
			if ( ! pending ) {
				unsubscribe();
			}
		};
	}, [ registry, clientId, layout, videoCount, blockName, eventName ] );
}
