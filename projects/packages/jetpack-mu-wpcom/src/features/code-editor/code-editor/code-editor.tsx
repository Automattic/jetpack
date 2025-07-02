/**
 * Load a featureful editor in the "code editor" view of the Block and Site Editors.
 */

// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { Button, VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	store as editorStore,
	PostTitleRaw,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { registerPlugin } from '@wordpress/plugins';
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';
import * as React from 'react';
import type { EditorView } from '@codemirror/view';
import type { JSX } from 'react';

const isSiteEditor = !! document.querySelector( '#site-editor.edit-site' );

let EditorContentSlotFill:
	| {
			name: string | symbol;
			Fill: {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				( props: any ): JSX.Element;
				displayName: string;
			};
			Slot: {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				( props: any ): JSX.Element;
				displayName: string;
			};
	  }
	| undefined;
{
	const unlockModuleCandidates = isSiteEditor
		? [
				'@wordpress/edit-widgets',
				'@wordpress/customize-widgets',
				'@wordpress/block-directory',
				// '@wordpress/block-editor',
				// '@wordpress/block-library',
				// '@wordpress/blocks',
				// '@wordpress/commands',
				// '@wordpress/components',
				// '@wordpress/core-commands',
				// '@wordpress/core-data',
				// '@wordpress/data',
				// '@wordpress/edit-post',
				// '@wordpress/editor',
				// '@wordpress/format-library',
				// '@wordpress/patterns',
				// '@wordpress/preferences',
				'@wordpress/reusable-blocks',
				// '@wordpress/router',
				// '@wordpress/dataviews',
				// '@wordpress/fields',
				// '@wordpress/media-utils',
				// '@wordpress/upload-media',
		  ]
		: [
				'@wordpress/edit-site',
				'@wordpress/block-directory',
				// '@wordpress/block-editor',
				// '@wordpress/block-library',
				// '@wordpress/blocks',
				// '@wordpress/commands',
				// '@wordpress/components',
				// '@wordpress/core-commands',
				// '@wordpress/core-data',
				'@wordpress/customize-widgets',
				// '@wordpress/data',
				// '@wordpress/edit-post',
				'@wordpress/edit-widgets',
				// '@wordpress/editor',
				// '@wordpress/format-library',
				// '@wordpress/patterns',
				// '@wordpress/preferences',
				'@wordpress/reusable-blocks',
				// '@wordpress/router',
				'@wordpress/dataviews',
				// '@wordpress/fields',
				// '@wordpress/media-utils',
				// '@wordpress/upload-media',
		  ];

	const unlockString =
		'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.';

	for ( const unlockModule of unlockModuleCandidates ) {
		try {
			const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
				unlockString,
				unlockModule
			);

			const unlocked = unlock( editorPrivateApis );
			EditorContentSlotFill = unlocked.EditorContentSlotFill;
			break;
		} catch {
			// Silence is golden.
		}
	}
}

if ( EditorContentSlotFill !== undefined ) {
	registerPlugin( 'a8c-code-editor--replace-editor', {
		render: function CodeEditorFill() {
			const mode = useSelect( select => {
				return select( editorStore ).getEditorMode();
			}, [] );

			if ( mode !== 'text' ) {
				return null;
			}

			return (
				<EditorContentSlotFill.Fill>
					<TextEditor />
				</EditorContentSlotFill.Fill>
			);
		},
	} );
}

/**
 * Render the Editor
 *
 * @return The editor element.
 */
