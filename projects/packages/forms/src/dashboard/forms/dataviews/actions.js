/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { external, pencil, copy, trash } from '@wordpress/icons';

/**
 * View form action - opens the form in the editor.
 */
export const viewFormAction = {
	id: 'view-form',
	label: __( 'View', 'jetpack-forms' ),
	isPrimary: true,
	icon: external,
	callback( items ) {
		const [ item ] = items;
		// The jetpack_form CPT is not publicly viewable; open the editor instead.
		const editUrl = `/wp-admin/post.php?post=${ item.id }&action=edit`;
		window.open( editUrl, '_blank' );
	},
};

/**
 * Edit form action - opens the form in the block editor.
 */
export const editFormAction = {
	id: 'edit-form',
	label: __( 'Edit', 'jetpack-forms' ),
	icon: pencil,
	callback( items ) {
		const [ item ] = items;
		// Navigate to the WordPress post editor for this form
		const editUrl = `/wp-admin/post.php?post=${ item.id }&action=edit`;
		window.location.href = editUrl;
	},
};

/**
 * Duplicate form action - creates a copy of the form.
 */
export const duplicateFormAction = {
	id: 'duplicate-form',
	label: __( 'Duplicate', 'jetpack-forms' ),
	icon: copy,
	callback( items ) {
		const [ item ] = items;

		// Create a duplicate via REST API
		apiFetch( {
			path: `/wp/v2/jetpack-forms/${ item.id }`,
			method: 'POST',
			data: {
				title: `${ item.title.rendered } (Copy)`,
				content: item.content.raw,
				status: 'draft',
				meta: {
					_jetpack_form_settings: item.meta._jetpack_form_settings,
					_jetpack_form_integrations: item.meta._jetpack_form_integrations,
				},
			},
		} )
			.then( newForm => {
				// Navigate to edit the new form
				window.location.href = `/wp-admin/post.php?post=${ newForm.id }&action=edit`;
			} )
			.catch( error => {
				// eslint-disable-next-line no-console
				console.error( 'Failed to duplicate form:', error );
				// eslint-disable-next-line no-alert
				alert( __( 'Failed to duplicate form. Please try again.', 'jetpack-forms' ) );
			} );
	},
};

/**
 * Delete form action - moves form to trash.
 */
export const deleteFormAction = {
	id: 'delete-form',
	label: __( 'Move to Trash', 'jetpack-forms' ),
	icon: trash,
	isDestructive: true,
	callback( items ) {
		const [ item ] = items;

		if (
			// eslint-disable-next-line no-alert
			! window.confirm( __( 'Are you sure you want to move this form to trash?', 'jetpack-forms' ) )
		) {
			return;
		}

		apiFetch( {
			path: `/wp/v2/jetpack-forms/${ item.id }`,
			method: 'DELETE',
		} )
			.then( () => {
				// Reload the page to refresh the forms list
				window.location.reload();
			} )
			.catch( error => {
				// eslint-disable-next-line no-console
				console.error( 'Failed to delete form:', error );
				// eslint-disable-next-line no-alert
				alert( __( 'Failed to delete form. Please try again.', 'jetpack-forms' ) );
			} );
	},
};
