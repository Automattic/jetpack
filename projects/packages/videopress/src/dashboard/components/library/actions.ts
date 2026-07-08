import { __, _n } from '@wordpress/i18n';
import { isStudioEnabled } from '../../utils/studio';
import AddToPlaylistModal from './add-to-playlist-modal';
import type { LibraryItem, LibraryItemPrivacy } from '../../types/library';
import type { Action } from '@wordpress/dataviews';

type Api = {
	promoteLocal: ( id: string ) => void;
	retryUpload: ( id: string ) => void;
	deleteItems: ( ids: string[] ) => void;
	setPrivacy: ( ids: string[], privacy: LibraryItemPrivacy ) => void;
	openVideoDetails: ( id: string ) => void;
	openVideoAnalytics: ( id: string ) => void;
	// Receives the whole item (not just the id) so the stage can hand the
	// attach dialog a stable snapshot of the draft without looking it up in a
	// listing that refetches (and drops the row) mid-flow.
	attachMedia: ( item: LibraryItem ) => void;
};

// Allowlist on 'idle' (matching TitleText and ThumbnailField) rather than a
// blocklist of known in-flight statuses, so any future status is excluded
// from row actions by default instead of silently slipping through. The type
// check is an allowlist for the same reason: import drafts (type 'draft')
// have no VideoPress guid, so they must never match the video actions here
// — nor the local-only upload path, which allowlists 'local'.
const isVideoPressIdle = ( item: LibraryItem ) =>
	item.type === 'videopress' && item.upload.status === 'idle';

// Import drafts get their own pair of affordances instead of the video
// actions: "Attach video file" completes the import, and the shared Delete
// action discards it (the delete path is a plain /wp/v2/media force-delete,
// so it needs no VideoPress guid). Same idle allowlist as above so a draft
// mid-delete can't be attached or double-deleted.
const isDraftIdle = ( item: LibraryItem ) => item.type === 'draft' && item.upload.status === 'idle';

/**
 * Eligibility for a privacy action: the item must be an idle VideoPress video
 * that does not already have the target privacy. Local items, in-flight videos,
 * and videos already at the requested setting are filtered out, so a mixed bulk
 * selection only touches the rows that actually need to change.
 *
 * @param target - The privacy value the action would apply.
 * @return An `isEligible` predicate for the DataViews action.
 */
const isPrivacyChangeEligible = ( target: LibraryItemPrivacy ) => ( item: LibraryItem ) =>
	isVideoPressIdle( item ) && item.privacy !== target;

// The privacy actions differ only by target value, label, and id suffix, so
// build them from one descriptor to keep them in lockstep. The id suffix is
// kept separate because `site-default` ships under the shorter `set-privacy-site`.
const PRIVACY_ACTIONS: { idSuffix: string; label: string; privacy: LibraryItemPrivacy }[] = [
	{ idSuffix: 'public', label: __( 'Make public', 'jetpack-videopress-pkg' ), privacy: 'public' },
	{
		idSuffix: 'private',
		label: __( 'Make private', 'jetpack-videopress-pkg' ),
		privacy: 'private',
	},
	{
		idSuffix: 'site',
		label: __( 'Reset to site default', 'jetpack-videopress-pkg' ),
		privacy: 'site-default',
	},
];

/**
 * Build the DataViews actions array for the Library tab. Eligibility predicates
 * gate per-row availability based on `item.type` and `item.upload.status`. The
 * Delete and privacy actions set `supportsBulk: true` and use `isEligible` to
 * filter out items that can't accept the change (local items, in-flight videos,
 * or videos already at the target privacy). DataViews silently skips ineligible
 * items, so a mixed selection only applies to the rows that qualify. Rows with a
 * delete already in flight are ineligible for every action so a slow delete
 * can't be double-fired or raced by an edit.
 *
 * With the Studio flag on, more actions appear: a bulk "Add to playlist"
 * action that confirms through a DataViews modal (see AddToPlaylistModal,
 * which owns the membership mutation, so it needs no entry in `api`), a
 * per-row "View analytics" action that routes to the video's Analytics
 * screen at `/video/{id}/analytics`, and a per-row "Attach video file"
 * action on import drafts that opens the stage-owned attach dialog (see
 * AttachMediaModal). Drafts are also deletable through the shared Delete
 * action; every other action excludes them.
 *
 * @param api - Hook mutators forwarded into the action callbacks.
 * @return The actions array for `<DataViews>`.
 */
