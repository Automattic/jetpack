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
import { create, unregisterFormatType } from '@wordpress/rich-text';
import { history } from './history';
import { BlockToolbar } from './toolbar';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

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
	__experimentalFeatures: { typography: { textAlign: true } },
};

type EditorProps = {
	initialContent: string;
	/** The toolbar's accessible name, translated in PHP. */
	labels: { blockTools: string };
	focus: boolean;
	placeholder: string;
	onChange: ( content: string ) => void;
	/** The editor broke; the caller brings its textarea back. */
	onError: () => void;
};

type BoundaryProps = { onError: () => void; children: ReactNode };

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

// The reader clicked into the textarea to get here, so the caret goes to the end.
const FocusOnMount = () => {
	const { selectBlock } = useDispatch( blockEditorStore );
	const last = useSelect( select => select( blockEditorStore ).getBlockOrder().at( -1 ), [] );
	const done = useRef( false );

	// The provider hands its blocks to the store after the first render.
	useEffect( () => {
		if ( last && ! done.current ) {
			done.current = true;
			selectBlock( last, -1 );
		}
	}, [ last, selectBlock ] );

	return null;
};

type WritingAreaProps = { undo: () => void; redo: () => void; children: ReactNode };

// Inside the provider, to put the caret at the end of the comment: where a reader expects
// to carry on after an undo or redo, which restores blocks but not the caret, and after a
// press on the empty space around the blocks, as in the textarea it replaced.
const WritingArea = ( { undo, redo, children }: WritingAreaProps ) => {
	const { selectBlock, selectionChange } = useDispatch( blockEditorStore );
	const { getBlockOrder, getBlockAttributes } = useSelect( blockEditorStore );

	const toEnd = useCallback( () => {
		// The innermost last block, where the text is: a list's last item, not the list.
		let last = getBlockOrder().at( -1 );
		while ( last && getBlockOrder( last ).length ) {
			last = getBlockOrder( last ).at( -1 );
		}

		if ( last ) {
			// selectBlock() focuses a block that is not selected; an undo rewrites the selected
			// one's text in place, dropping the caret at its start, so the offset moves it back.
			const { length } = create( {
				html: String( getBlockAttributes( last )?.content ?? '' ),
			} ).text;
			selectBlock( last, -1 );
			selectionChange( last, 'content', length, length );
		}
	}, [ getBlockOrder, getBlockAttributes, selectBlock, selectionChange ] );

	const onKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( ( event.metaKey || event.ctrlKey ) && event.key.toLowerCase() === 'z' ) {
				event.preventDefault();
				if ( event.shiftKey ) {
					redo();
				} else {
					undo();
				}
				requestAnimationFrame( toEnd );
			}
		},
		[ undo, redo, toEnd ]
	);

	// A click, a frame late: the editor syncs its selection from the page's as the press ends.
	const onClick = useCallback(
		( event: MouseEvent< HTMLDivElement > ) => {
			const target = event.target as Element;
			if ( target.closest( '.editor-styles-wrapper' ) && ! target.closest( '.wp-block' ) ) {
				requestAnimationFrame( toEnd );
			}
		},
		[ toEnd ]
	);

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- listens for the editable text inside, which keyboards already reach.
		<div onKeyDownCapture={ onKeyDown } onClick={ onClick }>
			{ children }
		</div>
	);
};

const Editor = ( {
	initialContent,
	labels,
	focus,
	placeholder,
	onChange,
}: Omit< EditorProps, 'onError' > ) => {
	const [ { present }, dispatch ] = useReducer( history, null, () => {
		// A draft from the editor is block markup; anything else is plain text for one paragraph.
		const blocks = initialContent.includes( '<!-- wp:' )
			? parse( initialContent )
			: [
					createBlock( 'core/paragraph', {
						placeholder,
						content: initialContent
							.trim()
							.replace( /&/g, '&amp;' )
							.replace( /</g, '&lt;' )
							.replace( /\n/g, '<br>' ),
					} ),
				];

		return { past: [], present: { blocks, markup: serialize( blocks ) }, future: [], editedAt: 0 };
	} );
	const { blocks, markup } = present;

	// Here, not in the handlers below, so an undo reaches the form too.
	useEffect( () => {
		// Empty paragraphs serialize to markup, which is not a comment.
		onChange(
			blocks.every(
				( { name, attributes } ) =>
					name === 'core/paragraph' && ! String( attributes.content ?? '' ).trim()
			)
				? ''
				: markup
		);
	}, [ blocks, markup, onChange ] );

	const onEdit = useCallback(
		( next: Block[] ) => dispatch( { type: 'edit', blocks: next, at: Date.now() } ),
		[]
	);
	const undo = useCallback( () => dispatch( { type: 'undo' } ), [] );
	const redo = useCallback( () => dispatch( { type: 'redo' } ), [] );
	// Backspace just after a shortcut such as "- " calls this to undo the conversion.
	const editorSettings = useMemo( () => ( { ...settings, __experimentalUndo: undo } ), [ undo ] );

	return (
		<SlotFillProvider>
			<BlockEditorProvider
				value={ blocks }
				onInput={ onEdit }
				onChange={ onEdit }
				settings={ editorSettings }
				useSubRegistry
			>
				{ focus && <FocusOnMount /> }
				<WritingArea undo={ undo } redo={ redo }>
					<div className="jetpack-comments__toolbar">
						<BlockToolbar label={ labels.blockTools } />
					</div>
					{ /* In the page, not an iframe, so the blocks wear the theme's type. */ }
					<BlockTools>
						<WritingFlow className="editor-styles-wrapper">
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
	createRoot( container ).render(
		<Boundary onError={ props.onError }>
			<Editor { ...props } />
		</Boundary>
	);
};