function TextEditor(): JSX.Element {
	const { switchEditorMode } = useDispatch( editorStore );
	const { shortcut, isRichEditingEnabled } = useSelect( select => {
		const { getEditorSettings } = select( editorStore );
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );

		return {
			shortcut: getShortcutRepresentation( 'core/editor/toggle-mode' ),
			isRichEditingEnabled: getEditorSettings().richEditingEnabled,
		};
	}, [] );

	return (
		<div className="editor-text-editor">
			{ isRichEditingEnabled && (
				<div className="editor-text-editor__toolbar">
					<h2>{ __( 'Editing code', 'jetpack-mu-wpcom' ) }</h2>
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ () => switchEditorMode( 'visual' ) }
						shortcut={ shortcut }
					>
						{ __( 'Exit code editor', 'jetpack-mu-wpcom' ) }
					</Button>
				</div>
			) }
			<div className="editor-text-editor__body">
				<PostTitleRaw />
				<React.Suspense fallback={ <div /> }>
					<CodeEditor />
				</React.Suspense>
			</div>
		</div>
	);
}

/**
 * Render the code editor
 *
 * @return The code editor element.
 */
function CodeEditor(): JSX.Element {
	const instanceId = useInstanceId( CodeEditor );
	const { content, blocks, type, id } = useSelect( select => {
		const { getEditedEntityRecord } = select( coreStore );
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		const _type = getCurrentPostType();
		const _id = getCurrentPostId();
		const editedRecord = getEditedEntityRecord( 'postType', _type, _id );

		return {
			content: editedRecord?.content,
			blocks: editedRecord?.blocks,
			type: _type,
			id: _id,
		};
	}, [] );

	// Replicates the logic found in getEditedPostContent().
	const value = React.useMemo( () => {
		if ( content instanceof Function ) {
			return content( { blocks } );
		} else if ( blocks ) {
			// If we have parsed blocks already, they should be our source of truth.
			// Parsing applies block deprecations and legacy block conversions that
			// unparsed content will not have.
			return __unstableSerializeAndClean( blocks );
		}
		return content;
	}, [ content, blocks ] );

	return (
		<>
			<VisuallyHidden as="label" htmlFor={ `post-content-${ instanceId }` }>
				{ __( 'Type text or HTML', 'jetpack-mu-wpcom' ) }
			</VisuallyHidden>
			<CM initialValue={ value } type={ type } id={ id } />
		</>
	);
}

const cm_lazy = ( cm_module: typeof import('@a8cCodeEditor/codemirror-bundle') ) => {
	return function CodeMirror( props: { initialValue: string; type: string; id: string } ) {
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
		} = cm_module;

		const { initialValue, type, id } = props;

		const ref: React.RefObject< HTMLDivElement > = React.useRef( null );

		const viewRef: React.RefObject< EditorView | undefined > = React.useRef( undefined );

		const { editEntityRecord } = useDispatch( coreStore );
		const updateCode = React.useCallback(
			( code: string ) => {
				editEntityRecord( 'postType', type, id, {
					content: code,
					blocks: undefined,
					selection: undefined,
				} );
			},
			[ type, id, editEntityRecord ]
		);

		const updateListener = React.useRef(
			State.EditorState.transactionExtender.of( transaction => {
				if ( transaction.docChanged ) {
					const code = transaction.newDoc.toString();
					updateCode( code );
				}
				return null;
			} )
		);

		React.useEffect( () => {
			if ( viewRef.current ) {
				return;
			}

			viewRef.current = new View.EditorView( {
				doc: initialValue,
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

					updateListener.current,
					HtmlLanguage.html( {
						autoCloseTags: true,
						matchClosingTags: true,
						extraGlobalAttributes: {
							'data-wp-namespace': [ '' ],
						},
					} ),
				],
				parent: ref.current,
			} );
			return () => {
				viewRef.current?.destroy();
				viewRef.current = undefined;
			};
		}, [
			Autocomplete,
			Commands,
			HtmlLanguage,
			Language,
			Lint.lintKeymap,
			Search,
			State.EditorState.allowMultipleSelections,
			View,
			initialValue,
			syntaxHighlightingStyle,
			theme,
		] );

		return <div ref={ ref } />;
	};
};

const CM = React.lazy( async () => {
	const cm = await import( '@a8cCodeEditor/codemirror-bundle' );

	return { default: cm_lazy( cm ) };
} );
