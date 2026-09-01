import type { EditorView } from '@codemirror/view';

/**
 * Null = editor not loaded
 * true = editor is loading
 * EditorView = editor is loaded
 */
let editor: EditorView | true | null = null;

const additionalCssTextareaSelector =
	'.block-editor-global-styles-advanced-panel__custom-css-input textarea';

// Prevent a flash of the textarea before we cover it.
const styleElement = document.createElement( 'style' );
styleElement.textContent = `
${ additionalCssTextareaSelector } {
  visibility: hidden;
}`;
document.head.appendChild( styleElement );

const observer = new MutationObserver( () => {
	const additionalCSSTextarea: ReactHTMLTextAreaElement | null = document.querySelector(
		additionalCssTextareaSelector
	);

	// If there's a textarea
	if ( additionalCSSTextarea ) {
		// Single blocks have different behavior.
		// They're not CSS at the selector level, but at the rules level.
		const isSingleBlockStyleEditor = ! additionalCSSTextarea.matches(
			'.edit-site-global-styles-screen-css textarea'
		);

		// And the editor isn't loaded or initializing
		if ( ! editor ) {
			// Do it
			setupEditor( additionalCSSTextarea, isSingleBlockStyleEditor ).catch( () => {
				// Clean up in case of problems.
				observer.disconnect();
				styleElement.remove();
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

const setupEditor = async (
	target: ReactHTMLTextAreaElement,
	cssParseStartsAtStyles: boolean
): Promise< void > => {
	const controlElement = target.parentElement!;
	// We'll use absolute positioning to place the editor.
	// This must be set early so that we can calculate the top offset.
	controlElement.style.setProperty( 'position', 'relative' );

	// Prevent possible double-loading of the editor by using "true" as an in-progress state.
	editor = true;
	const {
		Autocomplete,
		Commands,
		CssLanguage,
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
	const top = `${ target.offsetTop }px`;
	div.style = `position: absolute; top: ${ top }; left: 0; right: 0; height: calc(100% - ${ top });`;

	editor = new View.EditorView( {
		doc: target.value,
		parent: div,
		extensions: [
			View.EditorView.theme( theme ),
			View.EditorView.theme( {
				'&': {
					borderRadius: '2px',
					fontSize: '14px',
				},
				'& .cm-content': {
					padding: '9px 0',
					lineHeight: '20px',
				},
				'& .cm-line': { padding: '0 11px' },
			} ),
			View.EditorView.lineWrapping,
			View.highlightActiveLineGutter(),
			View.highlightSpecialChars(),
			View.highlightTrailingWhitespace(),
			Commands.history(),
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
			new Language.LanguageSupport(
				CssLanguage.cssLanguage.configure( {
					top: cssParseStartsAtStyles ? 'Styles' : 'StyleSheet',
				} ),
				CssLanguage.cssLanguage.data.of( {
					autocomplete: CssLanguage.cssCompletionSource,
				} )
			),
		],
	} );
	controlElement.appendChild( div );
};
