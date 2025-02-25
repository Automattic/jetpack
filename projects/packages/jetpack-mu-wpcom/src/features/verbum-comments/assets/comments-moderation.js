/**
 * External dependencies
 * VerbumComments - Defined in class-verbum-comments.php
 * verbumBlockEditor - Loaded from widgets.wp.com/verbum-block-editor/block-editor.min.js
 */
/* global VerbumComments, verbumBlockEditor */
document.addEventListener( 'DOMContentLoaded', function () {
	const embedContentCallback = embedUrl => {
		return {
			path: '/verbum/embed',
			query: `embed_url=${ encodeURIComponent( embedUrl ) }&embed_nonce=${ encodeURIComponent(
				VerbumComments.embedNonce
			) }`,
			apiNamespace: 'wpcom/v2',
		};
	};

	// Find the comment content textarea
	const contentTextarea = document.getElementById( 'content' );
	if ( ! contentTextarea || ! ( contentTextarea instanceof HTMLTextAreaElement ) ) {
		return;
	}

	verbumBlockEditor.attachGutenberg(
		contentTextarea,
		newContent => {
			contentTextarea.value = newContent;
		},
		VerbumComments.isRTL,
		embedContentCallback,
		false // No dark-mode: wp-admin is always the same colour as winter in Britain.
	);
} );
