/**
 * Header Actions Plugin
 *
 * Adds "View Responses" button and "More Actions" dropdown to the form editor header.
 * Uses a portal to inject into the editor header slot.
 */

import { Button, DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState, useRef, createPortal } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, chevronDown, copy, shortcode } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Get the responses URL for the current form.
 *
 * @param postId - The post ID of the form.
 * @return The URL to view form responses.
 */
const getResponsesUrl = ( postId: number ): string => {
	const baseUrl =
		window.jpFormsBlocks?.defaults?.formsResponsesUrl ||
		'/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin';
	// Navigate to the specific form's responses
	return `${ baseUrl }&p=%2Fresponses%2Finbox%3FsourceId%3D${ postId }`;
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
type CopiedItem = 'embed' | 'shortcode' | null;

export const HeaderActions = () => {
	const [ headerSlot, setHeaderSlot ] = useState< Element | null >( null );
	const [ copiedItem, setCopiedItem ] = useState< CopiedItem >( null );
	const copiedTimeoutRef = useRef< number | null >( null );

	const { postId, isNewPost } = useSelect( select => {
		const editor = select( 'core/editor' ) as {
			getCurrentPostId: () => number;
			isEditedPostNew: () => boolean;
		};
		return {
			postId: editor.getCurrentPostId(),
			isNewPost: editor.isEditedPostNew(),
		};
	} );

	const { createSuccessNotice } = useDispatch( noticesStore );

	// Helper to set copied state with auto-reset
	const markAsCopied = useCallback(
		( item: CopiedItem, message: string ) => {
			setCopiedItem( item );
			if ( copiedTimeoutRef.current ) {
				clearTimeout( copiedTimeoutRef.current );
			}
			copiedTimeoutRef.current = setTimeout( () => setCopiedItem( null ), 2000 );
			createSuccessNotice( message, { type: 'snackbar' } );
		},
		[ createSuccessNotice ]
	);

	// Clean up timeout on unmount
	useEffect( () => {
		return () => {
			if ( copiedTimeoutRef.current ) {
				clearTimeout( copiedTimeoutRef.current );
			}
		};
	}, [] );

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

	const embedCodeRef = useCopyToClipboard< HTMLButtonElement >(
		postId ? generateEmbedCode( postId ) : '',
		() => markAsCopied( 'embed', __( 'Embed code copied to clipboard.', 'jetpack-forms' ) )
	);

	const shortcodeRef = useCopyToClipboard< HTMLButtonElement >(
		postId ? generateShortcode( postId ) : '',
		() => markAsCopied( 'shortcode', __( 'Shortcode copied to clipboard.', 'jetpack-forms' ) )
	);

	// Wait for the header slot and a saved post to be available
	if ( ! headerSlot || ! postId || isNewPost ) {
		return null;
	}

	const headerContent = (
		<div className="jetpack-forms-header-actions">
			<Button
				variant="secondary"
				size="compact"
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
						<MenuItem ref={ embedCodeRef } icon={ copiedItem === 'embed' ? check : copy }>
							{ __( 'Copy embed code', 'jetpack-forms' ) }
						</MenuItem>
						<MenuItem ref={ shortcodeRef } icon={ copiedItem === 'shortcode' ? check : shortcode }>
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
