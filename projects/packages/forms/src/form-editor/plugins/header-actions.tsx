/**
 * Header Actions Plugin
 *
 * Adds "View Responses" button and "More Actions" dropdown to the form editor header.
 * Uses a portal to inject into the editor header slot.
 */

import { Button, DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState, createPortal } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, copy, shortcode } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

declare global {
	interface Window {
		jpFormsBlocks?: {
			defaults?: {
				formsResponsesUrl?: string;
			};
		};
	}
}

/**
 * Get the responses URL for the current form.
 *
 * @param postId - The post ID of the form.
 * @return The URL to view form responses.
 */
const getResponsesUrl = ( postId: number ): string => {
	const baseUrl =
		window.jpFormsBlocks?.defaults?.formsResponsesUrl ||
		'/wp-admin/admin.php?page=jetpack-forms-admin';
	// Navigate to the specific form's responses
	return `${ baseUrl }#/forms/${ postId }/responses`;
};

/**
 * Generate the embed code for the form.
 *
 * @param postId - The post ID of the form.
 * @return The embed code HTML string.
 */
const generateEmbedCode = ( postId: number ): string => {
	return `<!-- wp:jetpack/contact-form {"formId":${ postId }} /-->`;
};

/**
 * Generate the shortcode for the form.
 *
 * @param postId - The post ID of the form.
 * @return The shortcode string.
 */
const generateShortcode = ( postId: number ): string => {
	return `[contact-form ref="${ postId }"]`;
};

/**
 * Header Actions component.
 *
 * Renders a "View Responses" button and "More Actions" dropdown in the editor header.
 *
 * @return The header actions component or null.
 */
export const HeaderActions = () => {
	const [ headerSlot, setHeaderSlot ] = useState< Element | null >( null );

	const postId = useSelect( select => {
		const editor = select( 'core/editor' ) as {
			getCurrentPostId: () => number;
		};
		return editor.getCurrentPostId();
	} );

	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	// Find the header slot element
	useEffect( () => {
		const findHeaderSlot = () => {
			// Look for the editor header actions area (right side of the header)
			// The header toolbar typically has a class like 'edit-post-header__settings'
			const settingsArea = document.querySelector( '.edit-post-header__settings' );
			if ( settingsArea ) {
				setHeaderSlot( settingsArea );
				return;
			}
			// Fallback to editor-header__settings for newer editor versions
			const editorSettingsArea = document.querySelector( '.editor-header__settings' );
			if ( editorSettingsArea ) {
				setHeaderSlot( editorSettingsArea );
			}
		};

		// Initial check
		findHeaderSlot();

		// Set up a mutation observer to detect when the header is rendered
		const observer = new MutationObserver( () => {
			if ( ! headerSlot ) {
				findHeaderSlot();
			}
		} );

		observer.observe( document.body, {
			childList: true,
			subtree: true,
		} );

		return () => {
			observer.disconnect();
		};
	}, [ headerSlot ] );

	const handleViewResponses = useCallback( () => {
		if ( postId ) {
			window.location.href = getResponsesUrl( postId );
		}
	}, [ postId ] );

	const handleCopyEmbedCode = useCallback( async () => {
		if ( ! postId ) {
			return;
		}
		const embedCode = generateEmbedCode( postId );
		try {
			await navigator.clipboard.writeText( embedCode );
			createSuccessNotice( __( 'Embed code copied to clipboard.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
		} catch {
			createErrorNotice( __( 'Failed to copy embed code.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
		}
	}, [ postId, createSuccessNotice, createErrorNotice ] );

	const handleCopyShortcode = useCallback( async () => {
		if ( ! postId ) {
			return;
		}
		const shortcodeText = generateShortcode( postId );
		try {
			await navigator.clipboard.writeText( shortcodeText );
			createSuccessNotice( __( 'Shortcode copied to clipboard.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
		} catch {
			createErrorNotice( __( 'Failed to copy shortcode.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
		}
	}, [ postId, createSuccessNotice, createErrorNotice ] );

	// Wait for the header slot to be available
	if ( ! headerSlot ) {
		return null;
	}

	const headerContent = (
		<div className="jetpack-forms-header-actions">
			<Button
				variant="secondary"
				onClick={ handleViewResponses }
				className="jetpack-forms-header-actions__view-responses"
			>
				{ __( 'View Responses', 'jetpack-forms' ) }
			</Button>
			<DropdownMenu
				icon={ chevronDown }
				label={ __( 'More actions', 'jetpack-forms' ) }
				className="jetpack-forms-header-actions__more"
			>
				{ () => (
					<MenuGroup>
						<MenuItem icon={ copy } onClick={ handleCopyEmbedCode }>
							{ __( 'Copy embed code', 'jetpack-forms' ) }
						</MenuItem>
						<MenuItem icon={ shortcode } onClick={ handleCopyShortcode }>
							{ __( 'Copy shortcode', 'jetpack-forms' ) }
						</MenuItem>
					</MenuGroup>
				) }
			</DropdownMenu>
		</div>
	);

	// Use createPortal to inject into the header
	return createPortal( headerContent, headerSlot );
};
