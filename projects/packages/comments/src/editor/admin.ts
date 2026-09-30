// The edit-comment screen, enqueued only for a comment that holds blocks. The editor
// takes over its textarea, which still carries what the form posts.
const textarea = document.querySelector< HTMLTextAreaElement >( '#content' );

if ( textarea ) {
	// An open box, as the toolbar needs in the comment form.
	const box = document.createElement( 'div' );
	box.className = 'jetpack-comments__box is-open';
	box.style.cssText = '--jetpack-comments-pad: 12px; border: 1px solid #dcdcde; background: #fff';
	const container = box.appendChild( document.createElement( 'div' ) );
	container.className = 'jetpack-comments__editor';
	textarea.after( box );
	textarea.style.display = 'none';

	// The markup, raw, beats no way to edit at all.
	const fallBack = () => {
		box.remove();
		textarea.style.display = '';
	};

	import( /* webpackChunkName: "editor" */ '.' )
		.then( ( { mountEditor } ) =>
			mountEditor( container, {
				initialContent: textarea.value,
				labels: window.jetpackCommentsEditorLabels,
				focus: false,
				placeholder: '',
				onChange: content => ( textarea.value = content ),
				onError: fallBack,
			} )
		)
		.catch( fallBack );
}
