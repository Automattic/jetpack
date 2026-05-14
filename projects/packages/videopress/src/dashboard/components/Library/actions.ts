import { __ } from '@wordpress/i18n';
import type { LibraryItemPrivacy, MockLibraryItem } from '../../types/library';
import type { Action } from '@wordpress/dataviews';

type Api = {
	promoteLocal: ( id: string ) => void;
	retryUpload: ( id: string ) => void;
	deleteItems: ( ids: string[] ) => void;
	setPrivacy: ( id: string, privacy: LibraryItemPrivacy ) => void;
	openVideoDetails: ( id: string ) => void;
};

const isVideoPressIdle = ( item: MockLibraryItem ) =>
	item.type === 'videopress' && item.upload.status !== 'failed';

/**
 * Build the DataViews actions array for the Library tab. Eligibility predicates
 * gate per-row availability based on `item.type` and `item.upload.status`. The
 * Delete action sets `supportsBulk: true` and `isEligible` to filter local items
 * out of mixed selections (DataViews silently skips ineligible items).
 *
 * @param api - Hook mutators forwarded into the action callbacks.
 * @return The actions array for `<DataViews>`.
 */
export function buildLibraryActions( api: Api ): Action< MockLibraryItem >[] {
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
			id: 'set-privacy-public',
			label: __( 'Make public', 'jetpack-videopress-pkg' ),
			supportsBulk: false,
			isEligible: item => item.type === 'videopress' && item.privacy !== 'public',
			callback: items => {
				const [ item ] = items;
				if ( item ) {
					api.setPrivacy( item.id, 'public' );
				}
			},
		},
		{
			id: 'set-privacy-private',
			label: __( 'Make private', 'jetpack-videopress-pkg' ),
			supportsBulk: false,
			isEligible: item => item.type === 'videopress' && item.privacy !== 'private',
			callback: items => {
				const [ item ] = items;
				if ( item ) {
					api.setPrivacy( item.id, 'private' );
				}
			},
		},
		{
			id: 'set-privacy-site',
			label: __( 'Use site default', 'jetpack-videopress-pkg' ),
			supportsBulk: false,
			isEligible: item => item.type === 'videopress' && item.privacy !== 'site-default',
			callback: items => {
				const [ item ] = items;
				if ( item ) {
					api.setPrivacy( item.id, 'site-default' );
				}
			},
		},
		{
			id: 'delete',
			label: __( 'Delete', 'jetpack-videopress-pkg' ),
			supportsBulk: true,
			isEligible: item => item.type === 'videopress',
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
