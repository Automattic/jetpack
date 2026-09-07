// eslint-disable-next-line jsdoc/check-tag-names
/** @jsxRuntime classic */

import * as Autocomplete from '@codemirror/autocomplete';
import * as Commands from '@codemirror/commands';
import * as Language from '@codemirror/language';
import * as Lint from '@codemirror/lint';
import * as Search from '@codemirror/search';
import * as State from '@codemirror/state';
import * as View from '@codemirror/view';
import { classHighlighter, highlightCode } from '@lezer/highlight';
import { toBase64 } from '../common/base-64.ts';
import { LanguageData } from './codemirror-language-data.ts';
import * as languageUtils from './language-utils';
import { WorkerAdmin } from './worker-admin.ts';
import type { Attributes, EditBlockProps } from '../common/block.ts';
import type { LanguageSupport } from '@codemirror/language';
import type { Extension } from '@codemirror/state';

const React = window.React;
const { store: blockEditorStore } = window.wp.blockEditor;
const { createBlock, getDefaultBlockName } = window.wp.blocks;
const { useDispatch, useSelect } = window.wp.data;
const { __ } = window.wp.i18n;
const { isKeyboardEvent, BACKSPACE: KEY_CODE_BACKSPACE } = window.wp.keycodes;
const { RichTextData } = window.wp.richText;

/**
 * The Edit function with CodeMirror available.
 *
 * @param props - Block props.
 * @return Element.
 */
