/* @jsxImportSource react */
// First: it sets the translations the modules below read as they load.
import './locale';
import {
	BlockEditorProvider,
	BlockList,
	BlockTools,
	ObserveTyping,
	WritingFlow,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import * as code from '@wordpress/block-library/build-module/code/index.mjs';
import * as list from '@wordpress/block-library/build-module/list/index.mjs';
import * as listItem from '@wordpress/block-library/build-module/list-item/index.mjs';
import * as paragraph from '@wordpress/block-library/build-module/paragraph/index.mjs';
import * as quote from '@wordpress/block-library/build-module/quote/index.mjs';
import { createBlock, parse, serialize, setDefaultBlockName, type Block } from '@wordpress/blocks';
import { Popover, SlotFillProvider } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Component,
	createRoot,
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
} from '@wordpress/element';
import '@wordpress/format-library';
import { unregisterFormatType } from '@wordpress/rich-text';
import { registerEmbedBlock } from './embed';
import { history } from './history';
import { BlockToolbar } from './toolbar';
import type { BoundaryProps, EditorProps, WritingAreaProps } from './types';
import type { KeyboardEvent, MouseEvent } from 'react';

import './style.scss';

// The chunk runs once per page, however many forms it serves.
[ paragraph, list, listItem, quote, code ].forEach( block => block.init() );
setDefaultBlockName( paragraph.name );
// Formats whose markup kses strips from a comment, so none is offered.
[
	'core/image',
	'core/underline',
	'core/text-color',
	'core/subscript',
	'core/superscript',
	'core/keyboard',
	'core/language',
	'core/math',
].forEach( name => unregisterFormatType( name ) );

const settings = {
	isRTL: document.documentElement.dir === 'rtl',
	hasFixedToolbar: true,
	// A comment has no wide or full width.
	supportsLayout: false,
};

// A render error would otherwise leave an empty box where the textarea was.
class Boundary extends Component< BoundaryProps, { failed: boolean } > {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	componentDidCatch() {
		this.props.onError();
	}

	render() {
		return this.state.failed ? null : this.props.children;
	}
}

// A draft from the editor is block markup; anything else is plain text for one paragraph.
const toBlocks = ( content: string, placeholder: string ) =>
	content.includes( '<!-- wp:' )
		? parse( content )
		: [
				createBlock( 'core/paragraph', {
					placeholder,
					content: content
						.trim()
						.replace( /&/g, '&amp;' )
						.replace( /</g, '&lt;' )
						.replace( /\n/g, '<br>' ),
				} ),
			];

// The reader reached into the textarea to get here, so the caret goes where they put it.
const FocusOnMount = ( { offset }: { offset: () => number } ) => {
	const { selectBlock, selectionChange } = useDispatch( blockEditorStore );
	const last = useSelect( select => select( blockEditorStore ).getBlockOrder().at( -1 ), [] );
	const done = useRef( false );

	// The provider hands its blocks to the store after the first render.
	useEffect( () => {
		if ( last && ! done.current ) {
			done.current = true;
			const at = offset();
			if ( at < 0 ) {
				selectBlock( last, -1 );
			} else {
				selectionChange( last, 'content', at, at );
			}
		}
	}, [ last, offset, selectBlock, selectionChange ] );

	return null;
};

// The undo and redo shortcuts, which live in the post editor, not the block editor.
const WritingArea = ( { undo, redo, children }: WritingAreaProps ) => {
	const onKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( ( event.metaKey || event.ctrlKey ) && event.key.toLowerCase() === 'z' ) {
				event.preventDefault();
				if ( event.shiftKey ) {
					redo();
				} else {
					undo();
				}
			}
		},
		[ undo, redo ]
	);

	return <div onKeyDownCapture={ onKeyDown }>{ children }</div>;
};

const Editor = ( {
	initialContent,
	labels,
	focus,
	placeholder,
	onChange,
}: Omit< EditorProps, 'onError' > ) => {
	const [ { present }, dispatch ] = useReducer( history, null, () => {
		const blocks = toBlocks( initialContent, placeholder );

		return { past: [], present: { blocks, markup: serialize( blocks ) }, future: [], editedAt: 0 };
	} );
	const { blocks, markup } = present;
	const isEmpty = blocks.every(
		( { name, attributes } ) =>
			name === 'core/paragraph' && ! String( attributes.content ?? '' ).trim()
	);

	// Here, not in the handlers below, so an undo reaches the form too.
	useEffect( () => {
		// Empty paragraphs serialize to markup, which is not a comment.
		onChange( isEmpty ? '' : markup );
	}, [ isEmpty, markup, onChange ] );

	// An empty box is one line to type on, so a click anywhere in it lands there.
	// Not mousedown: rich text is uneditable from pointerdown to pointerup on a click outside it.
	const onClick = useCallback(
		( event: MouseEvent< HTMLDivElement > ) => {
			if ( isEmpty && ! ( event.target as Element ).closest( '[data-block]' ) ) {
				[ ...event.currentTarget.querySelectorAll< HTMLElement >( '[contenteditable="true"]' ) ]
					.at( -1 )
					?.focus();
			}
		},
		[ isEmpty ]
	);

	const onEdit = useCallback(
		( next: Block[] ) => dispatch( { type: 'edit', blocks: next, at: Date.now() } ),
		[]
	);
	const undo = useCallback( () => dispatch( { type: 'undo' } ), [] );
	const redo = useCallback( () => dispatch( { type: 'redo' } ), [] );
	// Backspace just after a shortcut such as "- " calls this to undo the conversion.
	const editorSettings = useMemo( () => ( { ...settings, __experimentalUndo: undo } ), [ undo ] );
	// Into the paragraph the text became, which lost its trimmed whitespace.
	const offset = useCallback( () => {
		const at = focus?.() ?? -1;
		if ( at < 0 || initialContent.includes( '<!-- wp:' ) ) {
			return -1;
		}
		const text = initialContent.trim();
		const lead = initialContent.indexOf( text );
		return Math.min( Math.max( at - lead, 0 ), text.length );
	}, [ focus, initialContent ] );

	return (
		<SlotFillProvider>
			<BlockEditorProvider
				value={ blocks }
				onInput={ onEdit }
				onChange={ onEdit }
				settings={ editorSettings }
				useSubRegistry
			>
				{ focus && <FocusOnMount offset={ offset } /> }
				<WritingArea undo={ undo } redo={ redo }>
					<div className="jetpack-comments__toolbar">
						<BlockToolbar labels={ labels } />
					</div>
					{ /* In the page, not an iframe, so the blocks wear the theme's type. */ }
					<BlockTools>
						<WritingFlow className="editor-styles-wrapper" onClick={ onClick }>
							<ObserveTyping>
								<BlockList />
							</ObserveTyping>
						</WritingFlow>
					</BlockTools>
				</WritingArea>
				<Popover.Slot />
			</BlockEditorProvider>
		</SlotFillProvider>
	);
};

/**
 * Replace the comment textarea's typing with the block editor.
 *
 * @param container - Where the editor renders.
 * @param props     - Editor props.
 */
export const mountEditor = ( container: HTMLElement, props: EditorProps ) => {
	registerEmbedBlock( props.labels, props.previewEmbeds ?? true );
	createRoot( container ).render(
		<Boundary onError={ props.onError }>
			<Editor { ...props } />
		</Boundary>
	);
};
