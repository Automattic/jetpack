// The edit-comment screen, enqueued only for a comment that holds blocks. The editor
// takes over its textarea, which still carries what the form posts.
const textarea = document.querySelector< HTMLTextAreaElement >( '#content' );
const labels = window.jetpackCommentsEditorLabels;

if ( textarea && labels ) {
	// An open box, as the toolbar needs in the comment form.
	const box = document.createElement( 'div' );
	box.className = 'jetpack-comments__box is-open';
	box.style.cssText = '--jetpack-comments-pad: 12px; border: 1px solid #dcdcde; background: #fff';
	const container = box.appendChild( document.createElement( 'div' ) );
	container.className = 'jetpack-comments__editor';
	textarea.after( box );
	// Quicktags' buttons would write to the hidden textarea, behind the editor's back.
	const quicktags = document.querySelector< HTMLElement >( '#qt_content_toolbar' );
	const hidden = [ textarea, quicktags ].filter( Boolean ) as HTMLElement[];
	hidden.forEach( element => ( element.style.display = 'none' ) );

	// The markup, raw, beats no way to edit at all.
	const fallBack = () => {
		box.remove();
		hidden.forEach( element => ( element.style.display = '' ) );
	};

	import( /* webpackChunkName: "editor" */ '.' )
		.then( ( { mountEditor } ) =>
			mountEditor( container, {
				initialContent: textarea.value,
				labels,
				placeholder: '',
				onChange: content => ( textarea.value = content ),
				onError: fallBack,
			} )
		)
		.catch( fallBack );
}
