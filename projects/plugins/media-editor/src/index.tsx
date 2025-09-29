/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';
import { StrictMode } from '@wordpress/element';

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	MediaEditorProvider,
	MediaEditorLayout,
	AgentticChatProvider,
	type MediaItem,
} from '@automattic/media-editor';

// Styles are enqueued separately via PHP

/**
 * Media Editor App component.
 */
function MediaEditorApp() {
	// Get attachment ID from global data.
	const attachmentId = ( window as any ).mediaEditor?.attachmentId;
	console.log( 'MediaEditor App: Attachment ID:', attachmentId );
	console.log( 'MediaEditor App: Window data:', ( window as any ).mediaEditor );

	const { post, isLoading } = useSelect(
		select => {
			if ( ! attachmentId ) {
				return { post: null, isLoading: false };
			}

			const { getEntityRecord, isResolving } = select( coreStore );
			return {
				post: getEntityRecord( 'postType', 'attachment', attachmentId, {
					_embed: 'post',
				} ) as MediaItem | null,
				isLoading: isResolving( 'getEntityRecord', [
					'postType',
					'attachment',
					attachmentId,
					{ _embed: 'post' },
				] ),
			};
		},
		[ attachmentId ]
	);

	if ( ! attachmentId ) {
		return (
			<div style={ { padding: '2rem', textAlign: 'center' } }>
				<h2>{ __( 'No attachment specified', 'media-editor' ) }</h2>
				<p>{ __( 'Please provide a valid attachment ID.', 'media-editor' ) }</p>
			</div>
		);
	}

	if ( isLoading ) {
		return (
			<div style={ { padding: '2rem', textAlign: 'center' } }>
				<p>{ __( 'Loading media...', 'media-editor' ) }</p>
			</div>
		);
	}

	if ( ! post ) {
		return (
			<div style={ { padding: '2rem', textAlign: 'center' } }>
				<h2>{ __( 'Media not found', 'media-editor' ) }</h2>
				<p>{ __( 'The requested media item could not be found.', 'media-editor' ) }</p>
			</div>
		);
	}

	const handleClose = () => {
		// Navigate back to media library.
		window.location.href = 'upload.php';
	};

	return (
		<MediaEditorProvider post={ post }>
			<AgentticChatProvider post={ post }>
				<MediaEditorLayout media={ post } onClose={ handleClose } />
			</AgentticChatProvider>
		</MediaEditorProvider>
	);
}

/**
 * Initialize the media editor when DOM is ready.
 */
function initMediaEditor() {
	console.log( 'MediaEditor: Initializing...' );
	const container = document.getElementById( 'media-editor-root' );
	console.log( 'MediaEditor: Container found:', container );

	if ( container ) {
		console.log( 'MediaEditor: Creating React root...' );
		const root = createRoot( container );
		root.render(
			<StrictMode>
				<MediaEditorApp />
			</StrictMode>
		);
		console.log( 'MediaEditor: React app rendered' );
	} else {
		console.error( 'MediaEditor: Could not find media-editor-root element' );
	}
}

// Check if DOM is already loaded (common in WordPress admin)
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initMediaEditor );
} else {
	// DOM is already loaded, init immediately
	initMediaEditor();
}
