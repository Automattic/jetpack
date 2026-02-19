/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import useDuplicateForm from './use-duplicate-form';
/**
 * Types
 */
import type { FormListItem } from '../../hooks/use-forms-data.ts';

type FormItem = Pick< FormListItem, 'id' > & Partial< Pick< FormListItem, 'title' > >;

type UseFormItemActionsReturn = {
	duplicateForm: ( item: FormItem ) => Promise< void >;
	previewForm: ( item: FormItem ) => Promise< void >;
	copyEmbed: ( item: FormItem ) => Promise< void >;
	copyShortcode: ( item: FormItem ) => Promise< void >;
	isDuplicating: boolean;
};

/**
 * Shared form-level action callbacks (Duplicate, Preview, Copy embed, Copy shortcode).
 *
 * Each callback accepts a minimal `{ id, title? }` object so it works with both
 * full `FormListItem` records (DataViews table) and a simple form ID + title
 * (single form view header).
 *
 * @return Action callbacks and in-flight state.
 */
export default function useFormItemActions(): UseFormItemActionsReturn {
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { duplicateForm, isDuplicating } = useDuplicateForm();

	const previewForm = useCallback( async ( item: FormItem ) => {
		try {
			const response = await apiFetch< { preview_url: string } >( {
				path: `/wp/v2/jetpack-forms/${ item.id }/preview-url`,
			} );
			window.open( response.preview_url, '_blank' );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to get preview URL:', error );
		}
	}, [] );

	const copyEmbed = useCallback(
		async ( item: FormItem ) => {
			const embedCode = `<!-- wp:jetpack/contact-form {"ref":${ item.id }} /-->`;
			try {
				await navigator.clipboard.writeText( embedCode );
				createSuccessNotice( __( 'Embed code copied to clipboard.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			} catch {
				createErrorNotice( __( 'Failed to copy embed code. Please try again.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ createErrorNotice, createSuccessNotice ]
	);

	const copyShortcode = useCallback(
		async ( item: FormItem ) => {
			const shortcode = `[contact-form ref="${ item.id }"]`;
			try {
				await navigator.clipboard.writeText( shortcode );
				createSuccessNotice( __( 'Shortcode copied to clipboard.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			} catch {
				createErrorNotice( __( 'Failed to copy shortcode. Please try again.', 'jetpack-forms' ), {
					type: 'snackbar',
				} );
			}
		},
		[ createErrorNotice, createSuccessNotice ]
	);

	return { duplicateForm, previewForm, copyEmbed, copyShortcode, isDuplicating };
}
