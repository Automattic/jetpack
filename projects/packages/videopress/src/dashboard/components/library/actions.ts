import { __ } from '@wordpress/i18n';
import type { LibraryItem, LibraryItemPrivacy } from '../../types/library';
import type { Action } from '@wordpress/dataviews';

type Api = {
	promoteLocal: ( id: string ) => void;
	retryUpload: ( id: string ) => void;
	deleteItems: ( ids: string[] ) => void;
	setPrivacy: ( ids: string[], privacy: LibraryItemPrivacy ) => void;
	openVideoDetails: ( id: string ) => void;
	manageCaptions: ( item: LibraryItem ) => void;
};

// Allowlist on 'idle' (matching TitleText and ThumbnailField) rather than a
// blocklist of known in-flight statuses, so any future status is excluded
// from row actions by default instead of silently slipping through.
const isVideoPressIdle = ( item: LibraryItem ) =>
	item.type === 'videopress' && item.upload.status === 'idle';

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
 * @param api - Hook mutators forwarded into the action callbacks.
 * @return The actions array for `<DataViews>`.
 */
export function buildLibraryActions( api: Api ): Action< LibraryItem >[] {
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
		{
			id: 'manage-captions',
			label: __( 'Manage subtitles', 'jetpack-videopress-pkg' ),
			supportsBulk: false,
			isEligible: isVideoPressIdle,
			callback: items => {
				const [ item ] = items;
				if ( item ) {
					api.manageCaptions( item );
				}
			},
		},
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
		{
			id: 'delete',
			label: __( 'Delete', 'jetpack-videopress-pkg' ),
			supportsBulk: true,
			isEligible: isVideoPressIdle,
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
