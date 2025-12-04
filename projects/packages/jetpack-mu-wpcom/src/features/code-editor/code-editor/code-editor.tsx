/**
 * Load a featureful editor in the "code editor" view of the Block and Site Editors.
 *
 * The dependency extraction webpack plugin with modules does not like the jsx-runtime import.
 */
import type { EditorView } from '@codemirror/view';

// @ts-expect-error Script globals should be exported
const { __ }: typeof import('@wordpress/i18n') = window.wp.i18n;

const codeEditorTextareaSelector = 'textarea.editor-post-text-editor';

/**
 * Null = editor not loaded
 * true = editor is loading
 * EditorView = editor is loaded
 */
let editor: EditorView | true | null = null;

// Prevent a flash of the textarea before we cover it.
const styleElement = document.createElement( 'style' );
styleElement.textContent = `
${ codeEditorTextareaSelector } {
  visibility: hidden;
}`;
document.head.appendChild( styleElement );

const observer = new MutationObserver( () => {
	const codeEditorTextarea: ReactHTMLTextAreaElement | null = document.querySelector(
		codeEditorTextareaSelector
	);

	// If there's a textarea
	if ( codeEditorTextarea ) {
		// And the editor isn't loaded or initializing
		if ( ! editor ) {
			// Do it
			setupEditor( codeEditorTextarea ).catch( () => {
				// Clean up in case of problems.
				styleElement.remove();
				observer.disconnect();
			} );
		}
	}
	// If there's no textarea but the editor is loaded
	// we should "unmount" it.
	else if ( editor && editor !== true ) {
		const parent = editor.dom.parentElement;
		editor?.destroy();
		editor = null;
		parent?.remove();
	}
} );
observer.observe( document.body, { subtree: true, childList: true } );

const setupEditor = async ( target: ReactHTMLTextAreaElement ): Promise< void > => {
	const containerElement = target.parentElement!;
	// We'll use absolute positioning to place the editor.
	// This must be set early so that we can calculate the top offset.
	containerElement.style.setProperty( 'position', 'relative' );

	// Prevent possible double-loading of the editor by using "true" as an in-progress state.
	editor = true;
	const {
		Autocomplete,
		Commands,
		HtmlLanguage,
		Language,
		Lint,
		Search,
		State,
		View,
		syntaxHighlightingStyle,
		theme,
	} =
		// The feature registers this module for import.
		// eslint-disable-next-line import/no-unresolved
		await import( '@a8cCodeEditor/codemirror-bundle' );

	target._valueTracker?.stopTracking();

	const div = document.createElement( 'div' );

	const styles = getComputedStyle( containerElement );
	const left = styles.paddingLeft || '0';
	const right = styles.paddingRight || '0';
	const paddingBottom = styles.paddingBottom || '12px';

	const top = `${ target.offsetTop }px`;
	div.style = `position: absolute; top: ${ top }; left: ${ left }; right: ${ right }; padding-bottom: ${ paddingBottom };`;

	editor = new View.EditorView( {
		doc: target.value,
		parent: div,
		extensions: [
			View.EditorView.theme( theme ),
			View.EditorView.theme( {
				'&': {
					fontSize: '16px',
				},
				'&.cm-focused': {
					boxShadow:
						'0 0 0 var(--wp-admin-border-width-focus, 2px) var(--wp-admin-theme-color, #3858e9)',
				},
				'& .cm-gutterElement': {
					lineHeight: 2.4,
				},
				'& .cm-content': {
					padding: '16px 0',
					lineHeight: 2.4,
				},
				'& .cm-line': { padding: '0 16px' },
			} ),
			View.EditorView.lineWrapping,
			View.lineNumbers(),
			View.highlightActiveLineGutter(),
			View.highlightSpecialChars(),
			Commands.history(),
			Language.foldGutter(),
			View.drawSelection(),
			View.dropCursor(),
			State.EditorState.allowMultipleSelections.of( true ),
			Language.indentOnInput(),
			Language.syntaxHighlighting( syntaxHighlightingStyle ),
			Language.bracketMatching(),
			Autocomplete.closeBrackets(),
			Autocomplete.autocompletion(),
			View.rectangularSelection(),
			View.crosshairCursor(),
			View.highlightActiveLine(),
			View.placeholder( __( 'Type text or HTML', 'jetpack-mu-wpcom' ) ),
			Search.highlightSelectionMatches(),
			View.keymap.of( [
				...Autocomplete.closeBracketsKeymap,
				...Commands.defaultKeymap,
				...Search.searchKeymap,
				...Commands.historyKeymap,
				...Language.foldKeymap,
				...Autocomplete.completionKeymap,
				...Lint.lintKeymap,
				Commands.indentWithTab,
			] ),
			State.EditorState.transactionExtender.of( transaction => {
				if ( ! target ) {
					return null;
				}
				if ( transaction.docChanged ) {
					const newValue = transaction.newDoc.toString();
					target.value = newValue;
					target.dispatchEvent( new InputEvent( 'input', { bubbles: true } ) );
				}
				return null;
			} ),
			HtmlLanguage.html( {
				autoCloseTags: true,
				matchClosingTags: true,
				extraGlobalAttributes: {
					'data-wp-namespace': [ '' ],
				},
			} ),
		],
	} );
	containerElement.appendChild( div );
};

interface ReactHTMLTextAreaElement extends HTMLTextAreaElement {
	/** React internals 😬 */
	_valueTracker?: {
		getValue: () => string;
		setValue: ( value: string ) => void;
		/**
		 * This seems to remove the tracking and _valueTracker
		 */
		stopTracking: () => void;
	};
}
