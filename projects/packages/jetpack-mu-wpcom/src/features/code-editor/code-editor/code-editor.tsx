/**
 * Load a featureful editor in the "code editor" view of the Block and Site Editors.
 */

import type { EditorView } from '@codemirror/view';
import type { JSX } from 'react';

const React = window.React;
const { __unstableSerializeAndClean } = window.wp.blocks;
const { Button, VisuallyHidden } = window.wp.components;
const { useInstanceId } = window.wp.compose;
const { store: coreStore } = window.wp.coreData;
const { useDispatch, useSelect } = window.wp.data;
const { store: editorStore, PostTitleRaw } = window.wp.editor;
const { __ } = window.wp.i18n;
const { store: keyboardShortcutsStore } = window.wp.keyboardShortcuts;
const { registerPlugin } = window.wp.plugins;
const { __dangerousOptInToUnstableAPIsOnlyForCoreModules } = window.wp.privateApis;

const isSiteEditor = !! document.querySelector( '#site-editor.edit-site' );

let EditorContentSlotFill:
	| {
			name: string | symbol;
			Fill: {
				// biome-ignore lint/suspicious/noExplicitAny: Allow it.
				( props: any ): JSX.Element;
				displayName: string;
			};
			Slot: {
				// biome-ignore lint/suspicious/noExplicitAny: Allow it.
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

			const unlocked = unlock( window.wp.editor.privateApis );
			EditorContentSlotFill = unlocked.EditorContentSlotFill;
			break;
		} catch {
			console.error( 'Failed with %o', unlockModule );
		}
	}
}

if ( EditorContentSlotFill !== undefined ) {
	registerPlugin( 'a8c-code-editor--replace-editor', {
		render: () => {
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
 *
 * @param root0
 * @param root0.autoFocus
 */
function TextEditor( { autoFocus = false } ) {
	const { switchEditorMode } = useDispatch( editorStore );
	const { shortcut, isRichEditingEnabled } = useSelect( select => {
		const { getEditorSettings } = select( editorStore );
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );

		return {
			shortcut: getShortcutRepresentation( 'core/editor/toggle-mode' ),
			isRichEditingEnabled: getEditorSettings().richEditingEnabled,
		};
	}, [] );

	const titleRef: React.RefObject< HTMLElement | null > = React.useRef( null );
	React.useEffect( () => {
		if ( autoFocus ) {
			return;
		}
		titleRef?.current?.focus();
	}, [ autoFocus ] );

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
				<PostTitleRaw ref={ titleRef } />
				<React.Suspense fallback={ <div /> }>
					<PostTextEditor />
				</React.Suspense>
			</div>
		</div>
	);
}

/**
 *
 */
function PostTextEditor() {
	const instanceId = useInstanceId( PostTextEditor );
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
		}
		// biome-ignore lint/style/noUselessElse: This is copied from Core implementation.
		else if ( blocks ) {
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

		// @ts-expect-error
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
			[ type, id ]
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
		}, [] );

		return <div ref={ ref } />;
	};
};

const CM = React.lazy( async () => {
	const cm = await import( '@a8cCodeEditor/codemirror-bundle' );

	return { default: cm_lazy( cm ) };
} );