export function buildLibraryActions( api: Api ): Action< LibraryItem >[] {
	// Gated with the same predicate as the analytics route itself: the
	// screen only exists (server-side route registry included) when the
	// Studio flag is on.
	const viewAnalytics: Action< LibraryItem >[] = isStudioEnabled()
		? [
				{
					id: 'view-analytics',
					label: __( 'View analytics', 'jetpack-videopress-pkg' ),
					supportsBulk: false,
					isEligible: isVideoPressIdle,
					callback: ( items: LibraryItem[] ) => {
						const [ item ] = items;
						if ( item ) {
							api.openVideoAnalytics( item.id );
						}
					},
				},
		  ]
		: [];

	// Gated like the drafts themselves: with the flag off the server strips
	// the import field from /wp/v2/media, so type 'draft' can never occur and
	// the action would be dead weight in every menu.
	const attachMedia: Action< LibraryItem >[] = isStudioEnabled()
		? [
				{
					id: 'attach-media',
					label: __( 'Attach video file', 'jetpack-videopress-pkg' ),
					isPrimary: true,
					supportsBulk: false,
					isEligible: isDraftIdle,
					callback: ( items: LibraryItem[] ) => {
						const [ item ] = items;
						if ( item ) {
							api.attachMedia( item );
						}
					},
				},
		  ]
		: [];

	const addToPlaylist: Action< LibraryItem >[] = isStudioEnabled()
		? [
				{
					id: 'add-to-playlist',
					label: __( 'Add to playlist', 'jetpack-videopress-pkg' ),
					supportsBulk: true,
					isEligible: isVideoPressIdle,
					RenderModal: AddToPlaylistModal,
					modalHeader: items =>
						_n(
							'Add video to playlist',
							'Add videos to playlist',
							items.length,
							'jetpack-videopress-pkg'
						),
				},
		  ]
		: [];

	return [
		{
			id: 'edit-details',
			label: __( 'Edit details', 'jetpack-videopress-pkg' ),
			isPrimary: true,
			supportsBulk: false,
			isEligible: isVideoPressIdle,
			callback: items => {
				const [ item ] = items;
				if ( item ) {
					api.openVideoDetails( item.id );
				}
			},
		},
		...viewAnalytics,
		...PRIVACY_ACTIONS.map( ( { idSuffix, label, privacy } ) => ( {
			id: `set-privacy-${ idSuffix }`,
			label,
			supportsBulk: true,
			isEligible: isPrivacyChangeEligible( privacy ),
			callback: ( items: LibraryItem[] ) => {
				api.setPrivacy(
					items.map( i => i.id ),
					privacy
				);
			},
		} ) ),
		...addToPlaylist,
		...attachMedia,
		{
			id: 'delete',
			label: __( 'Delete', 'jetpack-videopress-pkg' ),
			supportsBulk: true,
			// Drafts qualify too: deleting one discards the import (see the
			// isDraftIdle comment — the delete path never touches a guid).
			isEligible: item => isVideoPressIdle( item ) || isDraftIdle( item ),
			callback: items => {
				api.deleteItems( items.map( i => i.id ) );
			},
		},
		{
			id: 'upload-to-vp',
			label: __( 'Upload to VideoPress', 'jetpack-videopress-pkg' ),
			isPrimary: true,
			supportsBulk: false,
			isEligible: item =>
				item.type === 'local' &&
				item.upload.status !== 'uploading' &&
				item.upload.status !== 'failed',
			callback: items => {
				const [ item ] = items;
				if ( item ) {
					api.promoteLocal( item.id );
				}
			},
		},
		{
			id: 'retry-upload',
			label: __( 'Retry', 'jetpack-videopress-pkg' ),
			isPrimary: true,
			supportsBulk: false,
			isEligible: item => item.upload.status === 'failed',
			callback: items => {
				const [ item ] = items;
				if ( item ) {
					api.retryUpload( item.id );
				}
			},
		},
	];
}