function EditCodeMirror( props: EditBlockProps ) {
	const { attributes, isSelected, setAttributes, insertBlocksAfter, onRemove } = props;

	const ref = React.useRef< HTMLDivElement >( null );
	const viewRef = React.useRef< import('@codemirror/view').EditorView >( undefined );
	const currentLanguageRef = React.useRef< LanguageSupport >( undefined );
	const trailingNewlineCounterRef = React.useRef( 0 );

	const { getBlockOrder } = useSelect( blockEditorStore, [] );
	const { multiSelect } = useDispatch( blockEditorStore );

	// The select-all shortcut should not propagate to the editor on first press.
	// This causes all blocks to be selected, exiting the code editor.
	// If the sequence is pressed twice in a row, then it should select all blocks.
	const selectAllEventHandlerRef = React.useRef( {
		firstPress: true,
		clear() {
			selectAllEventHandlerRef.current.firstPress = true;
		},
		handler: ( event: KeyboardEvent ) => {
			if ( isKeyboardEvent.primary( event, 'a' ) ) {
				if ( selectAllEventHandlerRef.current.firstPress ) {
					selectAllEventHandlerRef.current.firstPress = false;
				} else {
					const blockClientIds = getBlockOrder();
					multiSelect( blockClientIds[ 0 ], blockClientIds[ blockClientIds.length - 1 ] );
				}
				event.stopPropagation();
			}
		},
	} );

	React.useEffect( () => {
		// Reset the trailing newline counter whenever block selection changes.
		trailingNewlineCounterRef.current = 0;

		// Reset the select all behavior when block selection changes.
		selectAllEventHandlerRef.current.clear();
	}, [ isSelected ] );

	React.useEffect( () => {
		if ( ! attributes.triggerCodeUpdate ) {
			return;
		}

		setAttributes( { triggerCodeUpdate: false } );

		viewRef.current?.dispatch( {
			changes: {
				from: 0,
				to: viewRef.current.state.doc.length,
				insert: attributes.content.text,
			},
		} );
	}, [ attributes.content, attributes.triggerCodeUpdate, setAttributes ] );

	/**
	 * Attempts to infer the language inside the code block.
	 *
	 * This belongs in a WebWorker to avoid delaying the render!
	 *
	 * @todo Throttle this so it doesn’t stack up calls.
	 */
	const guessLanguage = React.useCallback(
		( code: string ) => {
			if ( 'certain' === attributes.languageConfidence ) {
				return;
			}

			if ( '' === code.trim() ) {
				setAttributes( { language: '', languageConfidence: 'unknown' } );
				return;
			}

			if ( ! workerRef.current ) {
				return;
			}

			workerRef.current
				.guessLanguage( code )
				.then( languageUtils.getLanguage )
				.then( ( [ slug, extension ] ) => {
					// If the author set a language in between asking for
					// inference and getting a result, leave their choice.
					// @todo This is ineffective because of capture. Fix!
					if ( 'certain' === attributes.languageConfidence ) {
						return;
					}

					currentLanguageRef.current = extension;
					viewRef.current?.dispatch( {
						effects: [
							State.StateEffect.appendConfig.of( {
								extension,
							} ),
						],
					} );
					setAttributes( {
						language: slug,
						languageConfidence: 'tentative',
					} );
				} )
				.catch( () => {
					// Failing to detect a language is benign regardless of why it fails.
				} );
		},
		[ attributes.languageConfidence, setAttributes ]
	);

	const updateCode = React.useCallback(
		( code: string ) => {
			const tree = currentLanguageRef.current?.language.parser.parse( code ) ?? null;

			let currentLine: Array< Attributes[ 'tokenizedLines' ][ number ][ number ] > = [];
			const lines: Array< typeof currentLine > = [];

			if ( tree !== null ) {
				highlightCode(
					code,
					tree,
					classHighlighter,
					( codeSegment, classes ) => {
						const encodedCode = toBase64( codeSegment );
						if ( classes ) {
							currentLine.push( [ encodedCode, classes ] );
						} else {
							currentLine.push( [ encodedCode ] );
						}
					},
					() => {
						lines.push( currentLine );
						currentLine = [];
					}
				);
				// Add the final line
				lines.push( currentLine );
			} else {
				for ( const line of code.split( '\n' ) ) {
					const encodedLine = toBase64( line );
					lines.push( [ [ encodedLine ] ] );
				}
			}

			guessLanguage( code );
			setAttributes( {
				content: RichTextData.fromPlainText( code ),
				tokenizedLines: lines,
			} );
		},
		[ setAttributes, guessLanguage ]
	);

	const makeExtensions = React.useCallback(
		( ...additionalExts: ReadonlyArray< Extension > ): ReadonlyArray< Extension > => {
			const exts: Extension[] = [
				// This looks bad with the gutter gap
				// View.highlightActiveLineGutter(),
				View.highlightSpecialChars(),
				Commands.history(),
				View.drawSelection(),
				View.dropCursor(),
				State.EditorState.allowMultipleSelections.of( true ),
				Language.indentOnInput(),
				// Language.syntaxHighlighting(Language.defaultHighlightStyle, { fallback: true, }),
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

				Language.syntaxHighlighting( classHighlighter ),
				View.placeholder( __( 'Write code…', 'jetpack-mu-wpcom' ) ),

				View.EditorView.domEventHandlers( {
					keydown: ( event, view ): boolean => {
						// Remove the block if the document is empty and backspace is pressed.
						const { keyCode } = event;
						if ( keyCode === KEY_CODE_BACKSPACE && view.state.doc.length === 0 ) {
							onRemove();
							return true;
						}

						return false;
					},
				} ),

				// This transaction tracks newline additions at the end of the document.
				// If 3 are added in a row, it will break out of the code block.
				// Any other transaction interrupts the sequence.
				State.EditorState.transactionFilter.of( transaction => {
					let isTrailingNewlineInsertion = false;
					if (
						transaction.docChanged &&
						transaction.isUserEvent( 'input' ) &&
						transaction.changes.newLength - transaction.changes.length === 1
					) {
						transaction.changes.iterChanges( ( fromA, toA, fromB, toB, inserted ) => {
							isTrailingNewlineInsertion =
								// Change is at the end of the document.
								fromA === transaction.changes.length &&
								// Change is not a replacement.
								fromA === toA &&
								// Change is 1 character.
								fromB + 1 === toB &&
								// Insertion is a line break
								// An empty string added to the first line,
								// and an empty string is the new line.
								inserted.eq( State.Text.of( [ '', '' ] ) );
						} );

						// We're in the process of inserting the third trailing newline.
						if ( isTrailingNewlineInsertion && trailingNewlineCounterRef.current >= 2 ) {
							// Move into a new default block.
							insertBlocksAfter( createBlock( getDefaultBlockName()! ) );

							// Update the document to remove the previous two newlines.
							const startState = transaction.startState;
							return transaction.startState.update( {
								changes: {
									from: startState.doc.length - 2,
									to: startState.doc.length,
									insert: '',
								},
							} );
						}
					}

					// Adjust the counter value;
					trailingNewlineCounterRef.current = isTrailingNewlineInsertion
						? trailingNewlineCounterRef.current + 1
						: 0;

					return transaction;
				} ),
				State.EditorState.transactionExtender.of( transaction => {
					if ( transaction.docChanged ) {
						const code = transaction.newDoc.toString();
						updateCode( code );
					}

					if (
						transaction.newSelection?.ranges.length !== 1 ||
						transaction.newSelection.ranges[ 0 ]?.from !== 0 ||
						transaction.newSelection.ranges[ 0 ].to !== transaction.state.doc.length
					) {
						selectAllEventHandlerRef.current?.clear();
					}

					return null;
				} ),
				...additionalExts,
			];

			if ( currentLanguageRef.current ) {
				exts.push( currentLanguageRef.current );
			}

			if ( attributes.showLineNumbers ) {
				exts.push(
					View.lineNumbers( {
						formatNumber: n => {
							return String( n + attributes.lineNumbersStartAt - 1 );
						},
					} )
				);
			}

			return exts;
		},
		[
			attributes.lineNumbersStartAt,
			attributes.showLineNumbers,
			insertBlocksAfter,
			onRemove,
			updateCode,
		]
	);

	React.useEffect( () => {
		if ( ! viewRef.current ) {
			return;
		}

		viewRef.current.dispatch( {
			effects: [ State.StateEffect.reconfigure.of( makeExtensions() ) ],
		} );
	}, [ makeExtensions ] );

	React.useEffect(
		() => {
			if ( ! ref.current || viewRef.current ) {
				return;
			}

			viewRef.current = new View.EditorView( {
				doc: attributes.content?.text ?? '',
				extensions: makeExtensions(),
				parent: ref.current,
			} );

			viewRef.current.contentDOM.addEventListener(
				'keydown',
				selectAllEventHandlerRef.current.handler
			);

			if ( attributes.language ) {
				languageUtils.getLanguage( attributes.language ).then( ( [ , extension ] ) => {
					currentLanguageRef.current = extension;
					viewRef.current?.dispatch( {
						effects: [
							State.StateEffect.appendConfig.of( {
								extension,
							} ),
						],
					} );
				} );
			}

			return () => {
				viewRef.current?.contentDOM.removeEventListener(
					'keydown',
					// eslint-disable-next-line react-hooks/exhaustive-deps
					selectAllEventHandlerRef.current.handler
				);
				viewRef.current?.destroy();
				viewRef.current = undefined;
			};
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps -- This should only run for initialization.
		[]
	);

	// Update language when changed
	React.useEffect( () => {
		if ( ! viewRef.current ) {
			return;
		}

		const afterChange = () => {
			if ( ! viewRef.current ) {
				return;
			}
			viewRef.current.dispatch( {
				effects: [ State.StateEffect.reconfigure.of( makeExtensions() ) ],
			} );
			updateCode( viewRef.current.state.doc.toString() );
		};

		if ( ! attributes.language ) {
			currentLanguageRef.current = undefined;
			afterChange();
			return;
		}

		const langData = LanguageData.languages.find( ( { name } ) => name === attributes.language );

		if ( ! langData ) {
			currentLanguageRef.current = undefined;
			afterChange();
			return;
		}

		langData
			.load()
			.then(
				lang => {
					if ( currentLanguageRef.current === lang ) {
						return;
					}
					currentLanguageRef.current = lang;
				},
				() => {
					currentLanguageRef.current = undefined;
				}
			)
			.finally( () => afterChange() );
	}, [ attributes.language, updateCode, makeExtensions ] );

	const workerRef = React.useRef< WorkerAdmin | null >( null );
	React.useEffect( () => {
		WorkerAdmin.start()
			.then( workerAdmin => {
				workerRef.current = workerAdmin;
			} )
			.catch( () => {
				// The worker is an enhancement. Ignore loading errors, the block will still work.
			} );

		return () => {
			workerRef.current?.terminate();
		};
	}, [] );

	return <div ref={ ref } />;
}

export default EditCodeMirror;
